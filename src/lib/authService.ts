import { supabase } from './supabase';
import { Worker } from '../types';
import { recordWorkerActivity } from './workerActivity';

export const DEV_WORKER: Worker = {
  id: '00000000-0000-0000-0000-000000000001',
  full_name: 'Dev Server',
  username: 'dev@server.app',
  worker_id: 'DEV-001',
  role: 'general_worker',
  is_active: true,
};

export const fetchActiveWorkers = async (): Promise<Worker[]> => {
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
    return (
      profiles?.map(user => ({
        id: user.id,
        full_name: user.full_name || user.username,
        username: user.username,
        worker_id: user.worker_id,
        role: (rolesMap[user.id] || 'general_worker') as any,
        is_active: user.is_active !== false,
        has_pin: Boolean(user.pin),
      })) || []
    );
  } catch (error) {
    console.error('Error fetching workers:', error);
    return [];
  }
};

export const startOrResumeWorkerShift = async (
  worker: Worker,
  authMethod: 'password' | 'pin'
): Promise<{ worker: Worker; shift: any }> => {
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
      throw new Error('Failed to start shift. Please try again.');
    }
    shiftRecord = newShift;
  } else {
    shiftRecord = existingShift;
  }

  const activeWorker: Worker = { ...worker, is_active: true, auth_method: authMethod };
  localStorage.setItem('currentWorker', JSON.stringify(activeWorker));
  if (shiftRecord) {
    localStorage.setItem(`active_shift_${worker.id}`, JSON.stringify(shiftRecord));
  }
  localStorage.setItem(
    'workerSession',
    JSON.stringify({
      worker: activeWorker,
      shift: shiftRecord,
      login_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
    })
  );

  recordWorkerActivity(worker.id, {
    type: 'shift_started',
    title: authMethod === 'pin' ? 'Shift Started (Quick PIN)' : 'Shift Started',
    details: `Signed in with ${authMethod === 'pin' ? 'PIN' : 'password'} at ${new Date().toLocaleTimeString()}`,
  });

  return { worker: activeWorker, shift: shiftRecord };
};

export const validateStoredSession = async (
  worker: any
): Promise<Worker | null> => {
  if (worker.auth_method === 'pin') {
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
          return null;
        }
        return worker;
      }
      // Network offline/error - retain current session
      return worker;
    } catch {
      return worker;
    }
  }

  // For password logins, check Supabase session if online
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (!error && session?.user) {
      if (session.user.id === worker.id) {
        return worker;
      }
      localStorage.removeItem('currentWorker');
      localStorage.removeItem('workerSession');
      return null;
    }
    // Keep local session unless explicitly logged out
    return worker;
  } catch {
    return worker;
  }
};
