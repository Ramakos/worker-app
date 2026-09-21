import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { WorkerActivityItem } from '../types';
import {
  getWorkerActivities,
  recordWorkerActivity,
  clearWorkerActivities,
  calculateWorkerActivityStats,
  WorkerActivityStats,
} from '../lib/workerActivity';

export const useWorkerActivity = (workerId?: string) => {
  const [activities, setActivities] = useState<WorkerActivityItem[]>(() => {
    if (!workerId) return [];
    return getWorkerActivities(workerId);
  });

  const syncBackendActivities = useCallback(async () => {
    if (!workerId) return;

    try {
      // 1. Fetch worker order logs from Supabase
      const { data: woData } = await supabase
        .from('worker_orders')
        .select('*')
        .eq('worker_id', workerId)
        .order('created_at', { ascending: false })
        .limit(80);

      // 2. Fetch float transactions from Supabase
      const { data: floatData } = await supabase
        .from('float_transactions')
        .select('*')
        .eq('user_id', workerId)
        .order('created_at', { ascending: false })
        .limit(40);

      const backendItems: WorkerActivityItem[] = [];

      (woData || []).forEach(o => {
        const isServed = o.action === 'served';
        backendItems.push({
          id: `sb_wo_${o.id}`,
          worker_id: workerId,
          timestamp: o.created_at,
          type: isServed ? 'order_status' : 'order_claimed',
          title: isServed ? `Order #${o.order_id} Served` : `Claimed Order #${o.order_id}`,
          amount: o.amount ? Number(o.amount) : null,
          order_id: o.order_id,
          status: isServed ? 'served' : 'in_kitchen',
          synced: true,
        });
      });

      (floatData || []).forEach(f => {
        const isTake = f.transaction_type === 'take';
        backendItems.push({
          id: `sb_fl_${f.id}`,
          worker_id: workerId,
          timestamp: f.created_at,
          type: isTake ? 'float_taken' : 'float_returned',
          title: `${isTake ? 'Took Float' : 'Returned Float'}: GH₵ ${Number(f.amount).toFixed(2)}`,
          amount: Number(f.amount),
          synced: true,
        });
      });

      const localItems = getWorkerActivities(workerId);
      const combined = [...localItems];

      for (const bItem of backendItems) {
        const isDuplicate = localItems.some(
          l => (l.order_id && l.order_id === bItem.order_id && l.type === bItem.type) ||
               (l.type === bItem.type && Math.abs(new Date(l.timestamp).getTime() - new Date(bItem.timestamp).getTime()) < 30000)
        );
        if (!isDuplicate) {
          combined.push(bItem);
        }
      }

      combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(combined.slice(0, 150));
    } catch (error) {
      console.error('Error syncing backend activities:', error);
    }
  }, [workerId]);

  const refresh = useCallback(() => {
    if (!workerId) {
      setActivities([]);
      return;
    }
    setActivities(getWorkerActivities(workerId));
    syncBackendActivities();
  }, [workerId, syncBackendActivities]);

  useEffect(() => {
    refresh();

    const handleCustomUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ workerId: string }>;
      if (!workerId || customEvent.detail?.workerId === workerId) {
        setActivities(getWorkerActivities(workerId));
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key.includes('worker_activity_')) {
        setActivities(getWorkerActivities(workerId));
      }
    };

    window.addEventListener('worker-activity-updated', handleCustomUpdate);
    window.addEventListener('storage', handleStorage);

    if (!workerId) return;

    const channelWo = supabase
      .channel(`timeline_wo_${workerId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'worker_orders', filter: `worker_id=eq.${workerId}` },
        () => { syncBackendActivities(); }
      )
      .subscribe();

    const channelFl = supabase
      .channel(`timeline_fl_${workerId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'float_transactions', filter: `user_id=eq.${workerId}` },
        () => { syncBackendActivities(); }
      )
      .subscribe();

    return () => {
      window.removeEventListener('worker-activity-updated', handleCustomUpdate);
      window.removeEventListener('storage', handleStorage);
      channelWo.unsubscribe();
      channelFl.unsubscribe();
    };
  }, [workerId, refresh, syncBackendActivities]);

  const addActivity = useCallback(
    (item: Omit<WorkerActivityItem, 'id' | 'timestamp' | 'worker_id'>) => {
      if (!workerId) return null;
      const recorded = recordWorkerActivity(workerId, item);
      refresh();
      return recorded;
    },
    [workerId, refresh]
  );

  const clear = useCallback(() => {
    if (!workerId) return;
    clearWorkerActivities(workerId);
    refresh();
  }, [workerId, refresh]);

  const stats: WorkerActivityStats = useMemo(() => {
    return calculateWorkerActivityStats(activities);
  }, [activities]);

  return {
    activities,
    stats,
    addActivity,
    clearActivities: clear,
    refresh,
  };
};
