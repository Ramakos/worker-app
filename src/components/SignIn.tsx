import { useState, useEffect } from 'react';
import { LogIn, Eye, EyeOff, AlertCircle, Zap, KeyRound, Check, RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from './Toast';
import ramakosLogoFull from '../assets/ramakos-logo-full.png';

const DEV_MODE = import.meta.env.DEV;

export const SignIn = () => {
  const { signIn, signInWithPin, setWorkerPin, isLoading, devSignIn, workers, fetchWorkers } = useAuth();
  const [loginMode, setLoginMode] = useState<'list' | 'direct'>(() => (workers.length > 0 ? 'list' : 'direct'));
  const [directEmail, setDirectEmail] = useState('');
  const [selectedWorker, setSelectedWorker] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [authMode, setAuthMode] = useState<'pin' | 'password'>('password');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingPinSetupWorkerId, setPendingPinSetupWorkerId] = useState<string | null>(null);
  const [newPin, setNewPin] = useState('');
  const [pinSuccessMsg, setPinSuccessMsg] = useState('');
  const { toast } = useToast();

  const selectedWorkerObj = workers.find((w) => w.id === selectedWorker);

  // When workers become available, default to list mode if not already set
  useEffect(() => {
    if (workers.length > 0 && !selectedWorker) {
      setSelectedWorker(workers[0].id);
      if (loginMode === 'direct' && !directEmail) {
        setLoginMode('list');
      }
    }
  }, [workers]);

  useEffect(() => {
    if (selectedWorkerObj) {
      if (selectedWorkerObj.has_pin) {
        setAuthMode('pin');
      } else {
        setAuthMode('password');
      }
      setPin('');
      setPassword('');
      setError('');
    }
  }, [selectedWorker, selectedWorkerObj]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await fetchWorkers();
      toast.info('Staff Sync', 'Worker directory refreshed from server.');
    } catch {
      toast.error('Sync Error', 'Could not reach server to sync staff list.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 1. Direct Email/Username Mode (like Admin Portal)
    if (loginMode === 'direct' || workers.length === 0) {
      if (!directEmail.trim()) {
        toast.warning('Enter Email', 'Please enter your staff email or username.');
        return;
      }
      if (!password) {
        toast.warning('Enter Password', 'Please enter your account password.');
        return;
      }
      const result = await signIn(directEmail.trim(), password);
      if (result?.error) {
        setError(result.error);
        toast.error('Sign-in Failed', result.error);
      } else {
        toast.success('Welcome Back!', 'Signed in successfully.');
      }
      return;
    }

    // 2. Worker Selection Mode
    if (!selectedWorker) {
      toast.warning('Select Worker', 'Please select your name from the staff list.');
      return;
    }

    if (authMode === 'pin') {
      if (!pin) {
        toast.warning('Enter PIN', 'Please enter your 4-digit staff PIN.');
        return;
      }
      const result = await signInWithPin(selectedWorker, pin);
      if (result?.error) {
        setError(result.error);
        toast.error('Sign-in Failed', result.error);
      } else {
        toast.success('Welcome Back!', `Signed in as ${selectedWorkerObj?.full_name || 'Staff'}`);
      }
    } else {
      if (!password) {
        toast.warning('Enter Password', 'Please enter your account password.');
        return;
      }
      const result = await signIn(selectedWorker, password);
      if (result?.error) {
        setError(result.error);
        toast.error('Sign-in Failed', result.error);
      } else if (result?.success && !selectedWorkerObj?.has_pin) {
        // Prompt for PIN setup
        setPendingPinSetupWorkerId(selectedWorker);
        toast.info('Quick Setup', 'Set a 4-digit PIN for instant access on future shifts.');
      } else {
        toast.success('Welcome Back!', `Signed in as ${selectedWorkerObj?.full_name || 'Staff'}`);
      }
    }
  };

  const handleSavePin = async () => {
    if (!pendingPinSetupWorkerId || newPin.length < 4) {
      toast.warning('Invalid PIN', 'PIN must be at least 4 digits.');
      return;
    }
    const res = await setWorkerPin(pendingPinSetupWorkerId, newPin);
    if (res?.error) {
      setError(res.error);
      toast.error('Setup Failed', res.error);
    } else {
      setPinSuccessMsg('PIN linked successfully!');
      toast.success('PIN Configured', 'Your 4-digit PIN is active for quick sign-in.');
      setTimeout(() => {
        setPendingPinSetupWorkerId(null);
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary to-accent flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-xl p-8 border border-border">
          <div className="text-center mb-8">
            <img
              src={ramakosLogoFull}
              alt="Ramakos Catering Service"
              className="h-16 w-auto mx-auto mb-3 object-contain"
            />
            <h1 className="text-2xl font-bold text-foreground mb-1 tracking-tight">Worker Portal</h1>
            <p className="text-sm text-muted-foreground">Sign in to start your shift</p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-5">
            {/* Header with Mode Toggle & Sync Button */}
            <div className="flex items-center justify-between pb-1 border-b border-border/60">
              <label className="block text-sm font-semibold text-foreground">
                {loginMode === 'direct' || workers.length === 0 ? 'Staff Account Sign-in' : 'Select Your Name'}
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="text-xs text-primary hover:underline flex items-center gap-1 font-medium disabled:opacity-50"
                  title="Sync staff from server"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
                </button>
                {workers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMode(loginMode === 'list' ? 'direct' : 'list');
                      setError('');
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground font-medium"
                  >
                    {loginMode === 'list' ? 'Use Email' : 'Use Staff List'}
                  </button>
                )}
              </div>
            </div>

            {/* DIRECT EMAIL / USERNAME LOGIN (Like Admin Portal) */}
            {loginMode === 'direct' || workers.length === 0 ? (
              <div className="space-y-4">
                {workers.length === 0 && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 text-xs text-muted-foreground flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground block mb-0.5">Staff Directory Sync</span>
                      Enter your staff email (e.g. <span className="text-primary font-mono font-medium">counter@ramakos.com</span>) & password to sign in. The worker list will automatically sync and cache on this device.
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Staff Email or Username
                  </label>
                  <input
                    type="text"
                    value={directEmail}
                    onChange={(e) => setDirectEmail(e.target.value)}
                    className="input h-11 w-full"
                    placeholder="e.g. counter@ramakos.com"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input h-11 pr-12 w-full"
                      placeholder="Enter your account password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* WORKER SELECTION FROM ROSTER */
              <div className="space-y-4">
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {workers.map((worker) => (
                    <label
                      key={worker.id}
                      className={`flex items-center p-3.5 border-2 rounded-xl cursor-pointer transition-all ${
                        selectedWorker === worker.id
                          ? 'border-primary bg-secondary'
                          : 'border-border hover:border-primary/50 hover:bg-accent'
                      }`}
                    >
                      <input
                        type="radio"
                        name="worker"
                        value={worker.id}
                        checked={selectedWorker === worker.id}
                        onChange={(e) => setSelectedWorker(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground text-sm">{worker.full_name}</span>
                          {worker.has_pin && (
                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                              PIN
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground capitalize">{worker.role.replace('_', ' ')}</div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border-2 ${
                          selectedWorker === worker.id
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground/30'
                        }`}
                      >
                        {selectedWorker === worker.id && (
                          <div className="w-2 h-2 bg-primary-foreground rounded-full m-0.5"></div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>

                {selectedWorkerObj && (
                  <div className="pt-2 border-t border-border/40">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-foreground">
                        {authMode === 'pin' ? 'Quick PIN' : 'Password'}
                      </label>
                      {selectedWorkerObj.has_pin && (
                        <button
                          type="button"
                          onClick={() => setAuthMode(authMode === 'pin' ? 'password' : 'pin')}
                          className="text-xs text-primary hover:underline font-medium"
                        >
                          {authMode === 'pin' ? 'Use Password instead' : 'Use PIN instead'}
                        </button>
                      )}
                    </div>

                    {authMode === 'pin' ? (
                      <div className="space-y-2">
                        <input
                          type="password"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          autoComplete="one-time-code"
                          maxLength={6}
                          value={pin}
                          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                          className="input text-center tracking-[1em] text-xl font-bold font-mono h-12"
                          placeholder="••••"
                          autoFocus
                        />
                        <p className="text-xs text-muted-foreground text-center">
                          Enter your 4-6 digit quick PIN
                        </p>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="input pr-12 h-11"
                          placeholder="Enter your password"
                          required
                          disabled={!selectedWorker}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="text-destructive text-sm">{error}</div>
              </div>
            )}

            {DEV_MODE && (
              <button
                type="button"
                onClick={devSignIn}
                className="w-full bg-foreground text-background py-3.5 px-6 rounded-xl font-medium text-sm
                         hover:bg-foreground/90 transition-colors flex items-center justify-center space-x-2"
              >
                <Zap className="w-4 h-4" />
                <span>Dev Mode - Skip Login</span>
              </button>
            )}

            <button
              type="submit"
              disabled={
                isLoading ||
                (loginMode === 'direct' || workers.length === 0
                  ? !directEmail.trim() || !password
                  : !selectedWorker || (authMode === 'pin' ? !pin : !password))
              }
              className="w-full bg-primary text-primary-foreground py-3.5 px-6 rounded-xl font-semibold text-base
                       hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors flex items-center justify-center space-x-2 shadow-brand"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-foreground border-t-transparent"></div>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Start Shift</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Post-Login PIN Setup Prompt */}
      {pendingPinSetupWorkerId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-sm border border-border shadow-2xl animate-in zoom-in-95">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-primary/10 text-primary mx-auto rounded-full flex items-center justify-center mb-2">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-foreground">Link a Quick PIN</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Set a 4-6 digit PIN so you can log in instantly next time without typing your password.
              </p>
            </div>

            {pinSuccessMsg ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 rounded-xl p-4 text-center font-medium flex items-center justify-center gap-2">
                <Check className="w-5 h-5" />
                <span>{pinSuccessMsg}</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 4-6 digits"
                    className="input text-center tracking-[1em] text-xl font-bold font-mono h-12"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPendingPinSetupWorkerId(null)}
                    className="flex-1 py-3 px-4 rounded-xl border border-border font-medium text-foreground hover:bg-accent"
                  >
                    Skip
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePin}
                    disabled={newPin.length < 4}
                    className="flex-1 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-brand-dark disabled:opacity-50"
                  >
                    Save PIN
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
