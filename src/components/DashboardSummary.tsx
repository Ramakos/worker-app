import { useEffect, useState } from 'react';
import { Clock, CheckCircle, DollarSign, ClipboardList } from 'lucide-react';
import { useFloat } from '../hooks/useFloat';
import { useOrders } from '../hooks/useOrders';

interface DashboardSummaryProps {
  workerId?: string;
}

export const DashboardSummary = ({ workerId }: DashboardSummaryProps) => {
  const { currentShift, netFloat } = useFloat(workerId);
  const { personalOrders } = useOrders(workerId);
  const [shiftDuration, setShiftDuration] = useState('');

  useEffect(() => {
    if (!currentShift) return;

    const updateDuration = () => {
      const start = new Date(currentShift.started_at).getTime();
      const now = new Date().getTime();
      const diff = now - start;

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setShiftDuration(`${hours}h ${minutes}m`);
    };

    updateDuration();
    const interval = setInterval(updateDuration, 60000);

    return () => clearInterval(interval);
  }, [currentShift]);

  if (!currentShift) return null;

  const servedOrders = personalOrders.filter(o => o.status === 'served').length;
  const activeOrders = personalOrders.filter(o => o.status !== 'served').length;

  return (
    <div className="bg-card rounded-2xl shadow-sm p-3.5 sm:p-4 mb-3 sm:mb-4 border border-border">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Current Shift Summary</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="flex items-center space-x-2.5 sm:space-x-3 bg-muted/40 p-2.5 rounded-xl">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-secondary rounded-lg flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground">Duration</p>
            <p className="text-sm sm:text-base font-bold text-foreground truncate">{shiftDuration}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 sm:space-x-3 bg-muted/40 p-2.5 rounded-xl">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-accent rounded-lg flex items-center justify-center shrink-0">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-secondary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground">Served</p>
            <p className="text-sm sm:text-base font-bold text-foreground">{servedOrders}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 sm:space-x-3 bg-muted/40 p-2.5 rounded-xl">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-secondary rounded-lg flex items-center justify-center shrink-0">
            <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground">Active</p>
            <p className="text-sm sm:text-base font-bold text-foreground">{activeOrders}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 sm:space-x-3 bg-muted/40 p-2.5 rounded-xl">
          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 ${
            netFloat > 0 ? 'bg-accent' : 'bg-muted'
          }`}>
            <DollarSign className={`w-4 h-4 sm:w-5 sm:h-5 ${
              netFloat > 0 ? 'text-primary' : 'text-muted-foreground'
            }`} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground">Net Float</p>
            <p className={`text-sm sm:text-base font-bold truncate ${
              netFloat > 0 ? 'text-secondary-foreground' : 'text-foreground'
            }`}>
              GH₵ {netFloat.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
