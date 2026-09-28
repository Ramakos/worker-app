import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../Toast';
import { useAuth } from '../../hooks/useAuth';
import { recordWorkerActivity } from '../../lib/workerActivity';
import { TableOrder, TableLineItem, ConfirmAction } from './types';

const STORAGE_KEY = 'activeTables';

export const useActiveTables = () => {
  const toast = useToast();
  const { currentWorker } = useAuth();
  const [tables, setTables] = useState<TableOrder[]>([]);
  const [newTable, setNewTable] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [summaryTable, setSummaryTable] = useState<TableOrder | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [confirmTableId, setConfirmTableId] = useState<string | null>(null);
  const [isSettling, setIsSettling] = useState(false);

  const itemInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setTables(JSON.parse(saved));
      } catch {
        setTables([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tables));
  }, [tables]);

  const getTableTotal = (table: TableOrder): number => {
    return table.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleAddTable = () => {
    if (!newTable.trim()) return;
    const name = newTable.trim();
    const table: TableOrder = {
      id: Date.now().toString(),
      tableName: name,
      items: [],
      notes: '',
      timestamp: Date.now(),
    };
    setTables(prev => [...prev, table]);
    setNewTable('');
    setExpandedId(table.id);
    setJustAddedId(table.id);
    setTimeout(() => setJustAddedId(null), 600);
    toast.success('Table Added', `${name} is ready for order taking`);

    if (currentWorker) {
      recordWorkerActivity(currentWorker.id, {
        type: 'table_order',
        title: `Opened ${name}`,
        details: 'Ready for order taking',
      });
    }
  };

  const handleDeleteTable = (id: string) => {
    const table = tables.find(t => t.id === id);
    const tableName = table ? table.tableName : 'Table';
    const total = table ? getTableTotal(table) : 0;
    setTables(prev => prev.filter(t => t.id !== id));
    if (expandedId === id) setExpandedId(null);
    toast.info('Table Closed', `${tableName} has been removed`);

    if (currentWorker) {
      recordWorkerActivity(currentWorker.id, {
        type: 'table_order',
        title: `Closed ${tableName}`,
        details: `${table?.items.length || 0} item(s) • GH₵ ${total.toFixed(2)}`,
        amount: total,
      });
    }
  };

  const handleClearAll = () => {
    const count = tables.length;
    setTables([]);
    setExpandedId(null);
    toast.warning('Tables Reset', `Cleared ${count} active table${count !== 1 ? 's' : ''}`);
  };

  const handleAddItem = (tableId: string) => {
    const price = parseFloat(newItemPrice);
    if (!newItemName.trim() || isNaN(price) || price < 0) {
      toast.error('Invalid Item', 'Please enter a valid item name and price');
      return;
    }

    const itemName = newItemName.trim();
    const qty = newItemQty;
    const targetTable = tables.find(t => t.id === tableId);

    setTables(prev => prev.map(t => {
      if (t.id !== tableId) return t;
      const newItem: TableLineItem = {
        id: Date.now().toString(),
        name: itemName,
        price,
        quantity: qty,
      };
      return { ...t, items: [...t.items, newItem] };
    }));

    toast.success('Item Added', `${qty}x ${itemName} (GHS ${(price * qty).toFixed(2)}) ${targetTable ? `to ${targetTable.tableName}` : ''}`);

    if (currentWorker) {
      recordWorkerActivity(currentWorker.id, {
        type: 'table_order',
        title: `${targetTable?.tableName || 'Table'}: Added ${qty}x ${itemName}`,
        details: `GH₵ ${(price * qty).toFixed(2)}`,
        amount: price * qty,
      });
    }

    setNewItemName('');
    setNewItemPrice('');
    itemInputRef.current?.focus();
  };

  const handleRemoveItem = (tableId: string, itemId: string) => {
    const targetTable = tables.find(t => t.id === tableId);
    const item = targetTable?.items.find(i => i.id === itemId);
    setTables(prev => prev.map(t => {
      if (t.id !== tableId) return t;
      return { ...t, items: t.items.filter(i => i.id !== itemId) };
    }));
    if (item) {
      toast.info('Item Removed', `Removed ${item.name} from ${targetTable?.tableName || 'table'}`);
    }
  };

  const handleUpdateQuantity = (tableId: string, itemId: string, delta: number) => {
    setTables(prev => prev.map(t => {
      if (t.id !== tableId) return t;
      return {
        ...t,
        items: t.items.map(i => {
          if (i.id !== itemId) return i;
          const newQty = Math.max(1, i.quantity + delta);
          return { ...i, quantity: newQty };
        }),
      };
    }));
  };

  const handleUpdateNotes = (tableId: string, notes: string) => {
    setTables(prev => prev.map(t => (t.id === tableId ? { ...t, notes } : t)));
    setEditingNotesId(null);
    toast.success('Notes Updated', notes ? 'Special table instructions saved' : 'Table instructions cleared');
  };

  const getTimeSince = (timestamp: number): string => {
    const mins = Math.floor((Date.now() - timestamp) / 60000);
    if (mins < 1) return 'Just now';
    if (mins === 1) return '1 min';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h`;
  };

  const handleSettleTable = async (table: TableOrder): Promise<boolean> => {
    if (!table.items.length) {
      toast.error('Cannot Settle', 'Table has no items to settle.');
      return false;
    }

    const isDevMode =
      localStorage.getItem('devMode') === 'true' ||
      currentWorker?.id === '00000000-0000-0000-0000-000000000001';

    // 1. Check if user is authenticated with Supabase
    const { data: sessionData } = await supabase.auth.getSession();
    const sessionUser = sessionData?.session?.user;

    // If completely unauthenticated and not in dev mode, prompt sign in
    if (!sessionUser && !isDevMode) {
      toast.error(
        'Sign In Required',
        'You must be signed in with your staff account to settle tables and sync cash sales to the counter.'
      );
      return false;
    }

    setIsSettling(true);
    try {
      const total = getTableTotal(table);

      // 2. Dev mode simulation: close table locally without failing remote RLS
      if (isDevMode && !sessionUser) {
        setTables(prev => prev.filter(t => t.id !== table.id));
        if (expandedId === table.id) setExpandedId(null);
        setSummaryTable(null);

        if (currentWorker) {
          recordWorkerActivity(currentWorker.id, {
            type: 'table_order',
            title: `Settled ${table.tableName} (Dev Mode)`,
            details: `${table.items.length} item(s) • GH₵ ${total.toFixed(2)} (Simulated)`,
            amount: total,
            status: 'served',
          });
        }

        toast.success(
          'Table Settled (Dev Mode) 💰',
          `${table.tableName} closed locally. In production, signing in with your staff account credits GH₵ ${total.toFixed(2)} and syncs with the counter.`
        );
        return true;
      }

      // 3. Authenticated live settlement
      const effectiveWorkerId = sessionUser?.id || currentWorker?.id || null;
      const orderItems = table.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      }));

      const insertData: any = {
        status: 'served',
        order_type: 'dinein',
        mode: 'dine_in',
        customer_name: table.tableName,
        items: orderItems,
        total_paid: total,
        claimed_by: effectiveWorkerId,
        created_by: effectiveWorkerId,
        claimed_at: new Date().toISOString(),
        ready_at: new Date().toISOString(),
        payment_method: 'cash',
        source: 'worker_app',
      };

      const { data, error } = await (supabase as any)
        .from('orders')
        .insert(insertData)
        .select('id')
        .single();

      if (error) throw error;

      if (effectiveWorkerId && data?.id) {
        // Credit worker sales
        const { error: woError } = await supabase.from('worker_orders').insert({
          order_id: data.id,
          worker_id: effectiveWorkerId,
          action: 'served',
          amount: total,
          mode: 'dine_in',
        });
        if (woError) {
          console.error('Error logging worker_orders for table settlement:', woError);
        }

        recordWorkerActivity(effectiveWorkerId, {
          type: 'table_order',
          title: `Settled ${table.tableName}`,
          details: `${table.items.length} item(s) • GH₵ ${total.toFixed(2)} (Cash sent to counter)`,
          amount: total,
          order_id: data.id,
          status: 'served',
        });
      }

      // Remove settled table from active list
      setTables(prev => prev.filter(t => t.id !== table.id));
      if (expandedId === table.id) setExpandedId(null);
      setSummaryTable(null);

      toast.success(
        'Table Settled! 💰',
        `${table.tableName} closed. GH₵ ${total.toFixed(2)} credited to your sales.`
      );
      return true;
    } catch (err: any) {
      console.error('Failed to settle table:', err);
      const isAuthError =
        err?.code === '42501' ||
        err?.status === 401 ||
        err?.message?.includes('row-level security') ||
        err?.message?.includes('Unauthorized') ||
        err?.message?.includes('JWT');

      if (isAuthError) {
        toast.error(
          'Sign In Required',
          'Your staff session has expired or you are not signed in. Please sign in with your staff account to settle tables.'
        );
      } else {
        toast.error('Settlement Failed', err.message || 'Could not settle table. Please try again.');
      }
      return false;
    } finally {
      setIsSettling(false);
    }
  };

  const grandTotal = tables.reduce((sum, t) => sum + getTableTotal(t), 0);

  const executeConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction === 'deleteTable' && confirmTableId) handleDeleteTable(confirmTableId);
    setConfirmAction(null);
    setConfirmTableId(null);
  };

  return {
    tables,
    newTable,
    setNewTable,
    expandedId,
    setExpandedId,
    editingNotesId,
    setEditingNotesId,
    editNotes,
    setEditNotes,
    justAddedId,
    newItemName,
    setNewItemName,
    newItemPrice,
    setNewItemPrice,
    newItemQty,
    setNewItemQty,
    summaryTable,
    setSummaryTable,
    confirmAction,
    setConfirmAction,
    confirmTableId,
    setConfirmTableId,
    isSettling,
    itemInputRef,
    getTableTotal,
    handleAddTable,
    handleDeleteTable,
    handleAddItem,
    handleRemoveItem,
    handleUpdateQuantity,
    handleUpdateNotes,
    handleSettleTable,
    getTimeSince,
    grandTotal,
    executeConfirm,
  };
};
