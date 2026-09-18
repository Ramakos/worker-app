import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { WorkerShift, FloatTransaction } from '../types';

export const useFloat = (workerId?: string) => {
  const [currentShift, setCurrentShift] = useState<WorkerShift | null>(null);
  const [floatTransactions, setFloatTransactions] = useState<FloatTransaction[]>([]);
  const [shiftHistory, setShiftHistory] = useState<WorkerShift[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCurrentShift = async () => {
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

      setCurrentShift(data || null);

      if (data) {
        await fetchFloatTransactions(data.id);
      }
    } catch (error) {
      console.error('Error fetching current shift:', error);
    }
  };

  const fetchFloatTransactions = async (shiftId: string) => {
    try {
      const { data, error } = await supabase
        .from('float_transactions')
        .select('*')
        .eq('shift_id', shiftId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setFloatTransactions(data || []);
    } catch (error) {
      console.error('Error fetching float transactions:', error);
    }
  };

  const fetchShiftHistory = async () => {
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
      console.error('Error fetching shift history:', error);
    }
  };

  const calculateTotals = () => {
    const totalTaken = floatTransactions
      .filter(t => t.transaction_type === 'take')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalReturned = floatTransactions
      .filter(t => t.transaction_type === 'return')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return { totalTaken, totalReturned, netFloat: totalTaken - totalReturned };
  };

  const takeFloat = async (amount: number) => {
    if (!workerId || !currentShift) return { success: false, error: 'No active shift' };

    setIsLoading(true);
    try {
      const { totalTaken } = calculateTotals();
      const newTotal = totalTaken + amount;

      const { error: transactionError } = await supabase
        .from('float_transactions')
        .insert({
          shift_id: currentShift.id,
          user_id: workerId,
          transaction_type: 'take',
          amount: amount,
        });

      if (transactionError) throw transactionError;

      const { error: updateError } = await supabase
        .from('worker_shifts')
        .update({ amount_taken_float: newTotal })
        .eq('id', currentShift.id);

      if (updateError) throw updateError;

      await fetchCurrentShift();
      await fetchShiftHistory();

      return { success: true };
    } catch (error) {
      console.error('Error taking float:', error);
      return { success: false, error: 'Failed to record float transaction' };
    } finally {
      setIsLoading(false);
    }
  };

  const returnFloat = async (amount: number) => {
    if (!workerId || !currentShift) return { success: false, error: 'No active shift' };

    const { totalTaken, totalReturned } = calculateTotals();

    if (totalTaken === 0) {
      return { success: false, error: 'You must take a float before returning' };
    }

    setIsLoading(true);
    try {
      const newTotalReturned = totalReturned + amount;

      const { error: transactionError } = await supabase
        .from('float_transactions')
        .insert({
          shift_id: currentShift.id,
          user_id: workerId,
          transaction_type: 'return',
          amount: amount,
        });

      if (transactionError) throw transactionError;

      const { error: updateError } = await supabase
        .from('worker_shifts')
        .update({ amount_returned_float: newTotalReturned })
        .eq('id', currentShift.id);

      if (updateError) throw updateError;

      await fetchCurrentShift();
      await fetchShiftHistory();

      return { success: true };
    } catch (error) {
      console.error('Error returning float:', error);
      return { success: false, error: 'Failed to record return transaction' };
    } finally {
      setIsLoading(false);
    }
  };

  const endShift = async () => {
    if (!workerId || !currentShift) return { success: false, error: 'No active shift' };

    const { totalTaken, totalReturned } = calculateTotals();

    if (totalTaken > 0 && totalReturned === 0) {
      return {
        success: false,
        error: 'Please return all floats before ending shift'
      };
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('worker_shifts')
        .update({
          ended_at: new Date().toISOString(),
          active: false
        })
        .eq('id', currentShift.id);

      if (error) throw error;

      setCurrentShift(null);
      setFloatTransactions([]);
      await fetchShiftHistory();

      return { success: true };
    } catch (error) {
      console.error('Error ending shift:', error);
      return { success: false, error: 'Failed to end shift' };
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (workerId) {
      fetchCurrentShift();
      fetchShiftHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workerId]);

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
  };
};
