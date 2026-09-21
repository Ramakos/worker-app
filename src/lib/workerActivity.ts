import { WorkerActivityItem } from '../types';

const ACTIVITY_PREFIX = 'worker_activity_';
const MAX_LOG_ITEMS = 150;

export const getWorkerActivityStorageKey = (workerId: string): string => {
  return `${ACTIVITY_PREFIX}${workerId}`;
};

export const getWorkerActivities = (workerId: string): WorkerActivityItem[] => {
  if (!workerId) return [];
  try {
    const raw = localStorage.getItem(getWorkerActivityStorageKey(workerId));
    if (!raw) return [];
    return JSON.parse(raw) as WorkerActivityItem[];
  } catch (error) {
    console.error('Error reading worker activities from localStorage:', error);
    return [];
  }
};

export const recordWorkerActivity = (
  workerId: string,
  activity: Omit<WorkerActivityItem, 'id' | 'timestamp' | 'worker_id'>
): WorkerActivityItem => {
  if (!workerId) {
    throw new Error('workerId is required to record worker activity');
  }

  const newItem: WorkerActivityItem = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    worker_id: workerId,
    timestamp: new Date().toISOString(),
    ...activity,
  };

  try {
    const current = getWorkerActivities(workerId);
    // Prepend new item so most recent is first
    const updated = [newItem, ...current].slice(0, MAX_LOG_ITEMS);
    localStorage.setItem(getWorkerActivityStorageKey(workerId), JSON.stringify(updated));

    // Also update worker last active timestamp in session
    const storedSession = localStorage.getItem('workerSession');
    if (storedSession) {
      try {
        const session = JSON.parse(storedSession);
        session.last_active_at = newItem.timestamp;
        localStorage.setItem('workerSession', JSON.stringify(session));
      } catch {}
    }

    // Broadcast update across the app in real-time
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('worker-activity-updated', {
          detail: { workerId, item: newItem },
        })
      );
    }
  } catch (error) {
    console.error('Failed to persist worker activity to localStorage:', error);
  }

  return newItem;
};

export const clearWorkerActivities = (workerId: string): void => {
  if (!workerId) return;
  try {
    localStorage.removeItem(getWorkerActivityStorageKey(workerId));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('worker-activity-updated', {
          detail: { workerId, cleared: true },
        })
      );
    }
  } catch (error) {
    console.error('Failed to clear worker activities:', error);
  }
};

export interface WorkerActivityStats {
  totalActions: number;
  ordersClaimed: number;
  ordersServed: number;
  totalSalesValue: number;
  floatTakenTotal: number;
  floatReturnedTotal: number;
  tablesHandled: number;
  firstActivityAt: string | null;
  lastActivityAt: string | null;
}

export const calculateWorkerActivityStats = (activities: WorkerActivityItem[]): WorkerActivityStats => {
  let ordersClaimed = 0;
  let ordersServed = 0;
  let totalSalesValue = 0;
  let floatTakenTotal = 0;
  let floatReturnedTotal = 0;
  let tablesHandled = 0;

  activities.forEach(item => {
    switch (item.type) {
      case 'order_claimed':
        ordersClaimed++;
        break;
      case 'order_status':
        if (item.status === 'served') {
          ordersServed++;
          if (item.amount) totalSalesValue += Number(item.amount);
        }
        break;
      case 'float_taken':
        if (item.amount) floatTakenTotal += Number(item.amount);
        break;
      case 'float_returned':
        if (item.amount) floatReturnedTotal += Number(item.amount);
        break;
      case 'table_order':
        tablesHandled++;
        if (item.amount && !ordersServed) totalSalesValue += Number(item.amount);
        break;
      default:
        break;
    }
  });

  const lastActivityAt = activities.length > 0 ? activities[0].timestamp : null;
  const firstActivityAt = activities.length > 0 ? activities[activities.length - 1].timestamp : null;

  return {
    totalActions: activities.length,
    ordersClaimed,
    ordersServed,
    totalSalesValue,
    floatTakenTotal,
    floatReturnedTotal,
    tablesHandled,
    firstActivityAt,
    lastActivityAt,
  };
};
