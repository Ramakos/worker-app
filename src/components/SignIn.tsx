import { useState, useEffect } from 'react';
import {
  LogIn,
  Eye,
  EyeOff,
  AlertCircle,
  Zap,
  KeyRound,
  Check,
  RefreshCw,
  Delete,
  ChevronLeft,
  User,
  CreditCard,
  ChefHat,
  ShieldAlert,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from './Toast';
import { isNetworkOrTimeoutError, isOffline } from '../lib/authErrors';
import ramakosLogoFull from '../assets/ramakos-logo-full.png';

const DEV_MODE = import.meta.env.DEV;

const getRoleBadge = (role: string) => {
  switch (role) {
    case 'admin':
      return { label: 'Admin', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30', icon: ShieldAlert };
    case 'counter_worker':
      return { label: 'Counter', color: 'bg-sky-500/10 text-sky-600 border-sky-500/30', icon: CreditCard };
    case 'kitchen_staff':
      return { label: 'Kitchen', color: 'bg-amber-500/10 text-amber-600 border-amber-500/30', icon: ChefHat };
    default:
      return { label: 'Staff', color: 'bg-muted text-muted-foreground border-border', icon: User };
  }
};

const getInitials = (name: string) => {
  if (!name) return 'ST';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

export const SignIn = () => {
  const { signIn, signInWithPin, setWorkerPin, isLoading, devSignIn, workers, fetchWorkers } = useAuth();
  const [loginMode, setLoginMode] = useState<'list' | 'direct'>(() => (workers.length > 0 ? 'list' : 'direct'));
  const [directEmail, setDirectEmail] = useState('');
  const [selectedWorker, setSelectedWorker] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [authMode, setAuthMode] = useState<'pin' | 'password'>('pin');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [pendingPinSetupWorkerId, setPendingPinSetupWorkerId] = useState<string | null>(null);
  const [newPin, setNewPin] = useState('');
  const [pinSuccessMsg, setPinSuccessMsg] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      fetchWorkers();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const selectedWorkerObj = workers.find((w) => w.id === selectedWorker);

  // Default to list mode once workers are cached
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
      const timer = setTimeout(() => setError(''), 6000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleManualSync = async () => {
    if (isOffline()) {
      toast.warning('Offline', 'Cannot sync staff roster while offline. Check internet connection.');
      return;
    }
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

  const handleAutoSubmitPin = async (pinValue: string) => {
    if (!selectedWorker) return;
    setError('');
    const result = await signInWithPin(selectedWorker, pinValue);
    if (result?.error) {
      setError(result.error);
      toast.error('Sign-in Failed', result.error);
      setPin('');
    } else {
      toast.success('Welcome Back!', `Signed in as ${selectedWorkerObj?.full_name || 'Staff'}`);
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
        toast.success('Welcome Back!', 'Signed in successfully. Worker roster synchronized.');
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
        toast.warning('Enter PIN', 'Please enter your staff PIN.');
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
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/25 to-accent/15 flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-md">
        {/* Main Card Container */}
        <div className="bg-card rounded-3xl shadow-xl p-5 sm:p-7 border border-border/70 backdrop-blur-sm">
          {/* Header */}
          <div className="text-center mb-5">
            <img
              src={ramakosLogoFull}
              alt="Ramakos Catering Service"
              className="h-14 sm:h-16 w-auto mx-auto mb-2 object-contain"
            />
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Worker Portal</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Start your shift & live service dispatch</p>
          </div>

          {/* Offline / Poor Internet Alert Banner */}
          {!isOnline && (
            <div className="mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center gap-2.5 text-xs">
              <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
              <div className="flex-1 min-w-0">
                <span className="font-semibold block">Device Offline</span>
                <span>Check Wi-Fi or mobile data. Server requests are paused.</span>
              </div>
            </div>
          )}

          {/* Mode Switcher Pills */}
          <div className="flex p-1 bg-muted rounded-2xl mb-5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setLoginMode('list');
                setError('');
              }}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                loginMode === 'list' && workers.length > 0
                  ? 'bg-card text-primary shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Staff Roster</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMode('direct');
                setError('');
              }}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                loginMode === 'direct' || workers.length === 0
                  ? 'bg-card text-primary shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Email Sign-in</span>
            </button>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            {/* DIRECT EMAIL / USERNAME LOGIN */}
            {loginMode === 'direct' || workers.length === 0 ? (
              <div className="space-y-3.5">
                {workers.length === 0 && (
                  <div className="bg-primary/5 border border-primary/20 rounded-2xl p-3.5 text-xs text-muted-foreground flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground block mb-0.5">Terminal Initial Setup</span>
                      Enter your account username or email (e.g. <span className="text-primary font-mono font-medium">counter</span> or <span className="text-primary font-mono font-medium">counter@ramakos.com</span>) to sign in and activate this device.
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">
                    Account Email or Username
                  </label>
                  <input
                    type="text"
                    value={directEmail}
                    onChange={(e) => setDirectEmail(e.target.value)}
                    className="input h-12 w-full text-sm rounded-xl px-3.5"
                    placeholder="e.g. counter or counter@ramakos.com"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input h-12 pr-12 w-full text-sm rounded-xl px-3.5"
                      placeholder="Enter account password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Syncing...' : 'Sync Staff Roster'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* WORKER SELECTION ROSTER WITH ON-SCREEN PIN NUMPAD */
              <div className="space-y-4">
                {/* Selected Worker Header Banner */}
                {selectedWorkerObj && (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-secondary/70 border border-border/80">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {getInitials(selectedWorkerObj.full_name)}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-sm text-foreground block truncate leading-tight">
                          {selectedWorkerObj.full_name}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {(() => {
                            const badge = getRoleBadge(selectedWorkerObj.role);
                            return (
                              <span className={`text-[10px] px-1.5 py-0.2 rounded border font-semibold ${badge.color}`}>
                                {badge.label}
                              </span>
                            );
                          })()}
                          <span className="text-[10px] text-muted-foreground truncate">
                            {selectedWorkerObj.username}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWorker('');
                        setPin('');
                        setPassword('');
                      }}
                      className="text-xs text-primary hover:underline font-semibold shrink-0 ml-2"
                    >
                      Switch
                    </button>
                  </div>
                )}

                {/* Worker selection cards when no worker selected */}
                {!selectedWorker && (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {workers.map((worker) => {
                      const badge = getRoleBadge(worker.role);
                      const isChosen = selectedWorker === worker.id;
                      return (
                        <button
                          key={worker.id}
                          type="button"
                          onClick={() => setSelectedWorker(worker.id)}
                          className={`w-full flex items-center p-3 rounded-2xl border-2 transition-all text-left ${
                            isChosen
                              ? 'border-primary bg-primary/5 shadow-xs'
                              : 'border-border/80 hover:border-primary/40 hover:bg-secondary/40'
                          }`}
                        >
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mr-3">
                            {getInitials(worker.full_name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-sm text-foreground block truncate">
                              {worker.full_name}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-[10px] px-1.5 py-0.2 rounded border font-medium ${badge.color}`}>
                                {badge.label}
                              </span>
                              {worker.has_pin && (
                                <span className="text-[10px] text-primary font-bold">
                                  ⚡ PIN
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronLeft className="w-4 h-4 text-muted-foreground rotate-180" />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Authentication Input for Selected Worker */}
                {selectedWorkerObj && (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {authMode === 'pin' ? 'Enter Staff PIN' : 'Enter Password'}
                      </span>
                      {selectedWorkerObj.has_pin && (
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode(authMode === 'pin' ? 'password' : 'pin');
                            setPin('');
                            setPassword('');
                            setError('');
                          }}
                          className="text-xs text-primary hover:underline font-semibold"
                        >
                          {authMode === 'pin' ? 'Use Password' : 'Use PIN'}
                        </button>
                      )}
                    </div>

                    {authMode === 'pin' ? (
                      <div>
                        {/* Visual PIN Dots Indicator */}
                        <div className="flex justify-center items-center gap-3.5 my-2 py-1">
                          {[0, 1, 2, 3].map((idx) => (
                            <div
                              key={idx}
                              className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                                pin.length > idx
                                  ? 'bg-primary border-primary scale-110 shadow-sm'
                                  : 'border-muted-foreground/30 bg-card'
                              }`}
                            />
                          ))}
                        </div>

                        {/* Fast On-Screen Touch Numpad (Mobile Ergonomics) */}
                        <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto pt-1">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => {
                                if (pin.length < 6) {
                                  const next = pin + num;
                                  setPin(next);
                                  if (next.length === 4) {
                                    handleAutoSubmitPin(next);
                                  }
                                }
                              }}
                              className="h-13 sm:h-14 rounded-2xl bg-secondary hover:bg-secondary/80 active:scale-95 text-lg sm:text-xl font-bold text-foreground border border-border/60 transition-all flex items-center justify-center shadow-xs"
                            >
                              {num}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setPin('')}
                            className="h-13 sm:h-14 rounded-2xl bg-muted/70 hover:bg-muted text-xs font-bold text-muted-foreground active:scale-95 transition-all flex items-center justify-center"
                          >
                            CLEAR
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (pin.length < 6) {
                                const next = pin + '0';
                                setPin(next);
                                if (next.length === 4) {
                                  handleAutoSubmitPin(next);
                                }
                              }
                            }}
                            className="h-13 sm:h-14 rounded-2xl bg-secondary hover:bg-secondary/80 active:scale-95 text-lg sm:text-xl font-bold text-foreground border border-border/60 transition-all flex items-center justify-center shadow-xs"
                          >
                            0
                          </button>
                          <button
                            type="button"
                            onClick={() => setPin((p) => p.slice(0, -1))}
                            className="h-13 sm:h-14 rounded-2xl bg-muted/70 hover:bg-muted text-muted-foreground active:scale-95 transition-all flex items-center justify-center"
                          >
                            <Delete className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="input h-12 pr-12 w-full text-sm rounded-xl px-3.5"
                          placeholder="Enter account password"
                          required
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
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
              <div
                className={`rounded-2xl p-3.5 flex items-start space-x-2.5 border ${
                  isNetworkOrTimeoutError(error)
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                    : "bg-destructive/10 border-destructive/30 text-destructive"
                }`}
              >
                {isNetworkOrTimeoutError(error) ? (
                  <WifiOff className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <div className="text-xs font-medium leading-relaxed flex-1">{error}</div>
              </div>
            )}

            {DEV_MODE && (
              <button
                type="button"
                onClick={devSignIn}
                className="w-full bg-foreground text-background py-3 px-4 rounded-2xl font-medium text-xs
                         hover:bg-foreground/90 transition-colors flex items-center justify-center space-x-2"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Dev Mode - Skip Login</span>
              </button>
            )}

            {/* Submit Button (Shown in Direct Mode or when using password in List Mode) */}
            {(loginMode === 'direct' || workers.length === 0 || authMode === 'password') && (
              <button
                type="submit"
                disabled={
                  isLoading ||
                  (loginMode === 'direct' || workers.length === 0
                    ? !directEmail.trim() || !password
                    : !selectedWorker || !password)
                }
                className="w-full bg-primary text-primary-foreground py-3.5 px-6 rounded-2xl font-semibold text-sm sm:text-base
                         hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors flex items-center justify-center space-x-2 shadow-brand"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-foreground border-t-transparent"></div>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Start Shift</span>
                  </>
                )}
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Post-Login PIN Setup Prompt */}
      {pendingPinSetupWorkerId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl p-6 w-full max-w-sm border border-border shadow-2xl animate-in zoom-in-95">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-primary/10 text-primary mx-auto rounded-full flex items-center justify-center mb-2">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-foreground">Set Quick PIN</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Link a 4-6 digit PIN so you can clock in and claim orders instantly without your password.
              </p>
            </div>

            {pinSuccessMsg ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 rounded-2xl p-4 text-center font-medium flex items-center justify-center gap-2 text-sm">
                <Check className="w-4 h-4" />
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
                    className="input text-center tracking-[1em] text-xl font-bold font-mono h-12 rounded-xl"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPendingPinSetupWorkerId(null)}
                    className="flex-1 py-3 px-4 rounded-xl border border-border font-medium text-foreground hover:bg-accent text-xs"
                  >
                    Skip
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePin}
                    disabled={newPin.length < 4}
                    className="flex-1 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-brand-dark disabled:opacity-50 text-xs"
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

