import React from 'react';
import { Bell, ChefHat, Check, ArrowRight, ShoppingBag, Clock } from 'lucide-react';
import { Order } from '../types';

interface IncomingOrderModalProps {
  order: Order | null;
  pendingCount: number;
  onClaim: (order: Order) => Promise<void>;
  onDismiss: () => void;
  onGoToOrders: () => void;
}

export const IncomingOrderModal: React.FC<IncomingOrderModalProps> = ({
  order,
  pendingCount,
  onClaim,
  onDismiss,
  onGoToOrders,
}) => {
  if (!order) return null;

  const totalAmount = order.total_paid || order.items?.reduce((sum, i) => sum + i.price * i.quantity, 0) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-card border-2 border-primary/50 shadow-2xl rounded-3xl overflow-hidden animate-scale-up">
        {/* Urgent Header Banner */}
        <div className="bg-gradient-brand text-primary-foreground p-4 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-white" />
              </span>
              <div>
                <h3 className="font-bold text-sm tracking-wide uppercase flex items-center gap-1.5">
                  <Bell className="w-4 h-4 animate-bounce" /> New Express Order Incoming!
                </h3>
                <p className="text-[11px] opacity-90">Ready to be claimed and fulfilled</p>
              </div>
            </div>

            {pendingCount > 1 && (
              <span className="bg-white/20 backdrop-blur-sm text-white px-2.5 py-0.5 rounded-full text-xs font-bold">
                +{pendingCount - 1} more
              </span>
            )}
          </div>
        </div>

        {/* Order Details Body */}
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-black text-foreground">
                  Order #{order.id}
                </span>
                <span className="bg-primary/10 text-primary font-semibold text-xs px-2 py-0.5 rounded-md capitalize">
                  {order.order_type || order.mode || 'Express Order'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Customer: <strong className="text-foreground">{order.customer_name || 'Customer'}</strong>
              </p>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-muted-foreground uppercase block font-medium">Job Value</span>
              <span className="text-xl font-black text-primary font-mono">
                GH₵ {Number(totalAmount).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Items Preview */}
          <div className="bg-muted/40 rounded-2xl p-3 border border-border/50 max-h-40 overflow-y-auto space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              <ShoppingBag className="w-3 h-3" /> Items ({order.items?.length || 0})
            </div>
            {(order.items || []).map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <span className="text-foreground font-medium truncate pr-2">
                  <span className="text-primary font-bold mr-1">{item.quantity}x</span>
                  {item.name}
                </span>
                <span className="text-muted-foreground font-mono font-medium shrink-0">
                  GH₵ {(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Earning Explanation Note */}
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5 flex items-center gap-2 text-emerald-800 text-xs">
            <ChefHat className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Claiming assigns this order to you. When served, it credits <strong>GH₵ {Number(totalAmount).toFixed(2)}</strong> to your sales record!
            </span>
          </div>

          {/* Action CTAs */}
          <div className="space-y-2 pt-1">
            <button
              onClick={() => onClaim(order)}
              className="w-full py-3.5 px-4 bg-gradient-brand hover:brightness-105 text-primary-foreground font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <Check className="w-5 h-5" />
              <span>Claim & Start Preparing</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onGoToOrders}
                className="flex-1 py-2 px-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition-all"
              >
                <span>View in Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onDismiss}
                className="py-2 px-4 text-muted-foreground hover:text-foreground text-xs font-semibold rounded-xl transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
