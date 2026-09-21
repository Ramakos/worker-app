import React from 'react';
import {
  ChevronDown,
  Clock,
  Receipt,
  Minus,
  Plus,
  X,
  CreditCard as Edit3,
  Check,
  Undo,
  RotateCcw,
  Eye,
  Trash2,
} from 'lucide-react';
import { TableOrder } from './types';

interface TableCardProps {
  table: TableOrder;
  tableNumber: number;
  isExpanded: boolean;
  isJustAdded: boolean;
  total: number;
  timeSince: string;
  onToggleExpand: () => void;
  newItemName: string;
  setNewItemName: (val: string) => void;
  newItemPrice: string;
  setNewItemPrice: (val: string) => void;
  newItemQty: number;
  setNewItemQty: React.Dispatch<React.SetStateAction<number>>;
  itemInputRef: React.RefObject<HTMLInputElement>;
  onAddItem: () => void;
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onRemoveItem: (itemId: string) => void;
  isEditingNotes: boolean;
  onStartEditNotes: () => void;
  editNotes: string;
  setEditNotes: (val: string) => void;
  onSaveNotes: (notes: string) => void;
  onUndo: () => void;
  onClear: () => void;
  onViewSummary: () => void;
  onDelete: () => void;
}

export const TableCard: React.FC<TableCardProps> = ({
  table,
  tableNumber,
  isExpanded,
  isJustAdded,
  total,
  timeSince,
  onToggleExpand,
  newItemName,
  setNewItemName,
  newItemPrice,
  setNewItemPrice,
  newItemQty,
  setNewItemQty,
  itemInputRef,
  onAddItem,
  onUpdateQuantity,
  onRemoveItem,
  isEditingNotes,
  onStartEditNotes,
  editNotes,
  setEditNotes,
  onSaveNotes,
  onUndo,
  onClear,
  onViewSummary,
  onDelete,
}) => {
  return (
    <div
      className={`card overflow-hidden transition-all duration-300 ${isJustAdded ? 'ring-2 ring-primary ring-offset-2' : ''}`}
      style={{ animationDelay: `${(tableNumber - 1) * 50}ms` }}
    >
      {/* Table Header */}
      <button
        onClick={onToggleExpand}
        className="w-full p-4 flex items-center justify-between group"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center flex-shrink-0 group-hover:from-secondary group-hover:to-accent transition-colors">
            <span className="font-bold text-muted-foreground group-hover:text-primary transition-colors">
              T{tableNumber}
            </span>
          </div>

          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground truncate">{table.tableName}</span>
              <span className="badge badge-neutral text-[10px]">
                <Clock className="w-3 h-3 mr-1" />
                {timeSince}
              </span>
            </div>
            {table.items.length > 0 && (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm text-muted-foreground">
                  {table.items.length} item{table.items.length !== 1 ? 's' : ''}
                </span>
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
          <div
            className={`w-8 h-8 rounded-lg bg-muted flex items-center justify-center transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          >
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
                  onKeyDown={(e) => e.key === 'Enter' && newItemPrice && onAddItem()}
                  placeholder="Item name"
                  className="input flex-1 text-sm"
                />
                <input
                  type="number"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && newItemName && onAddItem()}
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
                  onClick={onAddItem}
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
                      onClick={() => onUpdateQuantity(item.id, -1)}
                      className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/70 flex items-center justify-center haptic"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-7 text-center font-semibold text-sm">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, 1)}
                      className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/70 flex items-center justify-center haptic"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px h-6 bg-border mx-1" />
                    <span className="font-semibold text-foreground w-16 text-right text-sm">
                      {(item.price * item.quantity).toFixed(2)}
                    </span>
                    <button
                      onClick={() => onRemoveItem(item.id)}
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
            {isEditingNotes ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onSaveNotes(editNotes)}
                  placeholder="Add a note..."
                  className="input flex-1 text-sm"
                  autoFocus
                />
                <button
                  onClick={() => onSaveNotes(editNotes)}
                  className="btn btn-primary px-3 py-2 haptic"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onStartEditNotes}
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
              onClick={onUndo}
              disabled={table.items.length === 0}
              className="flex-1 btn btn-outline py-2.5 text-sm disabled:opacity-40 haptic"
            >
              <Undo className="w-4 h-4" />
              <span>Undo</span>
            </button>
            <button
              onClick={onClear}
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
              onClick={onViewSummary}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-secondary hover:bg-accent text-secondary-foreground rounded-xl text-sm font-medium transition-colors haptic"
            >
              <Eye className="w-4 h-4" />
              <span>View Summary</span>
            </button>
          )}

          {/* Delete Table */}
          <button
            onClick={onDelete}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-destructive/10 hover:bg-destructive/20 border border-destructive/30 text-destructive rounded-xl text-sm font-medium transition-colors haptic"
          >
            <Trash2 className="w-4 h-4" />
            <span>Remove Table</span>
          </button>
        </div>
      )}
    </div>
  );
};
