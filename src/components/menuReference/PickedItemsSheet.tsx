import React from 'react';
import { ShoppingBag, X, Check } from 'lucide-react';
import { PickedItem } from './types';

interface PickedItemsSheetProps {
  pickedItems: PickedItem[];
  total: number;
  onClear: () => void;
  onRemoveItem: (id: string) => void;
  onConfirm: () => void;
}

export const PickedItemsSheet: React.FC<PickedItemsSheetProps> = ({
  pickedItems,
  total,
  onClear,
  onRemoveItem,
  onConfirm,
}) => {
  if (pickedItems.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-2xl z-50 safe-bottom slide-up">
      <div className="max-w-lg mx-auto">
        {/* Handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-primary" />
            </div>
            <div>
              <span className="font-semibold text-foreground text-sm">
                {pickedItems.length} item{pickedItems.length !== 1 ? 's' : ''}
              </span>
              <span className="text-xs text-muted-foreground ml-2">picked</span>
            </div>
          </div>
          <button
            onClick={onClear}
            className="text-xs text-destructive hover:text-destructive/80 font-medium"
          >
            Clear
          </button>
        </div>

        {/* Picked Items Scroll */}
        <div className="flex gap-2 overflow-x-auto px-4 py-2 hide-scrollbar">
          {pickedItems.map(item => (
            <div
              key={item.id}
              className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-muted rounded-xl animate-in"
            >
              <div className="text-xs">
                <div className="font-medium text-foreground max-w-[120px] truncate">{item.name}</div>
                <div className="text-muted-foreground">GHS {item.price.toFixed(2)}</div>
              </div>
              <button
                onClick={() => onRemoveItem(item.id)}
                className="w-6 h-6 rounded-full bg-muted-foreground/20 hover:bg-destructive/20 flex items-center justify-center transition-colors haptic"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
        </div>

        {/* Footer with Total & Confirm */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-muted/50">
          <div>
            <span className="text-xs text-muted-foreground">Total</span>
            <div className="text-xl font-bold text-foreground">GHS {total.toFixed(2)}</div>
          </div>
          <button onClick={onConfirm} className="btn btn-primary px-6 py-3 haptic">
            <Check className="w-4 h-4" />
            <span>Add to Table</span>
          </button>
        </div>
      </div>
    </div>
  );
};
