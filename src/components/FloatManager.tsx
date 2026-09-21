import { useState } from 'react';
import { DollarSign } from 'lucide-react';
import { useFloat } from '../hooks/useFloat';
import { useToast } from './Toast';
import { ActiveFloatCard } from './floatManager/ActiveFloatCard';
import { NoActiveFloatCard } from './floatManager/NoActiveFloatCard';
import { FloatTransactionsCard } from './floatManager/FloatTransactionsCard';
import { ShiftHistoryCard } from './floatManager/ShiftHistoryCard';

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
      {/* Current Float Status Card */}
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
          <ActiveFloatCard
            currentShift={currentShift}
            totalTaken={totalTaken}
            totalReturned={totalReturned}
            netFloat={netFloat}
            floatAmount={floatAmount}
            onFloatAmountChange={setFloatAmount}
            onTakeFloat={handleTakeFloat}
            returnAmount={returnAmount}
            onReturnAmountChange={setReturnAmount}
            onReturnFloat={handleReturnFloat}
            onEndShift={handleEndShift}
            isLoading={isLoading}
            error={error}
          />
        ) : (
          <NoActiveFloatCard
            floatAmount={floatAmount}
            onFloatAmountChange={setFloatAmount}
            onTakeFloat={handleTakeFloat}
            isLoading={isLoading}
            error={error}
          />
        )}
      </div>

      {/* Float Transaction History */}
      <FloatTransactionsCard transactions={floatTransactions} />

      {/* Shift History */}
      <ShiftHistoryCard shifts={shiftHistory} />
    </div>
  );
};
