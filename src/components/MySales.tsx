import { useState, useMemo } from 'react';
import { TrendingUp, ShoppingBag, Receipt, Calendar, Clock, BarChart3, RefreshCw, WifiOff, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useSales, DateRange } from '../hooks/useSales';

interface MySalesProps {
  workerId: string;
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const formatDateInput = (d: Date): string => {
  return d.toISOString().split('T')[0];
};

export const MySales = ({ workerId }: MySalesProps) => {
  const [range, setRange] = useState<DateRange>('today');
  const [customStart, setCustomStart] = useState(formatDateInput(new Date()));
  const [customEnd, setCustomEnd] = useState(formatDateInput(new Date()));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [heatmapMonth, setHeatmapMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const customDateRange = useMemo(() => {
    if (range !== 'custom') return null;
    return {
      start: new Date(customStart + 'T00:00:00'),
      end: new Date(customEnd + 'T23:59:59'),
    };
  }, [range, customStart, customEnd]);

  const { salesData, isLoading, refreshSales } = useSales(workerId, customDateRange);

  if (isLoading && !salesData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!salesData) {
    return (
      <div className="card p-8 text-center">
        <WifiOff className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground font-medium">No sales data yet</p>
        <p className="text-muted-foreground/70 text-sm mt-1">Your served orders will appear here</p>
      </div>
    );
  }

  const rangeMap: Record<DateRange, { label: string; data: typeof salesData.today }> = {
    today: { label: 'Today', data: salesData.today },
    week: { label: 'This Week', data: salesData.week },
    month: { label: 'This Month', data: salesData.month },
    custom: { label: 'Custom', data: salesData.custom },
  };

  const active = rangeMap[range];
  const maxDaySales = Math.max(...salesData.last7Days.map(d => d.totalSales), 1);

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatMode = (mode: string | null) => {
    if (!mode) return '';
    return mode.replace(/_/g, ' ');
  };

  // Heatmap calendar rendering
  const heatmapByDate = new Map(salesData.heatmap.map(d => [d.dayKey, d]));

  const monthLabel = heatmapMonth.toLocaleDateString('en', { month: 'long', year: 'numeric' });
  const firstDayOfMonth = new Date(heatmapMonth.getFullYear(), heatmapMonth.getMonth(), 1);
  const lastDayOfMonth = new Date(heatmapMonth.getFullYear(), heatmapMonth.getMonth() + 1, 0);
  const startWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const calendarCells: (string | null)[] = [];
  for (let i = 0; i < startWeekday; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${heatmapMonth.getFullYear()}-${String(heatmapMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
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

  const prevMonth = () => setHeatmapMonth(new Date(heatmapMonth.getFullYear(), heatmapMonth.getMonth() - 1, 1));
  const nextMonth = () => setHeatmapMonth(new Date(heatmapMonth.getFullYear(), heatmapMonth.getMonth() + 1, 1));

  const monthActiveDays = calendarCells.filter(k => k && (heatmapByDate.get(k)?.orderCount ?? 0) > 0).length;
  const monthTotalSales = calendarCells
    .filter(k => k)
    .reduce((sum, k) => sum + (heatmapByDate.get(k!)?.totalSales || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card-elevated p-3 scale-in">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-brand">
              <BarChart3 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground text-sm">My Sales</h2>
              <p className="text-xs text-muted-foreground">Your served orders</p>
            </div>
          </div>
          <button
            onClick={refreshSales}
            disabled={isLoading}
            className="w-9 h-9 rounded-xl bg-muted hover:bg-muted/70 flex items-center justify-center transition-colors disabled:opacity-50 haptic"
          >
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Range Selector */}
        <div className="flex gap-1 p-1 bg-muted/80 rounded-xl">
          {(Object.keys(rangeMap) as DateRange[]).map(key => (
            <button
              key={key}
              onClick={() => {
                setRange(key);
                if (key === 'custom') setShowDatePicker(true);
              }}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                range === key
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {rangeMap[key].label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Picker */}
      {range === 'custom' && showDatePicker && (
        <div className="card p-4 space-y-3 fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">Select Date Range</h3>
            <button
              onClick={() => setShowDatePicker(false)}
              className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center haptic"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground block mb-1">From</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="input text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground block mb-1">To</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="input text-sm"
              />
            </div>
          </div>
          {customStart && customEnd && new Date(customStart) > new Date(customEnd) && (
            <p className="text-xs text-destructive">Start date must be before end date</p>
          )}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="card p-3 text-center">
          <div className="w-9 h-9 rounded-lg bg-secondary mx-auto mb-2 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xs text-muted-foreground mb-0.5">Orders</p>
          <p className="text-lg font-bold text-foreground">{active.data.orderCount}</p>
        </div>

        <div className="card p-3 text-center">
          <div className="w-9 h-9 rounded-lg bg-secondary mx-auto mb-2 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xs text-muted-foreground mb-0.5">Sales</p>
          <p className="text-lg font-bold text-foreground">GHS {active.data.totalSales.toFixed(2)}</p>
        </div>

        <div className="card p-3 text-center">
          <div className="w-9 h-9 rounded-lg bg-accent mx-auto mb-2 flex items-center justify-center">
            <Receipt className="w-4 h-4 text-accent-foreground" />
          </div>
          <p className="text-xs text-muted-foreground mb-0.5">Avg</p>
          <p className="text-lg font-bold text-foreground">GHS {active.data.averageOrderValue.toFixed(2)}</p>
        </div>
      </div>

      {/* Heatmap Calendar */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-foreground">Activity Heatmap</h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="w-7 h-7 rounded-lg bg-muted hover:bg-muted/70 flex items-center justify-center transition-colors haptic"
            >
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <span className="text-xs font-medium text-foreground min-w-[100px] text-center">{monthLabel}</span>
            <button
              onClick={nextMonth}
              className="w-7 h-7 rounded-lg bg-muted hover:bg-muted/70 flex items-center justify-center transition-colors haptic"
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Weekday labels */}
        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
          {WEEKDAY_LABELS.map((label, i) => (
            <div key={i} className="text-center text-[10px] text-muted-foreground font-medium">{label}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {calendarCells.map((dayKey, idx) => {
            if (!dayKey) {
              return <div key={`empty-${idx}`} className="aspect-square" />;
            }
            const dayNum = parseInt(dayKey.split('-')[2], 10);
            const colorClass = getHeatmapColor(dayKey);
            const dayData = heatmapByDate.get(dayKey);
            const today = isToday(dayKey);

            return (
              <div
                key={dayKey}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-[10px] transition-all ${colorClass} ${today ? 'ring-1 ring-primary ring-offset-1' : ''}`}
                title={dayData ? `${dayData.orderCount} orders · GHS ${dayData.totalSales.toFixed(2)}` : 'No activity'}
              >
                <span className={dayData ? 'font-bold text-primary-foreground' : 'text-muted-foreground'}>
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
            <p className="text-xs font-semibold text-foreground">GHS {monthTotalSales.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* 7-Day Bar Chart */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">Last 7 Days</h3>
        </div>
        <div className="flex items-end justify-between gap-1.5 h-32">
          {salesData.last7Days.map((day, idx) => {
            const heightPct = (day.totalSales / maxDaySales) * 100;
            const isToday = idx === salesData.last7Days.length - 1;
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
                <span className={`text-[10px] ${isToday ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's Orders */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">Orders Served Today</h3>
          <span className="badge badge-neutral ml-auto">{salesData.todayOrders.length}</span>
        </div>

        {salesData.todayOrders.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">No orders served yet today</p>
          </div>
        ) : (
          <div className="space-y-2">
            {salesData.todayOrders.map((order, idx) => (
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
    </div>
  );
};
