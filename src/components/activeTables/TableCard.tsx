import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ChevronDown,
  Clock,
  Receipt,
  Minus,
  Plus,
  X,
  CreditCard as Edit3,
  Check,
  Eye,
  Trash2,
} from 'lucide-react';
import { TableOrder } from './types';
import { useMenuSuggestions } from '../../hooks/useMenuSuggestions';

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
  onViewSummary,
  onDelete,
}) => {
  const { getSuggestions } = useMenuSuggestions();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    if (!newItemName.trim() || !showSuggestions) return [];
    return getSuggestions(newItemName);
  }, [newItemName, showSuggestions, getSuggestions]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        itemInputRef.current &&
        !itemInputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [itemInputRef]);

  const handleSelectSuggestion = (item: { name: string; price: number }) => {
    setNewItemName(item.name);
    setNewItemPrice(item.price > 0 ? item.price.toFixed(2) : '');
    setShowSuggestions(false);
    setFocusedSuggestionIndex(-1);
  };

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
              <div className="flex gap-2 relative">
                <div className="flex-1 relative">
                  <input
                    ref={itemInputRef}
                    type="text"
                    value={newItemName}
                    onChange={(e) => {
                      setNewItemName(e.target.value);
                      setShowSuggestions(true);
                      setFocusedSuggestionIndex(-1);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={(e) => {
                      if (showSuggestions && suggestions.length > 0) {
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setFocusedSuggestionIndex((prev) => (prev + 1) % suggestions.length);
                          return;
                        }
                        if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setFocusedSuggestionIndex(
                            (prev) => (prev - 1 + suggestions.length) % suggestions.length
                          );
                          return;
                        }
                        if (e.key === 'Enter' && focusedSuggestionIndex >= 0) {
                          e.preventDefault();
                          handleSelectSuggestion(suggestions[focusedSuggestionIndex]);
                          return;
                        }
                        if (e.key === 'Escape') {
                          setShowSuggestions(false);
                          return;
                        }
                      }
                      if (e.key === 'Enter' && newItemPrice) {
                        setShowSuggestions(false);
                        onAddItem();
                      }
                    }}
                    placeholder="Item name (type for suggestions...)"
                    className="input w-full text-sm"
                  />

                  {/* Typing Suggestions Popover */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div
                      ref={dropdownRef}
                      className="absolute z-40 top-full left-0 right-0 mt-1 bg-card border border-border/80 rounded-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto animate-in fade-in"
                    >
                      <div className="px-2.5 py-1.5 bg-muted/60 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50 flex justify-between items-center">
                        <span>Menu Suggestions</span>
                        <span>{suggestions.length} match{suggestions.length !== 1 ? 'es' : ''}</span>
                      </div>
                      <div className="p-1 space-y-0.5">
                        {suggestions.map((s, idx) => {
                          const isHighlighted = idx === focusedSuggestionIndex;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => handleSelectSuggestion(s)}
                              className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between text-xs transition-colors ${
                                isHighlighted
                                  ? 'bg-primary text-primary-foreground font-semibold'
                                  : 'hover:bg-muted text-foreground'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate pr-2">
                                <span className="truncate">{s.name}</span>
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                                    isHighlighted
                                      ? 'bg-primary-foreground/20 text-primary-foreground'
                                      : 'bg-muted-foreground/10 text-muted-foreground'
                                  }`}
                                >
                                  {s.category}
                                </span>
                              </div>
                              <span
                                className={`font-mono font-bold shrink-0 ${
                                  isHighlighted ? 'text-primary-foreground' : 'text-primary'
                                }`}
                              >
                                GHS {s.price.toFixed(2)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <input
                  type="number"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newItemName) {
                      setShowSuggestions(false);
                      onAddItem();
                    }
                  }}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="input w-24 text-sm text-right font-mono"
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

          {/* View Summary & Checkout */}
          {table.items.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={onViewSummary}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-3 bg-secondary hover:bg-accent text-secondary-foreground rounded-xl text-xs font-semibold transition-colors haptic"
              >
                <Eye className="w-4 h-4" />
                <span>Summary</span>
              </button>
              <button
                onClick={onViewSummary}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-3 bg-primary hover:bg-brand-dark text-primary-foreground rounded-xl text-xs font-semibold shadow-sm transition-colors haptic"
              >
                <Receipt className="w-4 h-4" />
                <span>Checkout / Settle</span>
              </button>
            </div>
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
