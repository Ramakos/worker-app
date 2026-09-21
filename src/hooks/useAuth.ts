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

  // Synchronously hydrate workers from cache so staff directory displays immediately
  const [workers, setWorkers] = useState<Worker[]>(() => {
    try {
      const cached = localStorage.getItem('cached_workers');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });

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
    if (data && data.length > 0) {
      setWorkers(data);
    }
  };

  const normalizeEmail = (input: string): string => {
    const clean = input.trim().toLowerCase();
    if (clean.includes('@')) return clean;
    return `${clean}@ramakos.com`;
  };

  const signIn = async (workerIdOrEmail: string, password: string) => {
    setIsLoading(true);
    try {
      const cleanInput = workerIdOrEmail.trim();

      // 1. Check if user selected a worker from list OR entered ID/username/email
      let matchedWorker = workers.find(
        (w) =>
          w.id === cleanInput ||
          w.username.toLowerCase() === cleanInput.toLowerCase() ||
          normalizeEmail(w.username) === normalizeEmail(cleanInput)
      );

      // 2. Identify candidate emails to attempt authentication against Supabase Auth
      const candidateEmails: string[] = [];
      if (matchedWorker) {
        candidateEmails.push(normalizeEmail(matchedWorker.username));
        if (matchedWorker.username.includes('@')) {
          candidateEmails.push(matchedWorker.username);
        }
      } else {
        candidateEmails.push(normalizeEmail(cleanInput));
        if (cleanInput.includes('@')) {
          candidateEmails.push(cleanInput);
        }
      }

      // De-duplicate candidate emails
      const uniqueEmails = Array.from(new Set(candidateEmails.map((e) => e.toLowerCase())));

      let authData: any = null;
      let lastAuthError: any = null;

      for (const emailCandidate of uniqueEmails) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailCandidate,
          password: password,
        });
        if (!error && data?.user) {
          authData = data;
          lastAuthError = null;
          break;
        }
        lastAuthError = error;
      }

      if (lastAuthError || !authData?.user) {
        console.error('Auth error on candidate emails:', uniqueEmails, lastAuthError);
        return { error: 'Invalid password. Please check your credentials or use quick PIN.' };
      }

      // If not previously in list, fetch profile as authenticated user
      if (!matchedWorker) {
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('id, full_name, username, worker_id, is_active, pin')
          .eq('id', authData.user.id)
          .maybeSingle();

        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authData.user.id);

        let primaryRole: Worker['role'] = 'general_worker';
        if (roleData && roleData.length > 0) {
          const roles = roleData.map((r: any) => r.role);
          if (roles.includes('admin')) primaryRole = 'admin';
          else if (roles.includes('counter_worker')) primaryRole = 'counter_worker';
          else if (roles.includes('kitchen_staff')) primaryRole = 'kitchen_staff';
        }

        matchedWorker = {
          id: authData.user.id,
          full_name: profileData?.full_name || authData.user.email || 'Staff Member',
          username: profileData?.username || authData.user.email || '',
          worker_id: profileData?.worker_id || null,
          role: primaryRole,
          is_active: profileData?.is_active !== false,
          has_pin: Boolean(profileData?.pin),
        };
      }

      if (matchedWorker.is_active === false) {
        await supabase.auth.signOut();
        return { error: 'Your account is inactive. Please contact a manager.' };
      }

      const { worker: activeWorker } = await startOrResumeWorkerShift(matchedWorker, 'password');
      setCurrentWorker(activeWorker);

      // Now authenticated: refresh the complete worker directory for this device
      fetchWorkers();

      return { success: true };
    } catch (error: any) {
      console.error('Error signing in:', error);
      return { error: error.message || 'An unexpected error occurred. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithPin = async (workerIdOrPin: string, pin?: string) => {
    setIsLoading(true);
    try {
      const pinToVerify = pin || workerIdOrPin;
      let targetWorker = pin ? workers.find((w) => w.id === workerIdOrPin) : undefined;

      // 1. Try secure RPC lookup_profile_by_pin (Security Definer in Supabase)
      try {
        const { data: rpcData, error: rpcError } = await (supabase as any).rpc('lookup_profile_by_pin', {
          _pin: pinToVerify,
        });

        if (!rpcError && rpcData && rpcData.length > 0) {
          const matched = targetWorker ? rpcData.find((p: any) => p.id === targetWorker!.id) : rpcData[0];
          if (matched) {
            const resolvedWorker: Worker = targetWorker || {
              id: matched.id,
              full_name: matched.full_name || matched.username || 'Staff Member',
              username: matched.username,
              worker_id: matched.worker_id,
              role: 'general_worker',
              is_active: true,
              has_pin: true,
            };

            const { worker: activeWorker } = await startOrResumeWorkerShift(resolvedWorker, 'pin');
            setCurrentWorker(activeWorker);
            fetchWorkers();
            return { success: true };
          }
        }
      } catch (rpcErr) {
        console.warn('RPC lookup_profile_by_pin error:', rpcErr);
      }

      // 2. Direct table fallback if user_profiles is readable
      if (targetWorker) {
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('id, pin, is_active')
          .eq('id', targetWorker.id)
          .eq('pin', pinToVerify)
          .maybeSingle();

        if (!profileError && profileData && profileData.is_active !== false) {
          const { worker: activeWorker } = await startOrResumeWorkerShift(targetWorker, 'pin');
          setCurrentWorker(activeWorker);
          fetchWorkers();
          return { success: true };
        }
      }

      return { error: 'Invalid PIN. Please try again or sign in with your password.' };
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
    fetchWorkers,
  };
};
