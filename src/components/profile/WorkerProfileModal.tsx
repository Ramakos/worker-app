import React, { useState } from 'react';
import {
  X,
  User,
  DollarSign,
  BarChart3,
  Heart,
  History,
  Settings,
  KeyRound,
  Volume2,
  VolumeX,
  RefreshCw,
  LogOut,
  Check,
  AlertCircle,
  Play,
  Copy,
} from 'lucide-react';
import { Worker } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useFloat } from '../../hooks/useFloat';
import { useToast } from '../Toast';
import { DashboardSummary } from '../DashboardSummary';
import { FloatManager } from '../FloatManager';
import { MySales } from '../MySales';
import { PersonalPerformance } from '../PersonalPerformance';
import { WorkerActivityTimeline } from '../WorkerActivityTimeline';
import { playOrderAlertChime } from '../../lib/audioAlert';

interface WorkerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: Worker;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onSignOut: () => void;
}

type ProfileSubTab = 'shift' | 'sales' | 'vibe' | 'activity' | 'settings';

export const WorkerProfileModal: React.FC<WorkerProfileModalProps> = ({
  isOpen,
  onClose,
  worker,
  soundEnabled,
  onToggleSound,
  onSignOut,
}) => {
  const [activeTab, setActiveTab] = useState<ProfileSubTab>('shift');
  const { setWorkerPin, fetchWorkers } = useAuth();
  const { currentShift, netFloat } = useFloat(worker.id);
  const { toast } = useToast();

  // Settings State: Quick PIN change & Profile Copy
  const [copiedId, setCopiedId] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');
  const [isSavingPin, setIsSavingPin] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleCopyId = (idToCopy: string) => {
    try {
      navigator.clipboard?.writeText(idToCopy);
      setCopiedId(true);
      toast.info('Copied to Clipboard', `Staff ID ${idToCopy} copied.`);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    setPinSuccess('');

    if (pinInput.length < 4 || pinInput.length > 6) {
      setPinError('PIN must be between 4 and 6 digits');
      return;
    }

    if (pinInput !== pinConfirm) {
      setPinError('PIN numbers do not match');
      return;
    }

    setIsSavingPin(true);
    try {
      const res = await setWorkerPin(worker.id, pinInput);
      if (res?.error) {
        setPinError(res.error);
        toast.error('PIN Update Failed', res.error);
      } else {
        setPinSuccess('PIN updated successfully!');
        toast.success('PIN Updated', 'Your new 4-digit quick sign-in PIN is now active.');
        setPinInput('');
        setPinConfirm('');
        setTimeout(() => setPinSuccess(''), 3000);
      }
    } catch {
      setPinError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSavingPin(false);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await fetchWorkers();
      toast.success('Roster Synchronized', 'Worker directory refreshed from server.');
    } catch {
      toast.error('Sync Error', 'Could not refresh staff list from server.');
    } finally {
      setIsSyncing(false);
    }
  };

  const getRoleBadgeColor = (role: Worker['role']) => {
    switch (role) {
      case 'admin':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'counter_worker':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'kitchen_staff':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      default:
        return 'bg-secondary text-secondary-foreground border-border';
    }
  };

  const subTabs = [
    { id: 'shift' as ProfileSubTab, label: 'Shift & Float', icon: DollarSign },
    { id: 'sales' as ProfileSubTab, label: 'My Sales', icon: BarChart3 },
    { id: 'vibe' as ProfileSubTab, label: 'Tips & Vibe', icon: Heart },
    { id: 'activity' as ProfileSubTab, label: 'Activity', icon: History },
    { id: 'settings' as ProfileSubTab, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 animate-in fade-in">
      <div
        className="bg-card w-full sm:max-w-3xl h-[92vh] sm:h-[88vh] rounded-t-3xl sm:rounded-3xl border border-border/80 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6"
        role="dialog"
        aria-modal="true"
      >
        {/* Profile Card Header */}
        <div className="bg-gradient-to-r from-secondary/50 via-card to-secondary/30 p-4 sm:p-6 border-b border-border/60 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-brand">
                  <User className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
                </div>
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-card rounded-full" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-base sm:text-lg text-foreground truncate">
                    {worker.full_name}
                  </h2>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide shrink-0 ${getRoleBadgeColor(
                      worker.role
                    )}`}
                  >
                    {worker.role.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 truncate">
                  <span className="font-mono text-[11px]">{worker.worker_id || 'ID: STAFF'}</span>
                  <span>·</span>
                  <span className="truncate">{worker.username}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs transition-all haptic flex items-center gap-1 shrink-0"
              aria-label="Close profile"
            >
              <X className="w-4 h-4 sm:hidden" />
              <span className="hidden sm:inline">Back to Floor</span>
            </button>
          </div>

          {/* Sub-Navigation Tabs */}
          <div className="mt-4 overflow-x-auto no-scrollbar touch-pan-x -mx-1 px-1">
            <div className="flex gap-1.5 p-1 bg-muted/70 rounded-2xl min-w-max sm:min-w-0">
              {subTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 py-2 px-3 sm:px-3.5 rounded-xl text-xs font-semibold transition-all haptic ${
                      isActive
                        ? 'bg-card text-primary shadow-xs font-bold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-primary' : ''}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 safe-bottom">
          {activeTab === 'shift' && (
            <div className="space-y-4 fade-in">
              <DashboardSummary workerId={worker.id} />
              <FloatManager workerId={worker.id} />
            </div>
          )}

          {activeTab === 'sales' && (
            <div className="fade-in">
              <MySales workerId={worker.id} />
            </div>
          )}

          {activeTab === 'vibe' && (
            <div className="fade-in">
              <PersonalPerformance />
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="fade-in">
              <WorkerActivityTimeline workerId={worker.id} />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4 fade-in max-w-xl mx-auto">
              {/* Staff Profile & Identity Card */}
              <div className="bg-gradient-to-br from-card via-card to-secondary/30 rounded-2xl p-4 sm:p-5 border border-border shadow-xs">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-brand">
                        <User className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-card rounded-full ring-2 ring-emerald-500/20" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base sm:text-lg text-foreground truncate">
                          {worker.full_name}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide shrink-0 ${getRoleBadgeColor(
                            worker.role
                          )}`}
                        >
                          {worker.role.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{worker.username}</p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active Staff
                    </span>
                  </div>
                </div>

                {/* Identity Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 bg-muted/40 rounded-xl border border-border/50 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-card/70 border border-border/40">
                    <span className="text-muted-foreground">Worker ID</span>
                    <div className="flex items-center gap-1.5 font-mono font-bold text-foreground">
                      <span>{worker.worker_id || `#STF-${worker.id.slice(0, 6).toUpperCase()}`}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyId(worker.worker_id || worker.id)}
                        className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                        title="Copy Worker ID"
                        aria-label="Copy Worker ID"
                      >
                        {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-card/70 border border-border/40">
                    <span className="text-muted-foreground">Auth Security</span>
                    <span className="font-semibold text-foreground capitalize">
                      {worker.has_pin ? 'PIN + Password' : 'Password Only'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-card/70 border border-border/40">
                    <span className="text-muted-foreground">Active Shift</span>
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      {currentShift ? (
                        <span className="text-emerald-600 font-bold">● Active on Floor</span>
                      ) : (
                        <span className="text-muted-foreground">○ Not Clocked In</span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-card/70 border border-border/40">
                    <span className="text-muted-foreground">Net Float</span>
                    <span className="font-bold text-foreground font-mono">
                      GH₵ {netFloat.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick PIN Card */}
              <div className="bg-card rounded-2xl shadow-sm p-4 sm:p-5 border border-border">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">
                      {worker.has_pin ? 'Update Quick Sign-In PIN' : 'Set Quick Sign-In PIN'}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      4-6 digits for fast touch numpad sign-in without password.
                    </p>
                  </div>
                </div>

                {pinSuccess && (
                  <div className="p-3 mb-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{pinSuccess}</span>
                  </div>
                )}

                {pinError && (
                  <div className="p-3 mb-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-xl text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{pinError}</span>
                  </div>
                )}

                <form onSubmit={handleSavePin} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                        New 4-6 Digit PIN
                      </label>
                      <input
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="one-time-code"
                        maxLength={6}
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••"
                        className="input h-10 w-full rounded-xl text-sm font-mono tracking-widest px-3"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                        Confirm PIN
                      </label>
                      <input
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="one-time-code"
                        maxLength={6}
                        value={pinConfirm}
                        onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••"
                        className="input h-10 w-full rounded-xl text-sm font-mono tracking-widest px-3"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isSavingPin || pinInput.length < 4 || pinConfirm.length < 4}
                      className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-brand-dark disabled:opacity-50 transition-all shadow-xs haptic"
                    >
                      {isSavingPin ? 'Saving...' : worker.has_pin ? 'Update PIN' : 'Save PIN'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Sound Alert Preferences */}
              <div className="bg-card rounded-2xl shadow-sm p-4 sm:p-5 border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-primary">
                      {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-muted-foreground" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground">Kitchen Order Chime</h3>
                      <p className="text-[11px] text-muted-foreground">
                        Audible alert chime when new Express Orders arrive.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => playOrderAlertChime()}
                      title="Test alert sound"
                      className="p-2 rounded-xl border border-border/80 hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-all flex items-center gap-1"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Test</span>
                    </button>
                    <button
                      type="button"
                      onClick={onToggleSound}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all haptic ${
                        soundEnabled
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {soundEnabled ? 'Enabled' : 'Muted'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Terminal Sync & Cache */}
              <div className="bg-card rounded-2xl shadow-sm p-4 sm:p-5 border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                      <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin text-primary' : ''}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground">Staff Roster Sync</h3>
                      <p className="text-[11px] text-muted-foreground">
                        Refresh worker profiles and roles from the central database.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="px-3 py-1.5 rounded-xl border border-border/80 hover:bg-muted text-xs font-semibold text-foreground transition-all disabled:opacity-50 haptic"
                  >
                    {isSyncing ? 'Syncing...' : 'Sync Now'}
                  </button>
                </div>
              </div>

              {/* Sign Out Card */}
              <div className="bg-card rounded-2xl shadow-sm p-4 sm:p-5 border border-destructive/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-destructive">End Session & Sign Out</h3>
                    <p className="text-[11px] text-muted-foreground">
                      Make sure to reconcile your float in Shift & Float before clocking out.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={onSignOut}
                    className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90 transition-all flex items-center gap-1.5 shadow-xs haptic"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
