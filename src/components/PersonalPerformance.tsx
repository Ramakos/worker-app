import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Gift, Clock, RotateCcw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { recordWorkerActivity } from '../lib/workerActivity';
import { DateRangeFilter } from './common/DateRangeFilter';
import { DateFilterState, matchesDateFilter } from '../lib/dateFilter';

interface TipEntry {
  id: string;
  amount: number;
  timestamp: number;
}

interface SessionStats {
  sessionStart: number;
  totalTips: number;
  tipEntries: TipEntry[];
  lastTableCheckTime: number;
  totalTablesServed: number;
}

export const PersonalPerformance = () => {
  const { currentWorker } = useAuth();
  const [dateFilter, setDateFilter] = useState<DateFilterState>({ preset: 'today' });
  const [stats, setStats] = useState<SessionStats>(() => {
    const saved = localStorage.getItem('personalStats');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      sessionStart: Date.now(),
      totalTips: 0,
      tipEntries: [],
      lastTableCheckTime: Date.now(),
      totalTablesServed: 0,
    };
  });
  const [tipInput, setTipInput] = useState('');
  const [showTipHistory, setShowTipHistory] = useState(false);

  useEffect(() => {
    localStorage.setItem('personalStats', JSON.stringify(stats));
  }, [stats]);

  const filteredTips = useMemo(() => {
    return stats.tipEntries.filter(t => matchesDateFilter(t.timestamp, dateFilter));
  }, [stats.tipEntries, dateFilter]);

  const periodTotalTips = useMemo(() => {
    return filteredTips.reduce((acc, t) => acc + t.amount, 0);
  }, [filteredTips]);

  const handleAddTip = () => {
    if (!tipInput || isNaN(parseFloat(tipInput))) return;

    const amount = parseFloat(tipInput);
    if (amount <= 0) return;
    const newEntry: TipEntry = {
      id: Date.now().toString(),
      amount,
      timestamp: Date.now(),
    };

    setStats(prev => ({
      ...prev,
      totalTips: prev.totalTips + amount,
      tipEntries: [...prev.tipEntries, newEntry],
    }));

    if (currentWorker) {
      recordWorkerActivity(currentWorker.id, {
        type: 'tip_logged',
        title: `Logged Tip: GH₵ ${amount.toFixed(2)}`,
        amount,
      });
    }

    setTipInput('');
  };

  const handleRemoveTip = (id: string) => {
    setStats(prev => {
      const entry = prev.tipEntries.find(e => e.id === id);
      return {
        ...prev,
        totalTips: prev.totalTips - (entry?.amount || 0),
        tipEntries: prev.tipEntries.filter(e => e.id !== id),
      };
    });
  };

  const handleResetSession = () => {
    if (window.confirm('Reset your personal stats for this session?')) {
      const newStats: SessionStats = {
        sessionStart: Date.now(),
        totalTips: 0,
        tipEntries: [],
        lastTableCheckTime: Date.now(),
        totalTablesServed: 0,
      };
      setStats(newStats);
    }
  };

  const sessionDuration = Math.floor((Date.now() - stats.sessionStart) / 60000);
  const hours = Math.floor(sessionDuration / 60);
  const minutes = sessionDuration % 60;

  const timeSinceLastCheck = Math.floor((Date.now() - stats.lastTableCheckTime) / 60000);

  const sessionDurationStr = hours > 0
    ? `${hours}h ${minutes}m`
    : `${minutes}m`;

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground">Shift Vibe & Personal Performance</h2>
        </div>
        <DateRangeFilter
          value={dateFilter}
          onChange={setDateFilter}
          defaultPreset="today"
        />
      </div>

      {/* Tips Tracker */}
      <div className="bg-card rounded-2xl shadow-sm p-4 sm:p-5 border border-border">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tips Tracker</p>
            <p className="text-xl sm:text-2xl font-bold text-foreground">GH₵ {periodTotalTips.toFixed(2)}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          {filteredTips.length} tip{filteredTips.length !== 1 ? 's' : ''} logged in selected period
        </p>

        {/* Add Tip */}
        <div className="flex gap-2">
          <input
            type="number"
            value={tipInput}
            onChange={(e) => setTipInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTip()}
            placeholder="Tip amount"
            step="0.01"
            min="0"
            className="input flex-1 text-sm"
          />
          <button
            onClick={handleAddTip}
            disabled={!tipInput || isNaN(parseFloat(tipInput)) || parseFloat(tipInput) <= 0}
            className="btn btn-primary px-4 py-2 text-sm disabled:opacity-50"
          >
            Add
          </button>
        </div>

        {/* Tip History Toggle */}
        {stats.tipEntries.length > 0 && (
          <button
            onClick={() => setShowTipHistory(!showTipHistory)}
            className="mt-3 text-sm text-secondary-foreground hover:text-primary font-medium"
          >
            {showTipHistory ? 'Hide' : 'Show'} history ({stats.tipEntries.length})
          </button>
        )}

        {/* Tip History */}
        {showTipHistory && filteredTips.length > 0 && (
          <div className="mt-3 space-y-2 bg-muted rounded-lg border border-border p-3">
            {[...filteredTips].reverse().map(entry => (
              <div
                key={entry.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-foreground">
                  GH₵ {entry.amount.toFixed(2)} at {new Date(entry.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <button
                  onClick={() => handleRemoveTip(entry.id)}
                  className="text-destructive hover:text-destructive/80 text-xs font-medium"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Session Duration */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
            <Clock className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Session Duration</p>
            <p className="text-2xl font-bold text-foreground">{sessionDurationStr}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Started: {new Date(stats.sessionStart).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>

      {/* Performance Summary */}
      <div className="card p-6">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Today's Vibe</h3>
        </div>

        <div className="space-y-3">
          {/* Tips Performance */}
          <div className="p-3 bg-muted rounded-lg border border-border">
            <p className="text-xs font-medium text-muted-foreground mb-1">Period Tips</p>
            <p className="text-lg font-bold text-foreground">GH₵ {periodTotalTips.toFixed(2)}</p>
            {sessionDuration > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                ~GH₵ {(periodTotalTips / (sessionDuration / 60)).toFixed(2)}/hour
              </p>
            )}
          </div>

          {/* Session Info */}
          <div className="p-3 bg-muted rounded-lg border border-border">
            <p className="text-xs font-medium text-muted-foreground mb-1">Working Since</p>
            <p className="text-lg font-bold text-foreground">{sessionDurationStr}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Last table check: {timeSinceLastCheck}m ago
            </p>
          </div>

          {/* Quick Stats */}
          <div className="p-3 bg-muted rounded-lg border border-border">
            <p className="text-xs font-medium text-muted-foreground mb-2">Quick Stats</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Tip Entries</p>
                <p className="font-bold text-foreground">{filteredTips.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Avg Tip</p>
                <p className="font-bold text-foreground">
                  GH₵ {(filteredTips.length > 0 ? periodTotalTips / filteredTips.length : 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Session */}
      <button
        onClick={handleResetSession}
        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-muted border border-border text-muted-foreground rounded-lg hover:bg-muted/70 transition-colors font-medium"
      >
        <RotateCcw className="w-4 h-4" />
        <span>Reset Session Stats</span>
      </button>

      {/* Privacy Notice */}
      <div className="text-xs text-muted-foreground text-center p-3 bg-muted rounded-lg border border-border">
        <p>Your personal stats are stored locally on your device only. They are never sent to the server.</p>
      </div>
    </div>
  );
};
