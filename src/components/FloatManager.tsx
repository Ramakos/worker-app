import { useState } from 'react';
import { DollarSign, ArrowUpCircle, ArrowDownCircle, Clock, History, TrendingUp, TrendingDown } from 'lucide-react';
import { useFloat } from '../hooks/useFloat';
import { useToast } from './Toast';

interface FloatManagerProps {
  workerId?: string;
}

export const FloatManager = ({ workerId }: FloatManagerProps) => {
  const [floatAmount, setFloatAmount] = useState('');
  const [returnAmount, setReturnAmount] = useState('');
  const [error, setError] = useState('');
  const { toast } = useToast();
  const {
    currentShift,
    floatTransactions,
    shiftHistory,
    isLoading,
    totalTaken,
    totalReturned,
    netFloat,
    takeFloat,
    returnFloat,
    endShift,
  } = useFloat(workerId);

  const handleTakeFloat = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const amount = parseFloat(floatAmount);

    if (isNaN(amount) || amount <= 0) {
      const msg = 'Amount must be greater than zero';
      setError(msg);
      toast.warning('Invalid Amount', msg);
      return;
    }

    const result = await takeFloat(amount);
    if (result.success) {
      setFloatAmount('');
      toast.success('Float Taken', `GH₵ ${amount.toFixed(2)} recorded for your active shift.`);
    } else {
      const msg = result.error || 'Failed to take float';
      setError(msg);
      toast.error('Float Failed', msg);
    }
  };

  const handleReturnFloat = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const amount = parseFloat(returnAmount);

    if (isNaN(amount) || amount <= 0) {
      const msg = 'Amount must be greater than zero';
      setError(msg);
      toast.warning('Invalid Amount', msg);
      return;
    }

    const result = await returnFloat(amount);
    if (result.success) {
      setReturnAmount('');
      toast.success('Float Returned', `GH₵ ${amount.toFixed(2)} recorded.`);
    } else {
      const msg = result.error || 'Failed to return float';
      setError(msg);
      toast.error('Return Failed', msg);
    }
  };

  const handleEndShift = async () => {
    setError('');
    const result = await endShift();
    if (result.success) {
      toast.success('Shift Ended', 'Your shift reconciliation has been closed.');
    } else {
      const msg = result.error || 'Failed to end shift';
      setError(msg);
      toast.error('End Shift Failed', msg);
    }
  };

  const hasActiveFloat = currentShift && totalTaken > 0;

  return (
    <div className="space-y-4">
      {/* Current Float Status */}
      <div className="bg-card rounded-2xl shadow-sm p-4 sm:p-6 border border-border">
        <div className="flex items-center space-x-2.5 sm:space-x-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-foreground">Float Status</h2>
            <p className="text-[11px] text-muted-foreground">Shift change & register float balance</p>
          </div>
        </div>

        {hasActiveFloat ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
              <div className="bg-secondary border border-border rounded-xl p-3.5 sm:p-4">
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <p className="text-xs text-secondary-foreground font-medium">Total Taken</p>
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-secondary-foreground">
                  GH₵ {totalTaken.toFixed(2)}
                </p>
              </div>

              <div className="bg-accent border border-border rounded-xl p-3.5 sm:p-4">
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <p className="text-xs text-accent-foreground font-medium">Total Returned</p>
                  <TrendingDown className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-accent-foreground">
                  GH₵ {totalReturned.toFixed(2)}
                </p>
              </div>

              <div className={`border-2 rounded-xl p-3.5 sm:p-4 ${
                netFloat > 0
                  ? 'bg-secondary border-primary/30'
                  : 'bg-muted border-border'
              }`}>
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <p className={`text-xs font-medium ${
                    netFloat > 0 ? 'text-secondary-foreground' : 'text-muted-foreground'
                  }`}>Net Float</p>
                  <DollarSign className={`w-4 h-4 ${
                    netFloat > 0 ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                </div>
                <p className={`text-xl sm:text-2xl font-bold ${
                  netFloat > 0 ? 'text-secondary-foreground' : 'text-foreground'
                }`}>
                  GH₵ {netFloat.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="bg-muted/60 rounded-xl p-3 text-xs text-muted-foreground">
              Shift started at {new Date(currentShift.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>

            {/* Take Another Float */}
            <form onSubmit={handleTakeFloat} className="space-y-2">
              <label className="block text-xs font-semibold text-foreground">
                Take Additional Float
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={floatAmount}
                  onChange={(e) => setFloatAmount(e.target.value)}
                  placeholder="Enter amount (GH₵)"
                  step="0.01"
                  min="0"
                  className="input flex-1 h-10 text-sm"
                />
                <button
                  type="submit"
                  disabled={!floatAmount || isLoading}
                  className="btn btn-primary px-4 py-2 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed shrink-0 haptic"
                >
                  <ArrowUpCircle className="w-4 h-4 mr-1" />
                  <span>Take</span>
                </button>
              </div>
            </form>

            {/* Return Float */}
            <form onSubmit={handleReturnFloat} className="space-y-2">
              <label className="block text-xs font-semibold text-foreground">
                Return Float
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={returnAmount}
                  onChange={(e) => setReturnAmount(e.target.value)}
                  placeholder="Enter return amount (GH₵)"
                  step="0.01"
                  min="0"
                  className="input flex-1 h-10 text-sm"
                />
                <button
                  type="submit"
                  disabled={!returnAmount || isLoading}
                  className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-semibold
                           disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center shrink-0 haptic"
                >
                  <ArrowDownCircle className="w-4 h-4 mr-1" />
                  <span>Return</span>
                </button>
              </div>
            </form>

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 text-destructive text-xs">
                {error}
              </div>
            )}

            {/* End Shift Button */}
            <button
              onClick={handleEndShift}
              disabled={isLoading || netFloat > 0}
              className="w-full bg-destructive text-destructive-foreground py-2.5 px-4 rounded-xl text-xs font-semibold
                       hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors haptic"
            >
              {netFloat > 0
                ? `Return all floats before ending shift (GH₵ ${netFloat.toFixed(2)} remaining)`
                : 'End Shift'
              }
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-secondary border border-primary/20 rounded-xl p-4 text-center">
              <Clock className="w-12 h-12 text-primary mx-auto mb-2" />
              <p className="text-secondary-foreground font-medium">No Active Float</p>
              <p className="text-sm text-muted-foreground">Take a float to start handling cash transactions</p>
            </div>

            <form onSubmit={handleTakeFloat} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Float Amount
                </label>
                <input
                  type="number"
                  value={floatAmount}
                  onChange={(e) => setFloatAmount(e.target.value)}
                  placeholder="Enter amount (e.g., 100.00)"
                  step="0.01"
                  min="0"
                  className="input"
                  required
                />
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!floatAmount || isLoading}
                className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-xl font-medium
                         hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors flex items-center justify-center space-x-2 shadow-brand"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-foreground border-t-transparent"></div>
                ) : (
                  <>
                    <ArrowUpCircle className="w-5 h-5" />
                    <span>Take Float</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Float Transaction History */}
      {floatTransactions.length > 0 && (
        <div className="bg-card rounded-2xl shadow-sm p-4 sm:p-5 border border-border">
          <div className="flex items-center space-x-2.5 mb-3">
            <History className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Float Transactions</h3>
          </div>
          <div className="space-y-2">
            {floatTransactions.map(transaction => (
              <div
                key={transaction.id}
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  transaction.transaction_type === 'take'
                    ? 'bg-secondary/60 border-border/80'
                    : 'bg-accent/60 border-border/80'
                }`}
              >
                <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                  {transaction.transaction_type === 'take' ? (
                    <TrendingUp className="w-4 h-4 text-primary shrink-0" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className={`font-semibold text-xs truncate ${
                      transaction.transaction_type === 'take'
                        ? 'text-secondary-foreground'
                        : 'text-accent-foreground'
                    }`}>
                      {transaction.transaction_type === 'take' ? 'Took' : 'Returned'} Float
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(transaction.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <p className={`text-sm sm:text-base font-bold text-right ml-3 shrink-0 ${
                  transaction.transaction_type === 'take'
                    ? 'text-secondary-foreground'
                    : 'text-accent-foreground'
                }`}>
                  GH₵ {Number(transaction.amount).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shift History */}
      {shiftHistory.length > 0 && (
        <div className="bg-card rounded-2xl shadow-sm p-4 sm:p-5 border border-border">
          <h3 className="text-sm font-bold text-foreground mb-3">Recent Shifts</h3>
          <div className="space-y-2">
            {shiftHistory.slice(0, 5).map(shift => (
              <div key={shift.id} className="flex items-start justify-between p-3 bg-muted/40 rounded-xl border border-border/50">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs text-foreground">
                    Taken: GH₵ {shift.amount_taken_float?.toFixed(2) || '0.00'}
                    {shift.amount_returned_float !== null && (
                      <span className="text-muted-foreground font-normal"> → Ret: GH₵ {shift.amount_returned_float.toFixed(2)}</span>
                    )}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {new Date(shift.started_at).toLocaleDateString()} {new Date(shift.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {shift.ended_at && (
                      <span> - {new Date(shift.ended_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                  </p>
                </div>
                <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ml-2 whitespace-nowrap shrink-0 ${
                  shift.ended_at
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {shift.ended_at ? 'Closed' : 'Active'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
