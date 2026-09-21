import React from 'react';
import { BarChart3 } from 'lucide-react';

interface DaySales {
  date: string;
  label: string;
  totalSales: number;
}

interface Sales7DayBarChartProps {
  last7Days: DaySales[];
}

export const Sales7DayBarChart: React.FC<Sales7DayBarChartProps> = ({ last7Days }) => {
  const maxDaySales = Math.max(...last7Days.map(d => d.totalSales), 1);

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-foreground">Last 7 Days</h3>
      </div>
      <div className="flex items-end justify-between gap-1.5 h-32">
        {last7Days.map((day, idx) => {
          const heightPct = (day.totalSales / maxDaySales) * 100;
          const isToday = idx === last7Days.length - 1;
          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-muted-foreground font-medium">
                {day.totalSales > 0 ? `GHS ${day.totalSales.toFixed(0)}` : ''}
              </span>
              <div className="w-full flex-1 flex items-end">
                <div
                  className={`w-full rounded-t-md transition-all duration-300 ${
                    isToday ? 'bg-gradient-brand' : 'bg-muted-foreground/20'
                  }`}
                  style={{ height: `${Math.max(heightPct, 2)}%` }}
                />
              </div>
              <span
                className={`text-[10px] ${
                  isToday ? 'text-primary font-semibold' : 'text-muted-foreground'
                }`}
              >
                {day.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
