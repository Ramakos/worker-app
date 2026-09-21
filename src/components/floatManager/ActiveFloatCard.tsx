import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface ActiveFloatCardProps {
  currentShift: any;
  totalTaken: number;
  totalReturned: number;
  netFloat: number;
  floatAmount: string;
  onFloatAmountChange: (val: string) => void;
  onTakeFloat: (e: React.FormEvent) => void;
  returnAmount: string;
  onReturnAmountChange: (val: string) => void;
  onReturnFloat: (e: React.FormEvent) => void;
  onEndShift: () => void;
  isLoading: boolean;
  error: string;
}

export const ActiveFloatCard: React.FC<ActiveFloatCardProps> = ({
  currentShift,
  totalTaken,
  totalReturned,
  netFloat,
  floatAmount,
  onFloatAmountChange,
  onTakeFloat,
  returnAmount,
  onReturnAmountChange,
  onReturnFloat,
  onEndShift,
  isLoading,
  error,
}) => {
  return (
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

        <div
          className={`border-2 rounded-xl p-3.5 sm:p-4 ${
            netFloat > 0 ? 'bg-secondary border-primary/30' : 'bg-muted border-border'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <p
              className={`text-xs font-medium ${
                netFloat > 0 ? 'text-secondary-foreground' : 'text-muted-foreground'
              }`}
            >
              Net Float
            </p>
            <DollarSign
              className={`w-4 h-4 ${netFloat > 0 ? 'text-primary' : 'text-muted-foreground'}`}
            />
          </div>
          <p
            className={`text-xl sm:text-2xl font-bold ${
              netFloat > 0 ? 'text-secondary-foreground' : 'text-foreground'
            }`}
          >
            GH₵ {netFloat.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="bg-muted/60 rounded-xl p-3 text-xs text-muted-foreground">
        Shift started at{' '}
        {new Date(currentShift.started_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>

      {/* Take Another Float */}
      <form onSubmit={onTakeFloat} className="space-y-2">
        <label className="block text-xs font-semibold text-foreground">Take Additional Float</label>
        <div className="flex space-x-2">
          <input
            type="number"
            value={floatAmount}
            onChange={e => onFloatAmountChange(e.target.value)}
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
      <form onSubmit={onReturnFloat} className="space-y-2">
        <label className="block text-xs font-semibold text-foreground">Return Float</label>
        <div className="flex space-x-2">
          <input
            type="number"
            value={returnAmount}
            onChange={e => onReturnAmountChange(e.target.value)}
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
        onClick={onEndShift}
        disabled={isLoading || netFloat > 0}
        className="w-full bg-destructive text-destructive-foreground py-2.5 px-4 rounded-xl text-xs font-semibold
                 hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed
                 transition-colors haptic"
      >
        {netFloat > 0
          ? `Return all floats before ending shift (GH₵ ${netFloat.toFixed(2)} remaining)`
          : 'End Shift'}
      </button>
    </div>
  );
};
