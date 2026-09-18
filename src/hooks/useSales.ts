import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { WorkerOrderLog } from '../types';

export type DateRange = 'today' | 'week' | 'month' | 'custom';

export interface SalesSummary {
  orderCount: number;
  totalSales: number;
  averageOrderValue: number;
}

export interface DailySales {
  date: string;
  label: string;
  totalSales: number;
  orderCount: number;
}

export interface ServedOrderDetail {
  order_id: number;
  amount: number | null;
  mode: string | null;
  created_at: string;
}

export interface HeatmapDay {
  date: string;
  dayKey: string;
  orderCount: number;
  totalSales: number;
  intensity: number;
}

export interface SalesData {
  today: SalesSummary;
  week: SalesSummary;
  month: SalesSummary;
  custom: SalesSummary;
  last7Days: DailySales[];
  todayOrders: ServedOrderDetail[];
  heatmap: HeatmapDay[];
}

const SALES_CACHE_KEY = 'workerSalesCache';

const getDayStart = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getWeekStart = (date: Date): Date => {
  const d = getDayStart(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
};

const getMonthStart = (date: Date): Date => {
  const d = getDayStart(date);
  d.setDate(1);
  return d;
};

const summarize = (rows: WorkerOrderLog[]): SalesSummary => {
  const served = rows.filter(r => r.action === 'served');
  const orderCount = served.length;
  const totalSales = served.reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const averageOrderValue = orderCount > 0 ? totalSales / orderCount : 0;
  return { orderCount, totalSales, averageOrderValue };
};

const buildDailyChart = (rows: WorkerOrderLog[]): DailySales[] => {
  const today = new Date();
  const days: DailySales[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = getDayStart(new Date(today.getFullYear(), today.getMonth(), today.getDate() - i));
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const dayRows = rows.filter(r => {
      const created = new Date(r.created_at);
      return created >= dayStart && created < dayEnd && r.action === 'served';
    });

    const totalSales = dayRows.reduce((sum, r) => sum + Number(r.amount || 0), 0);
    days.push({
      date: dayStart.toISOString(),
      label: dayStart.toLocaleDateString('en', { weekday: 'short' }),
      totalSales,
      orderCount: dayRows.length,
    });
  }
  return days;
};

const buildHeatmap = (rows: WorkerOrderLog[], daysToShow: number): HeatmapDay[] => {
  const today = new Date();
  const result: HeatmapDay[] = [];
  const maxSales = Math.max(
    ...Array.from({ length: daysToShow }, (_, i) => {
      const dayStart = getDayStart(new Date(today.getFullYear(), today.getMonth(), today.getDate() - i));
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      return rows
        .filter(r => {
          const created = new Date(r.created_at);
          return created >= dayStart && created < dayEnd && r.action === 'served';
        })
        .reduce((sum, r) => sum + Number(r.amount || 0), 0);
    }),
    1,
  );

  for (let i = daysToShow - 1; i >= 0; i--) {
    const dayStart = getDayStart(new Date(today.getFullYear(), today.getMonth(), today.getDate() - i));
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const dayRows = rows.filter(r => {
      const created = new Date(r.created_at);
      return created >= dayStart && created < dayEnd && r.action === 'served';
    });

    const totalSales = dayRows.reduce((sum, r) => sum + Number(r.amount || 0), 0);
    const orderCount = dayRows.length;
    const intensity = totalSales > 0 ? Math.min(1, totalSales / maxSales) : 0;

    result.push({
      date: dayStart.toISOString(),
      dayKey: dayStart.toISOString().split('T')[0],
      orderCount,
      totalSales,
      intensity,
    });
  }
  return result;
};

export const useSales = (
  workerId?: string,
  customDateRange?: { start: Date; end: Date } | null,
) => {
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSales = useCallback(async () => {
    if (!workerId) return;

    setIsLoading(true);
    try {
      const now = new Date();
      const monthStart = getMonthStart(now);
      const weekStart = getWeekStart(now);
      const dayStart = getDayStart(now);

      const fetchStart = customDateRange
        ? new Date(Math.min(monthStart.getTime(), customDateRange.start.getTime()))
        : monthStart;

      const { data, error } = await supabase
        .from('worker_orders')
        .select('*')
        .eq('worker_id', workerId)
        .gte('created_at', fetchStart.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rows: WorkerOrderLog[] = (data || []).map(r => ({
        id: r.id,
        order_id: r.order_id,
        worker_id: r.worker_id,
        action: r.action,
        amount: r.amount,
        mode: r.mode,
        created_at: r.created_at,
      }));

      const todayRows = rows.filter(r => new Date(r.created_at) >= dayStart);
      const weekRows = rows.filter(r => new Date(r.created_at) >= weekStart);
      const monthRows = rows;

      let customRows = todayRows;
      if (customDateRange) {
        const customEnd = new Date(customDateRange.end);
        customEnd.setDate(customEnd.getDate() + 1);
        customRows = rows.filter(r => {
          const created = new Date(r.created_at);
          return created >= customDateRange.start && created < customEnd;
        });
      }

      const todayOrders: ServedOrderDetail[] = todayRows
        .filter(r => r.action === 'served')
        .map(r => ({
          order_id: r.order_id,
          amount: r.amount,
          mode: r.mode,
          created_at: r.created_at,
        }));

      const result: SalesData = {
        today: summarize(todayRows),
        week: summarize(weekRows),
        month: summarize(monthRows),
        custom: summarize(customRows),
        last7Days: buildDailyChart(rows),
        todayOrders,
        heatmap: buildHeatmap(rows, 84),
      };

      setSalesData(result);
      localStorage.setItem(SALES_CACHE_KEY, JSON.stringify({ data: result, cachedAt: now.toISOString() }));
    } catch (error) {
      console.error('Error fetching sales data:', error);
      const cached = localStorage.getItem(SALES_CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setSalesData(parsed.data);
        } catch {
          // ignore corrupted sales cache
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [workerId, customDateRange]);

  useEffect(() => {
    fetchSales();

    if (!workerId) return;

    const subscription = supabase
      .channel('worker_orders_sales')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'worker_orders', filter: `worker_id=eq.${workerId}` },
        () => { fetchSales(); }
      )
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, [fetchSales, workerId]);

  return { salesData, isLoading, refreshSales: fetchSales };
};
