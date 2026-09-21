import React from 'react';
import { Clock, ArrowUpCircle } from 'lucide-react';

interface NoActiveFloatCardProps {
  floatAmount: string;
  onFloatAmountChange: (val: string) => void;
  onTakeFloat: (e: React.FormEvent) => void;
  isLoading: boolean;
  error: string;
}

export const NoActiveFloatCard: React.FC<NoActiveFloatCardProps> = ({
  floatAmount,
  onFloatAmountChange,
  onTakeFloat,
  isLoading,
  error,
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-secondary border border-primary/20 rounded-xl p-4 text-center">
        <Clock className="w-12 h-12 text-primary mx-auto mb-2" />
        <p className="text-secondary-foreground font-medium">No Active Float</p>
        <p className="text-sm text-muted-foreground">
          Take a float to start handling cash transactions
        </p>
      </div>

      <form onSubmit={onTakeFloat} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Float Amount</label>
          <input
            type="number"
            value={floatAmount}
            onChange={e => onFloatAmountChange(e.target.value)}
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
  );
};
