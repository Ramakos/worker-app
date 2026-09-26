import React, { useState } from 'react';
import { Table2, Plus, X, Check, ShoppingBag, Clock } from 'lucide-react';
import { TableOrder } from '../activeTables/types';
import { PickedItem } from './types';

interface SelectTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: TableOrder[];
  itemsToAdd: PickedItem[] | { name: string; price: number; quantity?: number }[];
  totalAmount: number;
  onSelectTable: (tableId: string, isNew?: boolean, newTableName?: string) => void;
}

export const SelectTableModal: React.FC<SelectTableModalProps> = ({
  isOpen,
  onClose,
  tables,
  itemsToAdd,
  totalAmount,
  onSelectTable,
}) => {
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTableName, setNewTableName] = useState('');

  if (!isOpen) return null;

  const handleCreateNewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newTableName.trim() || `Table ${tables.length + 1}`;
    onSelectTable('', true, name);
    setIsCreatingNew(false);
    setNewTableName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md bg-card border border-border shadow-2xl rounded-3xl overflow-hidden animate-in slide-in-from-bottom-6">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Table2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-sm leading-tight">Select Target Table</h3>
              <p className="text-[11px] text-muted-foreground">
                Adding {itemsToAdd.length} item{itemsToAdd.length !== 1 ? 's' : ''} (GHS {totalAmount.toFixed(2)})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {/* Items Preview Chip */}
          <div className="bg-muted/40 rounded-xl p-2.5 border border-border/50 text-xs">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              <ShoppingBag className="w-3 h-3" /> Items to Add
            </div>
            <div className="flex flex-wrap gap-1.5">
              {itemsToAdd.map((it, idx) => (
                <span
                  key={idx}
                  className="bg-card border border-border/80 px-2 py-0.5 rounded-md text-foreground text-[11px] font-medium"
                >
                  {it.name} <strong className="text-primary font-mono ml-0.5">GHS {it.price.toFixed(2)}</strong>
                </span>
              ))}
            </div>
          </div>

          {/* New Table Form */}
          {isCreatingNew ? (
            <form
              onSubmit={handleCreateNewSubmit}
              className="bg-muted/50 p-3 rounded-2xl border border-primary/40 space-y-2.5 animate-in fade-in"
            >
              <div className="text-xs font-semibold text-foreground">Create & Assign to New Table</div>
              <input
                type="text"
                autoFocus
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                placeholder={`e.g. Table ${tables.length + 1} or VIP 2`}
                className="input w-full text-sm bg-card"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="btn btn-ghost px-3 py-1.5 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary px-4 py-1.5 text-xs font-semibold haptic"
                >
                  Confirm Table
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => {
                setIsCreatingNew(true);
                setNewTableName(`Table ${tables.length + 1}`);
              }}
              className="w-full py-2.5 px-3.5 border-2 border-dashed border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 rounded-2xl flex items-center justify-center gap-2 text-primary text-xs font-bold transition-all haptic"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create & Add to New Table</span>
            </button>
          )}

          {/* Active Tables List */}
          <div className="space-y-1.5 pt-1">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
              Active Tables ({tables.length})
            </div>

            {tables.length === 0 && !isCreatingNew ? (
              <div className="p-4 text-center rounded-2xl bg-muted/30 border border-border/50 text-xs text-muted-foreground">
                No active tables open. Tap <strong>"+ Create & Add to New Table"</strong> above.
              </div>
            ) : (
              tables.map((t) => {
                const total = t.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
                return (
                  <button
                    key={t.id}
                    onClick={() => onSelectTable(t.id)}
                    className="w-full p-3 bg-card hover:bg-muted/70 border border-border/70 hover:border-primary rounded-2xl flex items-center justify-between text-left transition-all group haptic shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center font-bold text-xs text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        T
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground text-sm truncate">{t.tableName}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                          <span>{t.items.length} item{t.items.length !== 1 ? 's' : ''}</span>
                          <span>•</span>
                          <span className="font-mono font-medium text-foreground">GHS {total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-primary text-xs font-bold px-2.5 py-1 rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      <span>Add</span>
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
