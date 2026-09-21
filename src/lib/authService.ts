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
    // Exact method as Admin Portal (staffService.ts): Parallel query for profiles and roles
    const [profilesRes, rolesRes] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('id, full_name, username, worker_id, is_active, pin')
        .order('full_name', { ascending: true }),
      supabase
        .from('user_roles')
        .select('user_id, role'),
    ]);

    const rolesByUserId = new Map<string, string[]>();
    if (rolesRes.data) {
      for (const r of rolesRes.data as any[]) {
        if (!r.user_id || !r.role) continue;
        const current = rolesByUserId.get(r.user_id) || [];
        current.push(r.role);
        rolesByUserId.set(r.user_id, current);
      }
    }

    if (profilesRes.data && profilesRes.data.length > 0) {
      const activeWorkers: Worker[] = profilesRes.data
        .filter((u: any) => u.is_active !== false)
        .map((u: any) => {
          const userRoles = rolesByUserId.get(u.id) || [];
          let primaryRole: Worker['role'] = 'general_worker';
          if (userRoles.includes('admin')) primaryRole = 'admin';
          else if (userRoles.includes('counter_worker')) primaryRole = 'counter_worker';
          else if (userRoles.includes('kitchen_staff')) primaryRole = 'kitchen_staff';
          else if (userRoles.length > 0) primaryRole = userRoles[0] as any;

          return {
            id: u.id,
            full_name: u.full_name || u.username || 'Staff Member',
            username: u.username || '',
            worker_id: u.worker_id || null,
            role: primaryRole,
            is_active: true,
            has_pin: Boolean(u.pin),
          };
        });

      if (activeWorkers.length > 0) {
        try {
          localStorage.setItem('cached_workers', JSON.stringify(activeWorkers));
        } catch {}
        return activeWorkers;
      }
    }
  } catch (error) {
    console.warn('Error fetching workers from live database:', error);
  }

  // Fallback to cached workers for offline or initial load
  try {
    const cached = localStorage.getItem('cached_workers');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}

  return [];
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
