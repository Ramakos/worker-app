import React, { useState } from 'react';
import {
  X,
  Phone,
  MapPin,
  Clock,
  User,
  CreditCard,
  Copy,
  Check,
} from 'lucide-react';
import { Order } from '../../types';

interface OrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  workerId?: string;
  onClaim?: (orderId: number, orderNumber?: string | number) => Promise<void>;
  onAdvanceStatus?: (orderId: number, currentStatus: Order['status'], orderNumber?: string | number) => Promise<void>;
  onRequestReject?: (order: Order) => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  isOpen,
  onClose,
  workerId,
  onClaim,
  onAdvanceStatus,
  onRequestReject,
}) => {
  const [copiedPhone, setCopiedPhone] = useState(false);

  if (!isOpen || !order) return null;

  const orderNum = order.order_number || order.id;
  const totalAmount =
    order.total_paid != null
      ? order.total_paid
      : order.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;

  const isClaimedByMe = order.claimed_by === workerId;

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard?.writeText(phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'text-amber-700 bg-amber-50 border-amber-200/60';
      case 'in_kitchen': return 'text-blue-700 bg-blue-50 border-blue-200/60';
      case 'ready': return 'text-emerald-700 bg-emerald-50 border-emerald-200/60';
      case 'served':
      case 'delivered': return 'text-purple-700 bg-purple-50 border-purple-200/60';
      case 'cancelled': return 'text-red-700 bg-red-50 border-red-200/60';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  const getNextStatusLabel = (currentStatus: Order['status']): string => {
    switch (currentStatus) {
      case 'pending': return 'Start Preparing';
      case 'in_kitchen': return 'Mark Ready';
      case 'ready': return 'Mark Served';
      default: return 'Advance';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-foreground/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-card w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl border border-border overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-card shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-lg font-bold text-foreground">Order #{orderNum}</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${getStatusColor(
                order.status
              )}`}
            >
              {order.status === 'in_kitchen' ? 'preparing' : order.status}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/70 flex items-center justify-center transition-colors haptic"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-sm">
          {/* Rejection / Cancellation Banner */}
          {order.status === 'cancelled' && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 flex items-start gap-2.5 text-destructive">
              <Ban className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-xs">Order Cancelled</p>
                <p className="text-xs text-destructive/90 mt-0.5">
                  Reason: {order.rejection_reason || 'Cancelled by staff'}
                </p>
              </div>
            </div>
          )}

          {/* Customer & Delivery Card */}
          <div className="bg-muted/40 rounded-xl p-3.5 border border-border/60 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              <span>Customer & Delivery Details</span>
              <span className="capitalize px-2 py-0.5 bg-secondary text-secondary-foreground rounded-md text-[10px]">
                {order.order_type || order.mode || 'dine-in'}
              </span>
            </div>

            {/* Customer Name */}
            <div className="flex items-center gap-2 text-foreground">
              <User className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="font-semibold">{order.customer_name || 'Guest Customer'}</span>
            </div>

            {/* Customer Phone */}
            {order.customer_phone ? (
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
                <div className="flex items-center gap-2 text-foreground">
                  <Phone className="w-4 h-4 text-primary shrink-0" />
                  <a
                    href={`tel:${order.customer_phone}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {order.customer_phone}
                  </a>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopyPhone(order.customer_phone!)}
                    className="px-2 py-1 bg-muted hover:bg-muted/80 rounded-md text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                    title="Copy phone"
                  >
                    {copiedPhone ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedPhone ? 'Copied' : 'Copy'}</span>
                  </button>
                  <a
                    href={`tel:${order.customer_phone}`}
                    className="px-2.5 py-1 bg-primary text-primary-foreground rounded-md text-xs font-medium flex items-center gap-1 shadow-sm hover:bg-brand-dark transition-colors"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Call</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t border-border/40">
                <Phone className="w-3.5 h-3.5" />
                <span>No phone number provided</span>
              </div>
            )}

            {/* Delivery Address */}
            {order.delivery_address && (
              <div className="flex items-start gap-2 pt-1 border-t border-border/40">
                <MapPin className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">Delivery Destination:</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {order.delivery_address}
                  </p>
                </div>
              </div>
            )}

            {/* Special Instructions / Notes */}
            {order.notes && (
              <div className="pt-1 border-t border-border/40 text-xs">
                <span className="font-semibold text-foreground">Customer Notes: </span>
                <span className="text-muted-foreground italic">"{order.notes}"</span>
              </div>
            )}
          </div>

          {/* Items Breakdown */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Order Items ({order.items?.length || 0})
            </h4>
            <div className="bg-card rounded-xl border border-border divide-y divide-border/60">
              {order.items?.map((item, idx) => (
                <div key={item.id || idx} className="p-3 flex items-start justify-between gap-3 text-xs">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">
                      <span className="text-primary mr-1.5">{item.quantity}x</span>
                      {item.name}
                    </p>
                    {item.modifiers && (
                      <p className="text-muted-foreground italic mt-0.5">
                        Instructions: {item.modifiers}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      GH₵ {item.price.toFixed(2)} each
                    </p>
                  </div>
                  <span className="font-mono font-bold text-foreground shrink-0 text-sm">
                    GH₵ {(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing & Timing Breakdown */}
          <div className="bg-muted/40 rounded-xl p-3.5 border border-border/60 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Placed At:
              </span>
              <span className="font-medium text-foreground">
                {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                Payment Method:
              </span>
              <span className="font-semibold text-foreground capitalize">
                {order.payment_method || 'Cash at Counter'}
              </span>
            </div>

            {order.claimed_by && (
              <div className="flex justify-between items-center pt-1 border-t border-border/40">
                <span className="text-muted-foreground">Assigned Waiter:</span>
                <span className="font-semibold text-foreground">
                  {isClaimedByMe ? 'You' : `Staff #${order.claimed_by.slice(0, 6)}`}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t-2 border-border text-sm">
              <span className="font-bold text-foreground">Grand Total:</span>
              <span className="font-bold text-lg text-primary">
                GH₵ {totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-card flex flex-wrap items-center justify-between gap-2 shrink-0 safe-bottom">
          <div className="flex items-center gap-2">
            {order.status !== 'served' && order.status !== 'delivered' && order.status !== 'cancelled' && onRequestReject && (
              <button
                onClick={() => onRequestReject(order)}
                className="px-3.5 py-2.5 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-semibold flex items-center gap-1.5 transition-colors haptic"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Decline Order</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {!order.claimed_by && onClaim && (
              <button
                onClick={() => onClaim(order.id, orderNum)}
                className="px-4 py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl text-xs font-semibold transition-all haptic"
              >
                Claim Order
              </button>
            )}

            {order.status !== 'served' && order.status !== 'delivered' && order.status !== 'cancelled' && onAdvanceStatus && (
              <button
                onClick={() => onAdvanceStatus(order.id, order.status, orderNum)}
                className="px-4 py-2.5 bg-primary hover:bg-brand-dark text-primary-foreground rounded-xl text-xs font-semibold shadow-sm transition-all haptic"
              >
                {getNextStatusLabel(order.status)}
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-muted hover:bg-muted/70 text-foreground rounded-xl text-xs font-medium transition-colors haptic"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
