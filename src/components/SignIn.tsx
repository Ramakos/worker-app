import { useState, useEffect } from 'react';
import { User, LogIn, Eye, EyeOff, AlertCircle, Zap, KeyRound, Check } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import ramakosLogoFull from '../assets/ramakos-logo-full.png';

const DEV_MODE = import.meta.env.DEV;

export const SignIn = () => {
  const [selectedWorker, setSelectedWorker] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [authMode, setAuthMode] = useState<'pin' | 'password'>('password');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [pendingPinSetupWorkerId, setPendingPinSetupWorkerId] = useState<string | null>(null);
  const [newPin, setNewPin] = useState('');
  const [pinSuccessMsg, setPinSuccessMsg] = useState('');

  const { signIn, signInWithPin, setWorkerPin, isLoading, devSignIn, workers } = useAuth();

  const selectedWorkerObj = workers.find(w => w.id === selectedWorker);

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

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorker) return;

    setError('');

    if (authMode === 'pin') {
      if (!pin) return;
      const result = await signInWithPin(selectedWorker, pin);
      if (result?.error) {
        setError(result.error);
      }
    } else {
      if (!password) return;
      const result = await signIn(selectedWorker, password);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success && !selectedWorkerObj?.has_pin) {
        // Prompt for PIN setup
        setPendingPinSetupWorkerId(selectedWorker);
      }
    }
  };

  const handleSavePin = async () => {
    if (!pendingPinSetupWorkerId || newPin.length < 4) return;
    const res = await setWorkerPin(pendingPinSetupWorkerId, newPin);
    if (res?.error) {
      setError(res.error);
    } else {
      setPinSuccessMsg('PIN linked successfully!');
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

          <form onSubmit={handleSignIn} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Select Your Name
              </label>
              {workers.length === 0 ? (
                <div className="bg-secondary border border-border rounded-xl p-6 text-center">
                  <AlertCircle className="w-12 h-12 text-primary mx-auto mb-3" />
                  <p className="text-secondary-foreground font-medium mb-1">No Workers Found</p>
                  <p className="text-sm text-muted-foreground">
                    Please contact your manager to create your worker account.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {workers.map(worker => (
                  <label
                    key={worker.id}
                    className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
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
                        <span className="font-medium text-foreground">{worker.full_name}</span>
                        {worker.has_pin && (
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                            PIN
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground capitalize">{worker.role}</div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedWorker === worker.id
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground/30'
                    }`}>
                      {selectedWorker === worker.id && (
                        <div className="w-2 h-2 bg-primary-foreground rounded-full m-0.5"></div>
                      )}
                    </div>
                  </label>
                  ))}
                </div>
              )}
            </div>

            {selectedWorkerObj && (
              <div>
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
                      maxLength={6}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      className="input text-center tracking-[1em] text-xl font-bold font-mono"
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
                      className="input pr-12"
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
                className="w-full bg-foreground text-background py-4 px-6 rounded-xl font-medium text-lg
                         hover:bg-foreground/90 transition-colors flex items-center justify-center space-x-2"
              >
                <Zap className="w-5 h-5" />
                <span>Dev Mode - Skip Login</span>
              </button>
            )}

            <button
              type="submit"
              disabled={!selectedWorker || (authMode === 'pin' ? !pin : !password) || isLoading}
              className="w-full bg-primary text-primary-foreground py-4 px-6 rounded-xl font-medium text-lg
                       hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors flex items-center justify-center space-x-2 shadow-brand"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-foreground border-t-transparent"></div>
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
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 4-6 digits"
                    className="input text-center tracking-[1em] text-xl font-bold font-mono"
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
