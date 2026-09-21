import React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface HeatmapDay {
  dayKey: string;
  orderCount: number;
  totalSales: number;
  intensity: number;
}

interface SalesHeatmapCardProps {
  heatmapData: HeatmapDay[];
  heatmapMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const formatDateInput = (d: Date): string => {
  return d.toISOString().split('T')[0];
};

export const SalesHeatmapCard: React.FC<SalesHeatmapCardProps> = ({
  heatmapData,
  heatmapMonth,
  onPrevMonth,
  onNextMonth,
}) => {
  const heatmapByDate = new Map(heatmapData.map(d => [d.dayKey, d]));

  const monthLabel = heatmapMonth.toLocaleDateString('en', { month: 'long', year: 'numeric' });
  const firstDayOfMonth = new Date(heatmapMonth.getFullYear(), heatmapMonth.getMonth(), 1);
  const lastDayOfMonth = new Date(heatmapMonth.getFullYear(), heatmapMonth.getMonth() + 1, 0);
  const startWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const calendarCells: (string | null)[] = [];
  for (let i = 0; i < startWeekday; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${heatmapMonth.getFullYear()}-${String(heatmapMonth.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(d).padStart(2, '0')}`;
    calendarCells.push(dateKey);
  }

  const getHeatmapColor = (dayKey: string): string => {
    const day = heatmapByDate.get(dayKey);
    if (!day || day.intensity === 0) return 'bg-muted';
    const intensity = day.intensity;
    if (intensity > 0.75) return 'bg-primary';
    if (intensity > 0.5) return 'bg-primary/75';
    if (intensity > 0.25) return 'bg-primary/50';
    return 'bg-primary/25';
  };

  const isToday = (dayKey: string): boolean => {
    return dayKey === formatDateInput(new Date());
  };

  const monthActiveDays = calendarCells.filter(
    k => k && (heatmapByDate.get(k)?.orderCount ?? 0) > 0
  ).length;
  const monthTotalSales = calendarCells
    .filter(k => k)
    .reduce((sum, k) => sum + (heatmapByDate.get(k!)?.totalSales || 0), 0);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">Activity Heatmap</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onPrevMonth}
            className="w-7 h-7 rounded-lg bg-muted hover:bg-muted/70 flex items-center justify-center transition-colors haptic"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <span className="text-xs font-medium text-foreground min-w-[100px] text-center">
            {monthLabel}
          </span>
          <button
            onClick={onNextMonth}
            className="w-7 h-7 rounded-lg bg-muted hover:bg-muted/70 flex items-center justify-center transition-colors haptic"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-1.5">
        {WEEKDAY_LABELS.map((label, i) => (
          <div key={i} className="text-center text-[10px] text-muted-foreground font-medium">
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {calendarCells.map((dayKey, idx) => {
          if (!dayKey) {
            return <div key={`empty-${idx}`} className="aspect-square" />;
          }
          const dayNum = parseInt(dayKey.split('-')[2], 10);
          const colorClass = getHeatmapColor(dayKey);
          const dayData = heatmapByDate.get(dayKey);
          const today = isToday(dayKey);
          const hasActivity = Boolean(dayData && dayData.intensity > 0);

          return (
            <div
              key={dayKey}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center text-[10px] transition-all ${colorClass} ${
                today ? 'ring-1 ring-primary ring-offset-1' : ''
              }`}
              title={
                dayData
                  ? `${dayData.orderCount} orders · GHS ${dayData.totalSales.toFixed(2)}`
                  : 'No activity'
              }
            >
              <span
                className={hasActivity ? 'font-bold text-primary-foreground' : 'text-foreground/80'}
              >
                {dayNum}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">Less</span>
          <div className="w-3 h-3 rounded bg-muted"></div>
          <div className="w-3 h-3 rounded bg-primary/25"></div>
          <div className="w-3 h-3 rounded bg-primary/50"></div>
          <div className="w-3 h-3 rounded bg-primary/75"></div>
          <div className="w-3 h-3 rounded bg-primary"></div>
          <span className="text-[10px] text-muted-foreground">More</span>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground">
            {monthActiveDays} active day{monthActiveDays !== 1 ? 's' : ''}
          </p>
          <p className="text-xs font-semibold text-foreground">
            GHS {monthTotalSales.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
};
