import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { WorkerShift, FloatTransaction } from '../types';
import { recordWorkerActivity } from '../lib/workerActivity';

const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return '00000000-0000-0000-0000-' + Date.now().toString().slice(-12).padStart(12, '0');
};

export const useFloat = (workerId?: string) => {
  // Synchronously hydrate current shift and float transactions from localStorage
  const [currentShift, setCurrentShift] = useState<WorkerShift | null>(() => {
    if (!workerId) return null;
    try {
      const cached = localStorage.getItem(`active_shift_${workerId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.active !== false) return parsed;
      }
      const sessionCached = localStorage.getItem('workerSession');
      if (sessionCached) {
        const parsed = JSON.parse(sessionCached);
        if (parsed?.shift && parsed.shift.active !== false && parsed.shift.user_id === workerId) {
          return parsed.shift;
        }
      }
    } catch {
      /* ignore cache parse error */
    }
    return null;
  });

  const [floatTransactions, setFloatTransactions] = useState<FloatTransaction[]>(() => {
    if (!workerId) return [];
    try {
      const cached = localStorage.getItem(`float_txs_${workerId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      /* ignore cache parse error */
    }
    return [];
  });

  const [shiftHistory, setShiftHistory] = useState<WorkerShift[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Helper to ensure an active shift exists for today (restaurant business rule: logging in starts today's shift)
  const ensureActiveShift = useCallback(async (wId: string): Promise<WorkerShift> => {
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    // 1. Try checking Supabase if authenticated
    try {
      // Check for active shift in DB
      const { data: existingActive } = await supabase
        .from('worker_shifts')
        .select('*')
        .eq('user_id', wId)
        .eq('active', true)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingActive) {
        localStorage.setItem(`active_shift_${wId}`, JSON.stringify(existingActive));
        return existingActive;
      }

      // Check if a shift was started today and resume it
      const { data: todayShift } = await supabase
        .from('worker_shifts')
        .select('*')
        .eq('user_id', wId)
        .gte('started_at', todayMidnight.toISOString())
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (todayShift) {
        if (!todayShift.active) {
          await supabase
            .from('worker_shifts')
            .update({ active: true, ended_at: null })
            .eq('id', todayShift.id);
          todayShift.active = true;
          todayShift.ended_at = null;
        }
        localStorage.setItem(`active_shift_${wId}`, JSON.stringify(todayShift));
        return todayShift;
      }

      // Try creating new shift row in Supabase
      const { data: newShift, error: shiftError } = await supabase
        .from('worker_shifts')
        .insert({
          user_id: wId,
          started_at: new Date().toISOString(),
          active: true,
          amount_taken_float: 0,
          amount_returned_float: 0,
        })
        .select()
        .maybeSingle();

      if (!shiftError && newShift) {
        localStorage.setItem(`active_shift_${wId}`, JSON.stringify(newShift));
        return newShift;
      }
    } catch (e) {
      console.warn('Network/RLS error while auto-ensuring shift in Supabase, continuing locally:', e);
    }

    // 2. Resilient local fallback session for offline / dev mode / PIN auth
    const cached = localStorage.getItem(`active_shift_${wId}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.active !== false) {
          return parsed;
        }
      } catch {
        /* ignore parse error */
      }
    }

    const fallbackShift: WorkerShift = {
      id: generateUUID(),
      user_id: wId,
      started_at: new Date().toISOString(),
      ended_at: null,
      amount_taken_float: 0,
      amount_returned_float: 0,
      notes: null,
      active: true,
    };
    localStorage.setItem(`active_shift_${wId}`, JSON.stringify(fallbackShift));
    return fallbackShift;
  }, []);

  const fetchFloatTransactions = useCallback(async (shiftId: string) => {
    try {
      const { data, error } = await supabase
        .from('float_transactions')
        .select('*')
        .eq('shift_id', shiftId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const txs = data || [];
      if (txs.length > 0) {
        setFloatTransactions(txs);
        if (workerId) {
          try {
            localStorage.setItem(`float_txs_${workerId}`, JSON.stringify(txs));
          } catch {
            /* ignore storage error */
          }
        }
        return;
      }
    } catch (error) {
      console.warn('Error fetching float transactions from Supabase:', error);
    }

    // Fallback to local storage
    if (workerId) {
      try {
        const cached = localStorage.getItem(`float_txs_${workerId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            setFloatTransactions(parsed);
          }
        }
      } catch {
        /* ignore parse error */
      }
    }
  }, [workerId]);

  const fetchCurrentShift = useCallback(async () => {
    if (!workerId) return;

    try {
      const { data, error } = await supabase
        .from('worker_shifts')
        .select('*')
        .eq('user_id', workerId)
        .eq('active', true)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setCurrentShift(data);
        try {
          localStorage.setItem(`active_shift_${workerId}`, JSON.stringify(data));
        } catch {
          /* ignore storage error */
        }
        await fetchFloatTransactions(data.id);
      } else {
        // If Supabase has no active shift, check if we have a valid active shift locally for today
        const cached = localStorage.getItem(`active_shift_${workerId}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed && parsed.active !== false) {
              setCurrentShift(parsed);
              if (parsed.id) {
                await fetchFloatTransactions(parsed.id);
              }
              return;
            }
          } catch {
            /* ignore parse error */
          }
        }

        // Auto-ensure shift for today as worker is logged in
        const ensured = await ensureActiveShift(workerId);
        setCurrentShift(ensured);
        if (ensured.id) {
          await fetchFloatTransactions(ensured.id);
        }
      }
    } catch (error) {
      console.warn('Error fetching current shift from Supabase, checking local cache:', error);
      const cached = localStorage.getItem(`active_shift_${workerId}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.active !== false) {
            setCurrentShift(parsed);
            if (parsed.id) {
              await fetchFloatTransactions(parsed.id);
            }
            return;
          }
        } catch {
          /* ignore parse error */
        }
      }
      const ensured = await ensureActiveShift(workerId);
      setCurrentShift(ensured);
    }
  }, [workerId, ensureActiveShift, fetchFloatTransactions]);

  const fetchShiftHistory = useCallback(async () => {
    if (!workerId) return;

    try {
      const { data, error } = await supabase
        .from('worker_shifts')
        .select('*')
        .eq('user_id', workerId)
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setShiftHistory(data || []);
    } catch (error) {
      console.warn('Error fetching shift history from Supabase:', error);
    }
  }, [workerId]);

  const calculateTotals = useCallback(() => {
    const totalTaken = floatTransactions
      .filter(t => t.transaction_type === 'take')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalReturned = floatTransactions
      .filter(t => t.transaction_type === 'return')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return { totalTaken, totalReturned, netFloat: totalTaken - totalReturned };
  }, [floatTransactions]);

  const takeFloat = async (amount: number) => {
    if (!workerId) return { success: false, error: 'Staff member not identified' };

    let shift = currentShift;
    if (!shift || !shift.active) {
      shift = await ensureActiveShift(workerId);
      setCurrentShift(shift);
    }

    if (!shift) {
      return { success: false, error: 'Unable to initialize shift session' };
    }

    setIsLoading(true);
    try {
      const { totalTaken } = calculateTotals();
      const newTotal = totalTaken + amount;

      const newTx: FloatTransaction = {
        id: generateUUID(),
        shift_id: shift.id,
        user_id: workerId,
        transaction_type: 'take',
        amount: amount,
        created_at: new Date().toISOString(),
      };

      // 1. Try Supabase insert if available
      try {
        const { error: transactionError } = await supabase
          .from('float_transactions')
          .insert({
            id: newTx.id,
            shift_id: shift.id,
            user_id: workerId,
            transaction_type: 'take',
            amount: amount,
          });

        if (!transactionError) {
          await supabase
            .from('worker_shifts')
            .update({ amount_taken_float: newTotal })
            .eq('id', shift.id);
        } else {
          console.warn('Supabase float transaction insert skipped/failed, persisting locally:', transactionError);
        }
      } catch (dbErr) {
        console.warn('Network/DB error recording float, saving to local shift:', dbErr);
      }

      // 2. Always persist to local state & storage for immediate UI update and offline resilience
      const updatedTxs = [...floatTransactions, newTx];
      setFloatTransactions(updatedTxs);
      localStorage.setItem(`float_txs_${workerId}`, JSON.stringify(updatedTxs));

      const updatedShift: WorkerShift = {
        ...shift,
        amount_taken_float: newTotal,
      };
      setCurrentShift(updatedShift);
      localStorage.setItem(`active_shift_${workerId}`, JSON.stringify(updatedShift));

      // Record activity locally
      recordWorkerActivity(workerId, {
        type: 'float_taken',
        title: `Float Taken: GH₵ ${amount.toFixed(2)}`,
        details: `Shift float updated to GH₵ ${newTotal.toFixed(2)}`,
        amount,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error taking float:', error);
      return { success: false, error: error.message || 'Failed to record float transaction' };
    } finally {
      setIsLoading(false);
    }
  };

  const returnFloat = async (amount: number) => {
    if (!workerId) return { success: false, error: 'Staff member not identified' };

    let shift = currentShift;
    if (!shift || !shift.active) {
      shift = await ensureActiveShift(workerId);
      setCurrentShift(shift);
    }

    if (!shift) {
      return { success: false, error: 'No active shift found' };
    }

    const { totalTaken, totalReturned } = calculateTotals();

    if (totalTaken === 0) {
      return { success: false, error: 'You must take a float before returning' };
    }

    setIsLoading(true);
    try {
      const newTotalReturned = totalReturned + amount;

      const newTx: FloatTransaction = {
        id: generateUUID(),
        shift_id: shift.id,
        user_id: workerId,
        transaction_type: 'return',
        amount: amount,
        created_at: new Date().toISOString(),
      };

      // 1. Try Supabase insert if available
      try {
        const { error: transactionError } = await supabase
          .from('float_transactions')
          .insert({
            id: newTx.id,
            shift_id: shift.id,
            user_id: workerId,
            transaction_type: 'return',
            amount: amount,
          });

        if (!transactionError) {
          await supabase
            .from('worker_shifts')
            .update({ amount_returned_float: newTotalReturned })
            .eq('id', shift.id);
        } else {
          console.warn('Supabase float return insert skipped/failed, persisting locally:', transactionError);
        }
      } catch (dbErr) {
        console.warn('Network/DB error recording float return, saving to local shift:', dbErr);
      }

      // 2. Always persist to local state & storage
      const updatedTxs = [...floatTransactions, newTx];
      setFloatTransactions(updatedTxs);
      localStorage.setItem(`float_txs_${workerId}`, JSON.stringify(updatedTxs));

      const updatedShift: WorkerShift = {
        ...shift,
        amount_returned_float: newTotalReturned,
      };
      setCurrentShift(updatedShift);
      localStorage.setItem(`active_shift_${workerId}`, JSON.stringify(updatedShift));

      // Record activity locally
      recordWorkerActivity(workerId, {
        type: 'float_returned',
        title: `Float Returned: GH₵ ${amount.toFixed(2)}`,
        details: `Total returned: GH₵ ${newTotalReturned.toFixed(2)}`,
        amount,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error returning float:', error);
      return { success: false, error: error.message || 'Failed to record return transaction' };
    } finally {
      setIsLoading(false);
    }
  };

  const endShift = async () => {
    if (!workerId || !currentShift) return { success: false, error: 'No active shift' };

    const { totalTaken, totalReturned } = calculateTotals();

    // Check if remaining float is outstanding
    if (totalTaken > 0 && totalReturned < totalTaken) {
      const remaining = totalTaken - totalReturned;
      return {
        success: false,
        error: `Please return remaining float of GH₵ ${remaining.toFixed(2)} before closing shift.`
      };
    }

    setIsLoading(true);
    try {
      try {
        await supabase
          .from('worker_shifts')
          .update({
            ended_at: new Date().toISOString(),
            active: false
          })
          .eq('id', currentShift.id);
      } catch (dbErr) {
        console.warn('Network/DB error ending shift in Supabase, continuing locally:', dbErr);
      }

      recordWorkerActivity(workerId, {
        type: 'shift_ended',
        title: 'Shift Closed',
        details: `Returned GH₵ ${totalReturned.toFixed(2)} of GH₵ ${totalTaken.toFixed(2)} float`,
      });

      localStorage.removeItem(`active_shift_${workerId}`);
      localStorage.removeItem(`float_txs_${workerId}`);
      setCurrentShift(null);
      setFloatTransactions([]);
      await fetchShiftHistory();

      return { success: true };
    } catch (error: any) {
      console.error('Error ending shift:', error);
      return { success: false, error: error.message || 'Failed to end shift' };
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (workerId) {
      fetchCurrentShift();
      fetchShiftHistory();
    }
  }, [workerId, fetchCurrentShift, fetchShiftHistory]);

  const { totalTaken, totalReturned, netFloat } = calculateTotals();

  return {
    currentShift,
    floatTransactions,
    shiftHistory,
    isLoading,
    totalTaken,
    totalReturned,
    netFloat,
    takeFloat,
    returnFloat,
    endShift,
    ensureActiveShift,
    refreshShift: fetchCurrentShift,
  };
};
