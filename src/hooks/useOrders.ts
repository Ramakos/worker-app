import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Order } from '../types';
import { recordWorkerActivity } from '../lib/workerActivity';

const ORDERS_CACHE_KEY = 'cached_orders';

export const useOrders = (workerId?: string) => {
  // Synchronously load cached orders from localStorage for immediate offline display
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const cached = localStorage.getItem(ORDERS_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {}
    return [];
  });
  const [isLoading, setIsLoading] = useState(false);

  const saveOrdersToCache = (newOrders: Order[]) => {
    try {
      // Guard localStorage quota by caching the 50 most recent orders
      localStorage.setItem(ORDERS_CACHE_KEY, JSON.stringify(newOrders.slice(0, 50)));
    } catch {}
  };

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedOrders = data?.map(order => ({
        ...order,
        items: Array.isArray(order.items) ? order.items.map((item: any, index: number) => ({
          id: `${order.id}-${index}`,
          name: item.name || item.menu_item_name || 'Unknown Item',
          quantity: item.quantity || 1,
          price: item.price || 0,
          modifiers: item.modifiers || item.special_instructions,
        })) : [],
        status: mapOrderStatus(order.status),
      })) || [];

      setOrders(formattedOrders);
      saveOrdersToCache(formattedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const mapOrderStatus = (status: string): 'pending' | 'preparing' | 'ready' | 'served' => {
    if (!status) return 'pending';
    switch (status.toLowerCase()) {
      case 'pending': return 'pending';
      case 'in_kitchen':
      case 'preparing': return 'preparing';
      case 'ready': return 'ready';
      case 'served': return 'served';
      default: return 'pending';
    }
  };

  const logWorkerOrder = async (
    orderId: number,
    action: string,
    wId: string,
    amount?: number | null,
    mode?: string | null,
  ) => {
    const insertData: any = { order_id: orderId, worker_id: wId, action };
    if (amount !== undefined) insertData.amount = amount;
    if (mode !== undefined) insertData.mode = mode;

    const { error } = await supabase.from('worker_orders').insert(insertData);
    if (error) {
      console.error(`Error logging ${action} action:`, error);
      const queue = JSON.parse(localStorage.getItem('pendingWorkerOrders') || '[]');
      queue.push(insertData);
      localStorage.setItem('pendingWorkerOrders', JSON.stringify(queue));
    }
  };

  useEffect(() => {
    const flushPending = async () => {
      const queue = JSON.parse(localStorage.getItem('pendingWorkerOrders') || '[]');
      if (queue.length === 0) return;
      const remaining: any[] = [];
      for (const entry of queue) {
        const { error } = await supabase.from('worker_orders').insert(entry);
        if (error) remaining.push(entry);
      }
      localStorage.setItem('pendingWorkerOrders', JSON.stringify(remaining));
    };
    flushPending();
  }, []);

  const updateOrderStatus = async (orderId: number, status: Order['status']) => {
    try {
      const updateData: any = { status };
      
      if (status === 'ready') {
        updateData.ready_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      const order = orders.find(o => o.id === orderId);
      const totalPaid = order?.total_paid
        ?? (order?.items?.reduce((sum, i) => sum + i.price * i.quantity, 0) || null)
        ?? null;
      const mode = order?.mode ?? order?.order_type ?? null;

      if (status === 'served' && workerId) {
        await logWorkerOrder(orderId, 'served', workerId, totalPaid, mode);
      }

      // Record activity locally
      if (workerId) {
        recordWorkerActivity(workerId, {
          type: 'order_status',
          title: `Order #${orderId} ${status === 'served' ? 'Served' : status === 'ready' ? 'Ready for Pickup' : 'Moved to Preparing'}`,
          details: totalPaid ? `GH₵ ${Number(totalPaid).toFixed(2)} (${order?.order_type || 'Order'})` : undefined,
          status,
          order_id: orderId,
          amount: totalPaid,
        });
      }

      setOrders(prev => {
        const updated = prev.map(o =>
          o.id === orderId ? { ...o, status, ready_at: updateData.ready_at || o.ready_at } : o
        );
        saveOrdersToCache(updated);
        return updated;
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error updating order status:', error);
      return { success: false, error: error.message || 'Failed to update order status' };
    }
  };

  const claimOrder = async (orderId: number, wId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          claimed_by: wId,
          claimed_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      await logWorkerOrder(orderId, 'claimed', wId);

      const order = orders.find(o => o.id === orderId);

      // Record activity locally
      recordWorkerActivity(wId, {
        type: 'order_claimed',
        title: `Claimed Order #${orderId}`,
        details: order ? `${order.items?.length || 0} item(s) • ${order.order_type || 'Order'}` : undefined,
        order_id: orderId,
        amount: order?.total_paid || null,
        status: order?.status,
      });

      setOrders(prev => {
        const updated = prev.map(o =>
          o.id === orderId ? {
            ...o,
            claimed_by: wId,
            claimed_at: new Date().toISOString()
          } : o
        );
        saveOrdersToCache(updated);
        return updated;
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error claiming order:', error);
      return { success: false, error: error.message || 'Failed to claim order' };
    }
  };

  const personalOrders = workerId 
    ? orders.filter(order => order.claimed_by === workerId)
    : [];

  useEffect(() => {
    fetchOrders();

    const subscription = supabase
      .channel('orders')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    allOrders: orders,
    personalOrders,
    isLoading,
    updateOrderStatus,
    assignOrder: claimOrder,
    refreshOrders: fetchOrders,
  };
};
