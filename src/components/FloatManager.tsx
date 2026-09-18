import { useState } from 'react';
import { DollarSign, ArrowUpCircle, ArrowDownCircle, Clock, History, TrendingUp, TrendingDown } from 'lucide-react';
import { useFloat } from '../hooks/useFloat';

interface FloatManagerProps {
  workerId?: string;
}

export const FloatManager = ({ workerId }: FloatManagerProps) => {
  const [floatAmount, setFloatAmount] = useState('');
  const [returnAmount, setReturnAmount] = useState('');
  const [error, setError] = useState('');
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

    if (amount <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    const result = await takeFloat(amount);
    if (result.success) {
      setFloatAmount('');
    } else {
      setError(result.error || 'Failed to take float');
    }
  };

  const handleReturnFloat = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const amount = parseFloat(returnAmount);

    if (amount <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    const result = await returnFloat(amount);
    if (result.success) {
      setReturnAmount('');
    } else {
      setError(result.error || 'Failed to return float');
    }
  };

  const handleEndShift = async () => {
    setError('');
    const result = await endShift();
    if (!result.success) {
      setError(result.error || 'Failed to end shift');
    }
  };

  const hasActiveFloat = currentShift && totalTaken > 0;

  return (
    <div className="space-y-6">
      {/* Current Float Status */}
      <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
        <div className="flex items-center space-x-3 mb-4">
          <DollarSign className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Float Status</h2>
        </div>

        {hasActiveFloat ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-secondary border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-secondary-foreground font-medium">Total Taken</p>
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <p className="text-2xl font-bold text-secondary-foreground">
                  ${totalTaken.toFixed(2)}
                </p>
              </div>

              <div className="bg-accent border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-accent-foreground font-medium">Total Returned</p>
                  <TrendingDown className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold text-accent-foreground">
                  ${totalReturned.toFixed(2)}
                </p>
              </div>

              <div className={`border-2 rounded-xl p-4 ${
                netFloat > 0
                  ? 'bg-secondary border-primary/30'
                  : 'bg-muted border-border'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <p className={`text-sm font-medium ${
                    netFloat > 0 ? 'text-secondary-foreground' : 'text-muted-foreground'
                  }`}>Net Float</p>
                  <DollarSign className={`w-5 h-5 ${
                    netFloat > 0 ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                </div>
                <p className={`text-2xl font-bold ${
                  netFloat > 0 ? 'text-secondary-foreground' : 'text-foreground'
                }`}>
                  ${netFloat.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="bg-muted rounded-xl p-4">
              <p className="text-sm text-muted-foreground">
                Shift started at {new Date(currentShift.started_at).toLocaleTimeString()}
              </p>
            </div>

            {/* Take Another Float */}
            <form onSubmit={handleTakeFloat} className="space-y-3">
              <label className="block text-sm font-medium text-foreground">
                Take Additional Float
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={floatAmount}
                  onChange={(e) => setFloatAmount(e.target.value)}
                  placeholder="Enter amount"
                  step="0.01"
                  min="0"
                  className="input flex-1"
                />
                <button
                  type="submit"
                  disabled={!floatAmount || isLoading}
                  className="btn btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowUpCircle className="w-5 h-5" />
                  <span>Take</span>
                </button>
              </div>
            </form>

            {/* Return Float */}
            <form onSubmit={handleReturnFloat} className="space-y-3">
              <label className="block text-sm font-medium text-foreground">
                Return Float
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={returnAmount}
                  onChange={(e) => setReturnAmount(e.target.value)}
                  placeholder="Enter return amount"
                  step="0.01"
                  min="0"
                  className="input flex-1"
                />
                <button
                  type="submit"
                  disabled={!returnAmount || isLoading}
                  className="px-6 py-3 bg-muted text-foreground rounded-xl font-medium
                           hover:bg-muted/70 disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors flex items-center space-x-2"
                >
                  <ArrowDownCircle className="w-5 h-5" />
                  <span>Return</span>
                </button>
              </div>
            </form>

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive text-sm">
                {error}
              </div>
            )}

            {/* End Shift Button */}
            <button
              onClick={handleEndShift}
              disabled={isLoading || netFloat > 0}
              className="w-full bg-destructive text-destructive-foreground py-3 px-4 rounded-xl font-medium
                       hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
            >
              {netFloat > 0
                ? `Return all floats before ending shift (${netFloat.toFixed(2)} remaining)`
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
        <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
          <div className="flex items-center space-x-3 mb-4">
            <History className="w-6 h-6 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Float Transactions</h3>
          </div>
          <div className="space-y-2">
            {floatTransactions.map(transaction => (
              <div
                key={transaction.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  transaction.transaction_type === 'take'
                    ? 'bg-secondary border border-border'
                    : 'bg-accent border border-border'
                }`}
              >
                <div className="flex items-center space-x-3 flex-1">
                  {transaction.transaction_type === 'take' ? (
                    <TrendingUp className="w-5 h-5 text-primary" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className={`font-medium ${
                      transaction.transaction_type === 'take'
                        ? 'text-secondary-foreground'
                        : 'text-accent-foreground'
                    }`}>
                      {transaction.transaction_type === 'take' ? 'Took' : 'Returned'} Float
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <p className={`text-lg font-bold text-right ml-4 ${
                  transaction.transaction_type === 'take'
                    ? 'text-secondary-foreground'
                    : 'text-accent-foreground'
                }`}>
                  ${Number(transaction.amount).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shift History */}
      {shiftHistory.length > 0 && (
        <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Recent Shifts</h3>
          <div className="space-y-3">
            {shiftHistory.slice(0, 5).map(shift => (
              <div key={shift.id} className="flex items-start justify-between p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    Taken: ${shift.amount_taken_float?.toFixed(2) || '0.00'}
                    {shift.amount_returned_float !== null && (
                      <span className="text-muted-foreground"> → Returned: ${shift.amount_returned_float.toFixed(2)}</span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(shift.started_at).toLocaleDateString()} {new Date(shift.started_at).toLocaleTimeString()}
                    {shift.ended_at && (
                      <span> - {new Date(shift.ended_at).toLocaleTimeString()}</span>
                    )}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ml-4 whitespace-nowrap ${
                  shift.ended_at
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}>
                  {shift.ended_at ? 'Completed' : 'Active'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
