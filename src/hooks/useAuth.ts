import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Worker } from '../types';
import { recordWorkerActivity } from '../lib/workerActivity';
import {
  DEV_WORKER,
  fetchActiveWorkers,
  startOrResumeWorkerShift,
  validateStoredSession,
} from '../lib/authService';

export const useAuth = () => {
  // Synchronously hydrate from localStorage to prevent login flicker on reload
  const [currentWorker, setCurrentWorker] = useState<Worker | null>(() => {
    try {
      const storedDevMode = localStorage.getItem('devMode') === 'true';
      if (storedDevMode) return DEV_WORKER;
      const stored = localStorage.getItem('currentWorker');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const devModeRef = useRef(localStorage.getItem('devMode') === 'true');

  const devSignIn = () => {
    devModeRef.current = true;
    setCurrentWorker(DEV_WORKER);
    localStorage.setItem('currentWorker', JSON.stringify(DEV_WORKER));
    localStorage.setItem('devMode', 'true');
    recordWorkerActivity(DEV_WORKER.id, {
      type: 'shift_started',
      title: 'Dev Shift Started',
      details: 'Dev mode quick access session',
    });
  };

  const fetchWorkers = async () => {
    const data = await fetchActiveWorkers();
    setWorkers(data);
  };

  const signIn = async (workerId: string, password: string) => {
    setIsLoading(true);
    try {
      const worker = workers.find(w => w.id === workerId);
      if (!worker) {
        return { error: 'Worker not found' };
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

      const { worker: activeWorker } = await startOrResumeWorkerShift(worker, 'password');
      setCurrentWorker(activeWorker);
      return { success: true };
    } catch (error: any) {
      console.error('Error signing in:', error);
      return { error: error.message || 'An unexpected error occurred. Please try again.' };
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

      const { worker: activeWorker } = await startOrResumeWorkerShift(worker, 'pin');
      setCurrentWorker(activeWorker);
      return { success: true };
    } catch (error: any) {
      console.error('Error signing in with PIN:', error);
      return { error: error.message || 'An unexpected error occurred. Please try again.' };
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

      setWorkers(prev => prev.map(w => (w.id === workerId ? { ...w, has_pin: true } : w)));
      return { success: true };
    } catch (err: any) {
      console.error('Error setting PIN:', err);
      return { error: err.message || 'Failed to save PIN' };
    }
  };

  const signOut = async () => {
    if (currentWorker) {
      recordWorkerActivity(currentWorker.id, {
        type: 'shift_ended',
        title: 'Shift Ended',
        details: `Signed out at ${new Date().toLocaleTimeString()}`,
      });

      if (!devModeRef.current) {
        try {
          await supabase.auth.signOut();
        } catch (error) {
          console.error('Error during sign out:', error);
        }
      }
    }

    devModeRef.current = false;
    setCurrentWorker(null);
    localStorage.removeItem('currentWorker');
    localStorage.removeItem('workerSession');
    localStorage.removeItem('devMode');
  };

  useEffect(() => {
    const storedDevMode = localStorage.getItem('devMode') === 'true';
    if (storedDevMode) {
      devModeRef.current = true;
      const stored = localStorage.getItem('currentWorker');
      if (stored) {
        try {
          setCurrentWorker(JSON.parse(stored));
        } catch {}
      }
      return;
    }

    fetchWorkers();

    const checkSession = async () => {
      const stored = localStorage.getItem('currentWorker');
      if (!stored) return;

      try {
        const worker = JSON.parse(stored);
        const validWorker = await validateStoredSession(worker);
        setCurrentWorker(validWorker);
      } catch {
        localStorage.removeItem('currentWorker');
        setCurrentWorker(null);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, _session) => {
      const stored = localStorage.getItem('currentWorker');
      if (stored) {
        try {
          const worker = JSON.parse(stored);
          if (worker.auth_method === 'pin') {
            return; // Ignore supabase auth state changes for PIN-authenticated workers
          }
        } catch {}
      }

      // Only wipe if user explicitly signed out
      if (event === 'SIGNED_OUT' && !devModeRef.current) {
        setCurrentWorker(null);
        localStorage.removeItem('currentWorker');
        localStorage.removeItem('workerSession');
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
