import { useState, useEffect, useCallback, useMemo } from 'react';
import { WorkerActivityItem } from '../types';
import {
  getWorkerActivities,
  recordWorkerActivity,
  clearWorkerActivities,
  calculateWorkerActivityStats,
  WorkerActivityStats,
} from '../lib/workerActivity';

export const useWorkerActivity = (workerId?: string) => {
  const [activities, setActivities] = useState<WorkerActivityItem[]>(() => {
    if (!workerId) return [];
    return getWorkerActivities(workerId);
  });

  const refresh = useCallback(() => {
    if (!workerId) {
      setActivities([]);
      return;
    }
    setActivities(getWorkerActivities(workerId));
  }, [workerId]);

  useEffect(() => {
    refresh();

    const handleCustomUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ workerId: string }>;
      if (!workerId || customEvent.detail?.workerId === workerId) {
        refresh();
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key.includes('worker_activity_')) {
        refresh();
      }
    };

    window.addEventListener('worker-activity-updated', handleCustomUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('worker-activity-updated', handleCustomUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, [workerId, refresh]);

  const addActivity = useCallback(
    (item: Omit<WorkerActivityItem, 'id' | 'timestamp' | 'worker_id'>) => {
      if (!workerId) return null;
      const recorded = recordWorkerActivity(workerId, item);
      refresh();
      return recorded;
    },
    [workerId, refresh]
  );

  const clear = useCallback(() => {
    if (!workerId) return;
    clearWorkerActivities(workerId);
    refresh();
  }, [workerId, refresh]);

  const stats: WorkerActivityStats = useMemo(() => {
    return calculateWorkerActivityStats(activities);
  }, [activities]);

  return {
    activities,
    stats,
    addActivity,
    clearActivities: clear,
    refresh,
  };
};
