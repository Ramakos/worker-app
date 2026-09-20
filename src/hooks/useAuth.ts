import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Worker } from '../types';
import { recordWorkerActivity } from '../lib/workerActivity';

const DEV_WORKER: Worker = {
  id: '00000000-0000-0000-0000-000000000001',
  full_name: 'Dev Server',
  username: 'dev@server.app',
  worker_id: 'DEV-001',
  role: 'general_worker',
  is_active: true,
};

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
    try {
      // 1. Fetch active worker profiles
      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, full_name, username, worker_id, is_active, pin')
        .eq('is_active', true);

      if (profileError) throw profileError;

      // 2. Query user_roles separately (to avoid missing FK relationship error PGRST200)
      const rolesMap: Record<string, string> = {};
      try {
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('user_id, role');

        if (rolesData) {
          rolesData.forEach((r: any) => {
            if (r.user_id && r.role) {
              rolesMap[r.user_id] = r.role;
            }
          });
        }
      } catch (rolesErr) {
        console.warn('Could not fetch user_roles (falling back to general_worker):', rolesErr);
      }

      // 3. Combine profiles and roles
      const workersData = profiles?.map(user => ({
        id: user.id,
        full_name: user.full_name || user.username,
        username: user.username,
        worker_id: user.worker_id,
        role: (rolesMap[user.id] || 'general_worker') as any,
        is_active: user.is_active !== false,
        has_pin: Boolean(user.pin),
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

      // Check if shift already exists, resume if active, start if not
      let shiftRecord: any = null;
      const { data: existingShift } = await supabase
        .from('worker_shifts')
        .select('*')
        .eq('user_id', worker.id)
        .eq('active', true)
        .maybeSingle();

      if (!existingShift) {
        const { data: newShift, error: shiftError } = await supabase
          .from('worker_shifts')
          .insert({
            user_id: worker.id,
            started_at: new Date().toISOString(),
            active: true,
          })
          .select()
          .maybeSingle();

        if (shiftError) {
          console.error('Shift creation error:', shiftError);
          return { error: 'Failed to start shift. Please try again.' };
        }
        shiftRecord = newShift;
      } else {
        shiftRecord = existingShift;
      }

      const activeWorker = { ...worker, is_active: true, auth_method: 'password' as const };
      setCurrentWorker(activeWorker);
      localStorage.setItem('currentWorker', JSON.stringify(activeWorker));
      if (shiftRecord) {
        localStorage.setItem(`active_shift_${worker.id}`, JSON.stringify(shiftRecord));
      }
      localStorage.setItem('workerSession', JSON.stringify({
        worker: activeWorker,
        shift: shiftRecord,
        login_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
      }));

      // Record activity locally
      recordWorkerActivity(worker.id, {
        type: 'shift_started',
        title: 'Shift Started',
        details: `Signed in with password at ${new Date().toLocaleTimeString()}`,
      });

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

      // Check if shift already exists, resume if active, start if not
      let shiftRecord: any = null;
      const { data: existingShift } = await supabase
        .from('worker_shifts')
        .select('*')
        .eq('user_id', worker.id)
        .eq('active', true)
        .maybeSingle();

      if (!existingShift) {
        const { data: newShift, error: shiftError } = await supabase
          .from('worker_shifts')
          .insert({
            user_id: worker.id,
            started_at: new Date().toISOString(),
            active: true,
          })
          .select()
          .maybeSingle();

        if (shiftError) {
          console.error('Shift creation error:', shiftError);
          return { error: 'Failed to start shift. Please try again.' };
        }
        shiftRecord = newShift;
      } else {
        shiftRecord = existingShift;
      }

      const activeWorker = { ...worker, is_active: true, auth_method: 'pin' as const };
      setCurrentWorker(activeWorker);
      localStorage.setItem('currentWorker', JSON.stringify(activeWorker));
      if (shiftRecord) {
        localStorage.setItem(`active_shift_${worker.id}`, JSON.stringify(shiftRecord));
      }
      localStorage.setItem('workerSession', JSON.stringify({
        worker: activeWorker,
        shift: shiftRecord,
        login_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
      }));

      // Record activity locally
      recordWorkerActivity(worker.id, {
        type: 'shift_started',
        title: 'Shift Started (Quick PIN)',
        details: `Signed in with PIN at ${new Date().toLocaleTimeString()}`,
      });

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
        if (worker.auth_method === 'pin') {
          // Verify worker is still active, but be offline-tolerant
          try {
            const { data, error } = await supabase
              .from('user_profiles')
              .select('is_active')
              .eq('id', worker.id)
              .maybeSingle();

            if (!error && data) {
              if (data.is_active === false) {
                // Account explicitly deactivated by manager
                localStorage.removeItem('currentWorker');
                localStorage.removeItem('workerSession');
                setCurrentWorker(null);
              } else {
                setCurrentWorker(worker);
              }
            } else {
              // Network offline/error - retain current session
              setCurrentWorker(worker);
            }
          } catch {
            // Keep session on network failure
            setCurrentWorker(worker);
          }
          return;
        }

        // For password logins, check Supabase session if online
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (!error && session?.user) {
            if (session.user.id === worker.id) {
              setCurrentWorker(worker);
            } else {
              localStorage.removeItem('currentWorker');
              localStorage.removeItem('workerSession');
              setCurrentWorker(null);
            }
          } else {
            // Keep local session unless explicitly logged out
            setCurrentWorker(worker);
          }
        } catch {
          setCurrentWorker(worker);
        }
      } catch {
        localStorage.removeItem('currentWorker');
        setCurrentWorker(null);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
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
