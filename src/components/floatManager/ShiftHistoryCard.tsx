import React from 'react';

interface Shift {
  id: string;
  amount_taken_float?: number;
  amount_returned_float: number | null;
  started_at: string;
  ended_at?: string | null;
}

interface ShiftHistoryCardProps {
  shifts: Shift[];
}

export const ShiftHistoryCard: React.FC<ShiftHistoryCardProps> = ({ shifts }) => {
  if (shifts.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl shadow-sm p-4 sm:p-5 border border-border">
      <h3 className="text-sm font-bold text-foreground mb-3">Recent Shifts</h3>
      <div className="space-y-2">
        {shifts.slice(0, 5).map(shift => (
          <div
            key={shift.id}
            className="flex items-start justify-between p-3 bg-muted/40 rounded-xl border border-border/50"
          >
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-xs text-foreground">
                Taken: GH₵ {shift.amount_taken_float?.toFixed(2) || '0.00'}
                {shift.amount_returned_float !== null && (
                  <span className="text-muted-foreground font-normal">
                    {' '}
                    → Ret: GH₵ {shift.amount_returned_float.toFixed(2)}
                  </span>
                )}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {new Date(shift.started_at).toLocaleDateString()}{' '}
                {new Date(shift.started_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {shift.ended_at && (
                  <span>
                    {' '}
                    -{' '}
                    {new Date(shift.ended_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </p>
            </div>
            <div
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ml-2 whitespace-nowrap shrink-0 ${
                shift.ended_at
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {shift.ended_at ? 'Closed' : 'Active'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
