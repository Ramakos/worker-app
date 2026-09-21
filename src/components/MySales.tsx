import { useState, useMemo } from 'react';
import { WifiOff } from 'lucide-react';
import { useSales, DateRange } from '../hooks/useSales';
import { MySalesHeader } from './mySales/MySalesHeader';
import { SalesMetricsCards } from './mySales/SalesMetricsCards';
import { SalesHeatmapCard } from './mySales/SalesHeatmapCard';
import { Sales7DayBarChart } from './mySales/Sales7DayBarChart';
import { ServedOrdersListCard } from './mySales/ServedOrdersListCard';

interface MySalesProps {
  workerId: string;
}

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

  const prevMonth = () =>
    setHeatmapMonth(new Date(heatmapMonth.getFullYear(), heatmapMonth.getMonth() - 1, 1));
  const nextMonth = () =>
    setHeatmapMonth(new Date(heatmapMonth.getFullYear(), heatmapMonth.getMonth() + 1, 1));

  return (
    <div className="space-y-4">
      <MySalesHeader
        isLoading={isLoading}
        onRefresh={refreshSales}
        range={range}
        onRangeChange={newRange => {
          setRange(newRange);
          if (newRange === 'custom') setShowDatePicker(true);
        }}
        showDatePicker={showDatePicker}
        onCloseDatePicker={() => setShowDatePicker(false)}
        customStart={customStart}
        onCustomStartChange={setCustomStart}
        customEnd={customEnd}
        onCustomEndChange={setCustomEnd}
        rangeMap={rangeMap}
      />

      <SalesMetricsCards
        orderCount={active.data.orderCount}
        totalSales={active.data.totalSales}
        averageOrderValue={active.data.averageOrderValue}
      />

      <SalesHeatmapCard
        heatmapData={salesData.heatmap}
        heatmapMonth={heatmapMonth}
        onPrevMonth={prevMonth}
        onNextMonth={nextMonth}
      />

      <Sales7DayBarChart last7Days={salesData.last7Days} />

      <ServedOrdersListCard orders={salesData.todayOrders} />
    </div>
  );
};
