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
    <div className="bg-card rounded-xl shadow-sm p-4 mb-4 border border-border">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Shift Summary</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Duration</p>
            <p className="text-lg font-semibold text-foreground">{shiftDuration}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-secondary-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Served</p>
            <p className="text-lg font-semibold text-foreground">{servedOrders}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Active</p>
            <p className="text-lg font-semibold text-foreground">{activeOrders}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            netFloat > 0 ? 'bg-accent' : 'bg-muted'
          }`}>
            <DollarSign className={`w-5 h-5 ${
              netFloat > 0 ? 'text-primary' : 'text-muted-foreground'
            }`} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Net Float</p>
            <p className={`text-lg font-semibold ${
              netFloat > 0 ? 'text-secondary-foreground' : 'text-foreground'
            }`}>
              ${netFloat.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
