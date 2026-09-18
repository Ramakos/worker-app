import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Worker } from '../types';

const DEV_WORKER: Worker = {
  id: '00000000-0000-0000-0000-000000000001',
  full_name: 'Dev Server',
  username: 'dev@server.app',
  worker_id: 'DEV-001',
  role: 'general_worker',
  is_active: true,
};

export const useAuth = () => {
  const [currentWorker, setCurrentWorker] = useState<Worker | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const devModeRef = useRef(false);

  const devSignIn = () => {
    devModeRef.current = true;
    setCurrentWorker(DEV_WORKER);
    localStorage.setItem('currentWorker', JSON.stringify(DEV_WORKER));
    localStorage.setItem('devMode', 'true');
  };

  const fetchWorkers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          id,
          full_name,
          username,
          worker_id,
          is_active,
          pin,
          user_roles (
            role
          )
        `)
        .eq('is_active', true);

      if (error) throw error;

      const workersData = data?.map(user => ({
        id: user.id,
        full_name: user.full_name || user.username,
        username: user.username,
        worker_id: user.worker_id,
        role: (user.user_roles as any)?.[0]?.role || 'general_worker',
        is_active: user.is_active || false,
        has_pin: Boolean((user as any).pin),
      })) || [];

      setWorkers(workersData);
    } catch (error) {
      console.error('Error fetching workers:', error);
    }
  };

  const signIn = async (workerId: string, password: string) => {
    setIsLoading(true);
    try {
      const worker = workers.find(w => w.id === workerId);
      if (!worker) {
        return { error: 'Worker not found' };
      }

      const { data: existingShift } = await supabase
        .from('worker_shifts')
        .select('*')
        .eq('user_id', worker.id)
        .eq('active', true)
        .maybeSingle();

      if (existingShift) {
        return { error: 'You already have an active shift. Please end your current shift first.' };
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: worker.username,
        password: password,
      });

      if (authError) {
        console.error('Auth error:', authError);
        return { error: 'Invalid password. Please try again.' };
      }

      if (!authData.user || authData.user.id !== worker.id) {
        return { error: 'Authentication failed' };
      }

      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('is_active')
        .eq('id', worker.id)
        .maybeSingle();

      if (profileError || !profileData) {
        return { error: 'Failed to verify account status' };
      }

      if (!profileData.is_active) {
        await supabase.auth.signOut();
        return { error: 'Your account is inactive. Please contact a manager.' };
      }

      const { error: shiftError } = await supabase
        .from('worker_shifts')
        .insert({
          user_id: worker.id,
          started_at: new Date().toISOString(),
          active: true,
        });

      if (shiftError) {
        console.error('Shift creation error:', shiftError);
        return { error: 'Failed to start shift. Please try again.' };
      }

      const activeWorker = { ...worker, is_active: true };
      setCurrentWorker(activeWorker);
      localStorage.setItem('currentWorker', JSON.stringify(activeWorker));

      return { success: true };
    } catch (error) {
      console.error('Error signing in:', error);
      return { error: 'An unexpected error occurred. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithPin = async (workerId: string, pin: string) => {
    setIsLoading(true);
    try {
      const worker = workers.find(w => w.id === workerId);
      if (!worker) {
        return { error: 'Worker not found' };
      }

      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, pin, is_active')
        .eq('id', worker.id)
        .eq('pin', pin)
        .eq('is_active', true)
        .maybeSingle();

      if (profileError || !profileData) {
        return { error: 'Invalid PIN. Please try again or sign in with your password.' };
      }

      // Check if shift already exists
      const { data: existingShift } = await supabase
        .from('worker_shifts')
        .select('*')
        .eq('user_id', worker.id)
        .eq('active', true)
        .maybeSingle();

      if (!existingShift) {
        const { error: shiftError } = await supabase
          .from('worker_shifts')
          .insert({
            user_id: worker.id,
            started_at: new Date().toISOString(),
            active: true,
          });

        if (shiftError) {
          console.error('Shift creation error:', shiftError);
          return { error: 'Failed to start shift. Please try again.' };
        }
      }

      const activeWorker = { ...worker, is_active: true };
      setCurrentWorker(activeWorker);
      localStorage.setItem('currentWorker', JSON.stringify(activeWorker));

      return { success: true };
    } catch (error) {
      console.error('Error signing in with PIN:', error);
      return { error: 'An unexpected error occurred. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const setWorkerPin = async (workerId: string, pin: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ pin })
        .eq('id', workerId);

      if (error) throw error;

      setWorkers(prev => prev.map(w => w.id === workerId ? { ...w, has_pin: true } : w));
      return { success: true };
    } catch (err: any) {
      console.error('Error setting PIN:', err);
      return { error: err.message || 'Failed to save PIN' };
    }
  };

  const signOut = async () => {
    if (currentWorker && !devModeRef.current) {
      try {
        const { error: shiftError } = await supabase
          .from('worker_shifts')
          .update({
            ended_at: new Date().toISOString(),
            active: false
          })
          .eq('user_id', currentWorker.id)
          .eq('active', true);

        if (shiftError) {
          console.error('Error ending shift:', shiftError);
        }

        const { error: authError } = await supabase.auth.signOut();
        if (authError) {
          console.error('Error signing out:', authError);
        }
      } catch (error) {
        console.error('Error during sign out:', error);
      }
    }

    devModeRef.current = false;
    setCurrentWorker(null);
    localStorage.removeItem('currentWorker');
    localStorage.removeItem('devMode');
  };

  useEffect(() => {
    const storedDevMode = localStorage.getItem('devMode') === 'true';
    if (storedDevMode) {
      devModeRef.current = true;
      const stored = localStorage.getItem('currentWorker');
      if (stored) {
        setCurrentWorker(JSON.parse(stored));
      }
      return;
    }

    fetchWorkers();

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const stored = localStorage.getItem('currentWorker');
        if (stored) {
          const worker = JSON.parse(stored);
          if (worker.id === session.user.id) {
            setCurrentWorker(worker);
          } else {
            localStorage.removeItem('currentWorker');
          }
        }
      } else {
        localStorage.removeItem('currentWorker');
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && !devModeRef.current) {
        setCurrentWorker(null);
        localStorage.removeItem('currentWorker');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    currentWorker,
    isLoading,
    signIn,
    signInWithPin,
    setWorkerPin,
    signOut,
    devSignIn,
    workers,
  };
};
