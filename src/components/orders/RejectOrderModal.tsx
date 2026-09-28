import React, { useState } from 'react';
import { AlertTriangle, X, Ban, Check } from 'lucide-react';
import { Order } from '../../types';

interface RejectOrderModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmReject: (orderId: number, reason: string) => Promise<void>;
  isSubmitting?: boolean;
}

const PRESET_REASONS = [
  'Item out of stock (86\'d)',
  'Kitchen at peak capacity / excessive delay',
  'Kitchen closed / outside service hours',
  'Customer requested cancellation',
  'Outside delivery area / rider unavailable',
  'Other (specify below)',
];

export const RejectOrderModal: React.FC<RejectOrderModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirmReject,
  isSubmitting = false,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>(PRESET_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');

  if (!isOpen || !order) return null;

  const orderNum = order.order_number || order.id;
  const finalReason =
    selectedPreset === 'Other (specify below)'
      ? customReason.trim()
      : customReason.trim()
      ? `${selectedPreset}: ${customReason.trim()}`
      : selectedPreset;

  const handleConfirm = async () => {
    if (!finalReason) return;
    await onConfirmReject(order.id, finalReason);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-destructive/20 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-destructive/10 px-5 py-4 border-b border-destructive/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-destructive">
            <div className="w-8 h-8 rounded-lg bg-destructive/15 flex items-center justify-center">
              <Ban className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Decline Order #{orderNum}</h3>
              <p className="text-[11px] text-destructive/80 font-medium">Customer will be alerted instantly</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-lg bg-card/60 hover:bg-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Alert Notice */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              Declining this order will update the status to <strong>Cancelled</strong> and notify the customer on the Express Order app with the reason selected below.
            </p>
          </div>

          {/* Reason Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Select Reason
            </label>
            <div className="space-y-1.5">
              {PRESET_REASONS.map((reason) => {
                const isSelected = selectedPreset === reason;
                return (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setSelectedPreset(reason)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-destructive bg-destructive/5 text-destructive font-semibold shadow-sm'
                        : 'border-border bg-card hover:bg-muted/50 text-foreground'
                    }`}
                  >
                    <span>{reason}</span>
                    {isSelected && <Check className="w-4 h-4 shrink-0 text-destructive" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Additional details / custom input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              {selectedPreset === 'Other (specify below)'
                ? 'Reason details (required)'
                : 'Additional note to customer (optional)'}
            </label>
            <textarea
              rows={2}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder={
                selectedPreset === 'Other (specify below)'
                  ? 'Please explain why this order cannot be fulfilled...'
                  : 'Add any specific item names or details for the customer...'
              }
              className="input w-full text-xs p-2.5 resize-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-muted/40 px-5 py-3.5 border-t border-border flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="btn btn-outline px-4 py-2 text-xs font-medium haptic"
          >
            Keep Order
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || !finalReason}
            className="btn px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5 haptic"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Declining...</span>
              </>
            ) : (
              <>
                <Ban className="w-3.5 h-3.5" />
                <span>Confirm Decline</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
