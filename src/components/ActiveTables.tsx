import { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, ChevronDown, Undo, RotateCcw, Minus, Hash, Receipt, Clock, CreditCard as Edit3, Check, Eye, Printer, AlertTriangle } from 'lucide-react';

export interface TableLineItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface TableOrder {
  id: string;
  tableName: string;
  items: TableLineItem[];
  notes: string;
  timestamp: number;
}

const STORAGE_KEY = 'activeTables';

type ConfirmAction = 'undo' | 'clear' | 'clearAll' | 'deleteTable' | null;

export const ActiveTables = () => {
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
    const table: TableOrder = {
      id: Date.now().toString(),
      tableName: newTable.trim(),
      items: [],
      notes: '',
      timestamp: Date.now(),
    };
    setTables([...tables, table]);
    setNewTable('');
    setExpandedId(table.id);
    setJustAddedId(table.id);
    setTimeout(() => setJustAddedId(null), 600);
  };

  const handleDeleteTable = (id: string) => {
    setTables(tables.filter(t => t.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const handleClearAll = () => {
    setTables([]);
    setExpandedId(null);
  };

  const handleAddItem = (tableId: string) => {
    const price = parseFloat(newItemPrice);
    if (!newItemName.trim() || isNaN(price) || price < 0) return;

    setTables(tables.map(t => {
      if (t.id !== tableId) return t;
      const newItem: TableLineItem = {
        id: Date.now().toString(),
        name: newItemName.trim(),
        price,
        quantity: newItemQty,
      };
      return { ...t, items: [...t.items, newItem] };
    }));

    setNewItemName('');
    setNewItemPrice('');
    itemInputRef.current?.focus();
  };

  const handleRemoveItem = (tableId: string, itemId: string) => {
    setTables(tables.map(t => {
      if (t.id !== tableId) return t;
      return { ...t, items: t.items.filter(i => i.id !== itemId) };
    }));
  };

  const handleUndoLastItem = (tableId: string) => {
    setTables(tables.map(t => {
      if (t.id !== tableId) return t;
      const items = [...t.items];
      items.pop();
      return { ...t, items };
    }));
  };

  const handleClearItems = (tableId: string) => {
    setTables(tables.map(t => {
      if (t.id !== tableId) return t;
      return { ...t, items: [] };
    }));
  };

  const handleUpdateQuantity = (tableId: string, itemId: string, delta: number) => {
    setTables(tables.map(t => {
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
    setTables(tables.map(t => t.id === tableId ? { ...t, notes } : t));
    setEditingNotesId(null);
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

  const confirmConfig: Record<Exclude<ConfirmAction, null>, { title: string; message: string; confirmLabel: string }> = {
    undo: {
      title: 'Undo Last Item?',
      message: 'This will remove the most recently added item from this table.',
      confirmLabel: 'Undo',
    },
    clear: {
      title: 'Clear All Items?',
      message: 'This will remove all items from this table. You will need to re-add them.',
      confirmLabel: 'Clear All',
    },
    clearAll: {
      title: 'Clear All Tables?',
      message: 'This will remove every table and all their items. This cannot be undone.',
      confirmLabel: 'Clear All Tables',
    },
    deleteTable: {
      title: 'Remove This Table?',
      message: 'This will permanently remove the table and all its items.',
      confirmLabel: 'Remove Table',
    },
  };

  const executeConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction === 'undo' && confirmTableId) handleUndoLastItem(confirmTableId);
    if (confirmAction === 'clear' && confirmTableId) handleClearItems(confirmTableId);
    if (confirmAction === 'clearAll') handleClearAll();
    if (confirmAction === 'deleteTable' && confirmTableId) handleDeleteTable(confirmTableId);
    setConfirmAction(null);
    setConfirmTableId(null);
  };

  return (
    <div className="space-y-3">
      {/* Add New Table - Quick Add */}
      <div className="card-elevated p-3 scale-in">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-brand">
            <Plus className="w-5 h-5 text-primary-foreground" />
          </div>
          <input
            type="text"
            value={newTable}
            onChange={(e) => setNewTable(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTable()}
            placeholder="Add table (e.g. Table 4)"
            className="input flex-1 bg-muted/50 border-border h-11 text-sm"
          />
          <button
            onClick={handleAddTable}
            disabled={!newTable.trim()}
            className="btn btn-primary px-4 py-2.5 h-11 text-sm disabled:opacity-40 disabled:cursor-not-allowed shrink-0 haptic"
          >
            Add Table
          </button>
        </div>
      </div>

      {/* Empty State */}
      {tables.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
            <Hash className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">No active tables</p>
          <p className="text-muted-foreground/70 text-sm mt-1">Add a table above to get started</p>
        </div>
      ) : (
        <>
          {/* Tables List */}
          <div className="space-y-2">
            {tables.map((table, index) => {
              const total = getTableTotal(table);
              const isExpanded = expandedId === table.id;
              const isJustAdded = justAddedId === table.id;

              return (
                <div
                  key={table.id}
                  className={`card overflow-hidden transition-all duration-300 ${isJustAdded ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Table Header */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : table.id)}
                    className="w-full p-4 flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center flex-shrink-0 group-hover:from-secondary group-hover:to-accent transition-colors">
                        <span className="font-bold text-muted-foreground group-hover:text-primary transition-colors">
                          T{tables.indexOf(table) + 1}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground truncate">{table.tableName}</span>
                          <span className="badge badge-neutral text-[10px]">
                            <Clock className="w-3 h-3 mr-1" />
                            {getTimeSince(table.timestamp)}
                          </span>
                        </div>
                        {table.items.length > 0 && (
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-sm text-muted-foreground">{table.items.length} item{table.items.length !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Total & Expand */}
                    <div className="flex items-center gap-3">
                      {table.items.length > 0 && (
                        <div className="text-right">
                          <div className="text-lg font-bold text-foreground">
                            GHS {total.toFixed(2)}
                          </div>
                        </div>
                      )}
                      <div className={`w-8 h-8 rounded-lg bg-muted flex items-center justify-center transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-border/50 px-4 pb-4 bg-gradient-to-b from-muted/30 to-card space-y-3">
                      {/* Quick Item Entry */}
                      <div className="pt-3">
                        <div className="bg-card rounded-xl border border-border p-3 space-y-2 shadow-sm">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <Receipt className="w-3.5 h-3.5" />
                            <span className="font-medium">Add Item</span>
                          </div>
                          <div className="flex gap-2">
                            <input
                              ref={itemInputRef}
                              type="text"
                              value={newItemName}
                              onChange={(e) => setNewItemName(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && newItemPrice && handleAddItem(table.id)}
                              placeholder="Item name"
                              className="input flex-1 text-sm"
                            />
                            <input
                              type="number"
                              value={newItemPrice}
                              onChange={(e) => setNewItemPrice(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && newItemName && handleAddItem(table.id)}
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              className="input w-24 text-sm text-right"
                            />
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            {/* Quantity Stepper */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-muted-foreground mr-1">Qty</span>
                              <button
                                onClick={() => setNewItemQty(Math.max(1, newItemQty - 1))}
                                disabled={newItemQty <= 1}
                                className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/70 flex items-center justify-center transition-colors disabled:opacity-40 haptic"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-8 text-center font-semibold text-foreground">{newItemQty}</span>
                              <button
                                onClick={() => setNewItemQty(newItemQty + 1)}
                                className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/70 flex items-center justify-center transition-colors haptic"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            <button
                              onClick={() => handleAddItem(table.id)}
                              disabled={!newItemName || !newItemPrice}
                              className="btn btn-primary px-4 py-2 text-sm disabled:opacity-40 haptic"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Items List */}
                      {table.items.length > 0 && (
                        <div className="space-y-2 pt-1">
                          {table.items.map((item, idx) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-3 bg-card rounded-xl border border-border/50 fade-in"
                              style={{ animationDelay: `${idx * 30}ms` }}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-foreground text-sm truncate">{item.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  GHS {item.price.toFixed(2)} each
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleUpdateQuantity(table.id, item.id, -1)}
                                  className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/70 flex items-center justify-center haptic"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="w-7 text-center font-semibold text-sm">{item.quantity}</span>
                                <button
                                  onClick={() => handleUpdateQuantity(table.id, item.id, 1)}
                                  className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/70 flex items-center justify-center haptic"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                                <div className="w-px h-6 bg-border mx-1" />
                                <span className="font-semibold text-foreground w-16 text-right text-sm">
                                  {(item.price * item.quantity).toFixed(2)}
                                </span>
                                <button
                                  onClick={() => handleRemoveItem(table.id, item.id)}
                                  className="w-8 h-8 rounded-lg hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors haptic"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Summary */}
                      {table.items.length > 0 && (
                        <div className="bg-card rounded-xl border border-border p-3 space-y-2 shadow-sm">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="font-medium text-foreground">GHS {total.toFixed(2)}</span>
                          </div>

                          {/* Total */}
                          <div className="flex justify-between pt-2 border-t border-border/50">
                            <span className="font-semibold text-foreground">Total</span>
                            <span className="text-xl font-bold text-primary">GHS {total.toFixed(2)}</span>
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      <div>
                        {editingNotesId === table.id ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleUpdateNotes(table.id, editNotes)}
                              placeholder="Add a note..."
                              className="input flex-1 text-sm"
                              autoFocus
                            />
                            <button
                              onClick={() => handleUpdateNotes(table.id, editNotes)}
                              className="btn btn-primary px-3 py-2 haptic"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingNotesId(table.id);
                              setEditNotes(table.notes);
                            }}
                            className="w-full flex items-center gap-2 text-left px-4 py-3 bg-muted hover:bg-muted/70 rounded-xl text-sm text-muted-foreground transition-colors haptic"
                          >
                            <Edit3 className="w-4 h-4" />
                            <span className="flex-1 truncate">{table.notes || 'Add note...'}</span>
                          </button>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => {
                            setConfirmAction('undo');
                            setConfirmTableId(table.id);
                          }}
                          disabled={table.items.length === 0}
                          className="flex-1 btn btn-outline py-2.5 text-sm disabled:opacity-40 haptic"
                        >
                          <Undo className="w-4 h-4" />
                          <span>Undo</span>
                        </button>
                        <button
                          onClick={() => {
                            setConfirmAction('clear');
                            setConfirmTableId(table.id);
                          }}
                          disabled={table.items.length === 0}
                          className="flex-1 btn btn-outline py-2.5 text-sm disabled:opacity-40 haptic"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Clear</span>
                        </button>
                      </div>

                      {/* View Summary */}
                      {table.items.length > 0 && (
                        <button
                          onClick={() => setSummaryTable(table)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-secondary hover:bg-accent text-secondary-foreground rounded-xl text-sm font-medium transition-colors haptic"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Summary</span>
                        </button>
                      )}

                      {/* Delete Table */}
                      <button
                        onClick={() => {
                          setConfirmAction('deleteTable');
                          setConfirmTableId(table.id);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-destructive/10 hover:bg-destructive/20 border border-destructive/30 text-destructive rounded-xl text-sm font-medium transition-colors haptic"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Remove Table</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary Footer */}
          <div className="card p-4 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{tables.length} active table{tables.length !== 1 ? 's' : ''}</p>
                <p className="text-xl font-bold text-foreground mt-0.5">
                  GHS {grandTotal.toFixed(2)} total
                </p>
              </div>
              <button
                onClick={() => setConfirmAction('clearAll')}
                className="btn text-destructive bg-destructive/10 hover:bg-destructive/20 px-4 py-2.5 text-sm haptic"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Receipt-style Summary Modal */}
      {summaryTable && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40 backdrop-blur-sm"
          onClick={() => setSummaryTable(null)}
        >
          <div
            className="bg-card w-full max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Receipt Header */}
            <div className="sticky top-0 bg-card px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Order Summary</h3>
              </div>
              <button
                onClick={() => setSummaryTable(null)}
                className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/70 flex items-center justify-center transition-colors haptic"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Receipt Body */}
            <div className="px-5 py-4 space-y-4">
              {/* Table info */}
              <div className="text-center pb-3 border-b border-dashed border-border">
                <p className="font-semibold text-foreground text-lg">{summaryTable.tableName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(summaryTable.timestamp).toLocaleDateString()} ·{' '}
                  {new Date(summaryTable.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                {summaryTable.notes && (
                  <p className="text-xs text-muted-foreground italic mt-1">"{summaryTable.notes}"</p>
                )}
              </div>

              {/* Items */}
              <div className="space-y-1.5">
                {summaryTable.items.map(item => (
                  <div key={item.id} className="flex items-start justify-between text-sm">
                    <div className="flex gap-2 flex-1 min-w-0">
                      <span className="font-medium text-foreground flex-shrink-0">{item.quantity}x</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">GHS {item.price.toFixed(2)} each</p>
                      </div>
                    </div>
                    <span className="font-medium text-foreground ml-2">
                      GHS {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-1.5 pt-3 border-t border-dashed border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">GHS {getTableTotal(summaryTable).toFixed(2)}</span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="flex justify-between items-center pt-3 border-t-2 border-border">
                <span className="font-semibold text-foreground">Total</span>
                <span className="text-2xl font-bold text-primary">GHS {getTableTotal(summaryTable).toFixed(2)}</span>
              </div>

              {/* Item count */}
              <div className="text-center pt-2">
                <p className="text-xs text-muted-foreground">
                  {summaryTable.items.reduce((sum, i) => sum + i.quantity, 0)} item{summaryTable.items.reduce((sum, i) => sum + i.quantity, 0) !== 1 ? 's' : ''} · {summaryTable.items.length} line{summaryTable.items.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-card px-5 py-4 border-t border-border flex gap-2 safe-bottom">
              <button
                onClick={() => window.print()}
                className="flex-1 btn btn-outline py-2.5 text-sm haptic"
              >
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>
              <button
                onClick={() => setSummaryTable(null)}
                className="flex-1 btn btn-primary py-2.5 text-sm haptic"
              >
                <Check className="w-4 h-4" />
                <span>Done</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40 backdrop-blur-sm"
          onClick={() => { setConfirmAction(null); setConfirmTableId(null); }}
        >
          <div
            className="bg-card w-full max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <h3 className="font-semibold text-foreground">{confirmConfig[confirmAction].title}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{confirmConfig[confirmAction].message}</p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => { setConfirmAction(null); setConfirmTableId(null); }}
                className="flex-1 btn btn-outline py-2.5 text-sm haptic"
              >
                Cancel
              </button>
              <button
                onClick={executeConfirm}
                className="flex-1 btn btn-destructive py-2.5 text-sm haptic"
              >
                {confirmConfig[confirmAction].confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
