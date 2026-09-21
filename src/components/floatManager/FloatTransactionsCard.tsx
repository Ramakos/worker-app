import React from 'react';
import { History, TrendingUp, TrendingDown } from 'lucide-react';

interface FloatTransaction {
  id: string;
  transaction_type: 'take' | 'return';
  amount: number;
  created_at: string;
}

interface FloatTransactionsCardProps {
  transactions: FloatTransaction[];
}

export const FloatTransactionsCard: React.FC<FloatTransactionsCardProps> = ({ transactions }) => {
  if (transactions.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl shadow-sm p-4 sm:p-5 border border-border">
      <div className="flex items-center space-x-2.5 mb-3">
        <History className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Float Transactions</h3>
      </div>
      <div className="space-y-2">
        {transactions.map(transaction => (
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
                <p
                  className={`font-semibold text-xs truncate ${
                    transaction.transaction_type === 'take'
                      ? 'text-secondary-foreground'
                      : 'text-accent-foreground'
                  }`}
                >
                  {transaction.transaction_type === 'take' ? 'Took' : 'Returned'} Float
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {new Date(transaction.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  · {new Date(transaction.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <p
              className={`text-sm sm:text-base font-bold text-right ml-3 shrink-0 ${
                transaction.transaction_type === 'take'
                  ? 'text-secondary-foreground'
                  : 'text-accent-foreground'
              }`}
            >
              GH₵ {Number(transaction.amount).toFixed(2)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
