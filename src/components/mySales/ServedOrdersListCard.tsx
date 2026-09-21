import React from 'react';
import { Clock, Receipt } from 'lucide-react';

interface OrderRecord {
  order_id: string | number;
  amount: number | null;
  mode: string | null;
  created_at: string;
}

interface ServedOrdersListCardProps {
  orders: OrderRecord[];
}

export const ServedOrdersListCard: React.FC<ServedOrdersListCardProps> = ({ orders }) => {
  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatMode = (mode: string | null) => {
    if (!mode) return '';
    return mode.replace(/_/g, ' ');
  };

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-foreground">Orders Served Today</h3>
        <span className="badge badge-neutral ml-auto">{orders.length}</span>
      </div>

      {orders.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-sm text-muted-foreground">No orders served yet today</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order, idx) => (
            <div
              key={`${order.order_id}-${idx}`}
              className="flex items-center justify-between p-3 bg-muted rounded-xl fade-in"
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Order #{order.order_id}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatTime(order.created_at)}
                    {order.mode && <span className="capitalize"> · {formatMode(order.mode)}</span>}
                  </p>
                </div>
              </div>
              <p className="font-semibold text-foreground text-sm">
                GHS {Number(order.amount || 0).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
