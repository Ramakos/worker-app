import { useState, useEffect, useRef } from 'react';
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

  const handleUndoLastItem = (tableId: string) => {
    const targetTable = tables.find(t => t.id === tableId);
    const lastItem = targetTable?.items[targetTable.items.length - 1];
    setTables(prev => prev.map(t => {
      if (t.id !== tableId) return t;
      const items = [...t.items];
      items.pop();
      return { ...t, items };
    }));
    if (lastItem) {
      toast.info('Item Undone', `Removed last added: ${lastItem.name}`);
    }
  };

  const handleClearItems = (tableId: string) => {
    const targetTable = tables.find(t => t.id === tableId);
    setTables(prev => prev.map(t => {
      if (t.id !== tableId) return t;
      return { ...t, items: [] };
    }));
    toast.warning('Items Cleared', `Cleared all items for ${targetTable?.tableName || 'table'}`);
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

  const grandTotal = tables.reduce((sum, t) => sum + getTableTotal(t), 0);

  const executeConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction === 'undo' && confirmTableId) handleUndoLastItem(confirmTableId);
    if (confirmAction === 'clear' && confirmTableId) handleClearItems(confirmTableId);
    if (confirmAction === 'clearAll') handleClearAll();
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
    itemInputRef,
    getTableTotal,
    handleAddTable,
    handleDeleteTable,
    handleClearAll,
    handleAddItem,
    handleRemoveItem,
    handleUndoLastItem,
    handleClearItems,
    handleUpdateQuantity,
    handleUpdateNotes,
    getTimeSince,
    grandTotal,
    executeConfirm,
  };
};
