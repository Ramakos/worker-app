import React from 'react';
import { X, Receipt, Printer, Check } from 'lucide-react';
import { TableOrder } from './types';
import { useToast } from '../Toast';

interface TableSummaryModalProps {
  summaryTable: TableOrder | null;
  onClose: () => void;
  getTableTotal: (table: TableOrder) => number;
}

export const TableSummaryModal: React.FC<TableSummaryModalProps> = ({
  summaryTable,
  onClose,
  getTableTotal,
}) => {
  const toast = useToast();

  if (!summaryTable) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40 backdrop-blur-sm"
      onClick={onClose}
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
            onClick={onClose}
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
            onClick={() => {
              toast.info('Printing Receipt', `Sending ${summaryTable.tableName} summary to printer`);
              window.print();
            }}
            className="flex-1 btn btn-outline py-2.5 text-sm haptic"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 btn btn-primary py-2.5 text-sm haptic"
          >
            <Check className="w-4 h-4" />
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};
