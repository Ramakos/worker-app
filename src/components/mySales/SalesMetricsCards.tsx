import React from 'react';
import { ShoppingBag, TrendingUp, Receipt } from 'lucide-react';

interface SalesMetricsCardsProps {
  orderCount: number;
  totalSales: number;
  averageOrderValue: number;
}

export const SalesMetricsCards: React.FC<SalesMetricsCardsProps> = ({
  orderCount,
  totalSales,
  averageOrderValue,
}) => {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="card p-3 text-center">
        <div className="w-9 h-9 rounded-lg bg-secondary mx-auto mb-2 flex items-center justify-center">
          <ShoppingBag className="w-4 h-4 text-primary" />
        </div>
        <p className="text-xs text-muted-foreground mb-0.5">Orders</p>
        <p className="text-lg font-bold text-foreground">{orderCount}</p>
      </div>

      <div className="card p-3 text-center">
        <div className="w-9 h-9 rounded-lg bg-secondary mx-auto mb-2 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-primary" />
        </div>
        <p className="text-xs text-muted-foreground mb-0.5">Sales</p>
        <p className="text-lg font-bold text-foreground">GHS {totalSales.toFixed(2)}</p>
      </div>

      <div className="card p-3 text-center">
        <div className="w-9 h-9 rounded-lg bg-accent mx-auto mb-2 flex items-center justify-center">
          <Receipt className="w-4 h-4 text-accent-foreground" />
        </div>
        <p className="text-xs text-muted-foreground mb-0.5">Avg</p>
        <p className="text-lg font-bold text-foreground">GHS {averageOrderValue.toFixed(2)}</p>
      </div>
    </div>
  );
};
