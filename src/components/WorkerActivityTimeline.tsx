import { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  DollarSign,
  ClipboardList,
  Utensils,
  LogIn,
  LogOut,
  RotateCcw,
  Sparkles,
  Filter,
  ShieldCheck,
  Receipt,
  Trash2,
} from 'lucide-react';
import { useWorkerActivity } from '../hooks/useWorkerActivity';
import { WorkerActivityItem, WorkerActivityType } from '../types';

interface WorkerActivityTimelineProps {
  workerId: string;
}

type ActivityFilter = 'all' | 'orders' | 'float' | 'tables';

const formatTimeAgo = (timestamp: string): string => {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const WorkerActivityTimeline = ({ workerId }: WorkerActivityTimelineProps) => {
  const { activities, stats, clearActivities } = useWorkerActivity(workerId);
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const filteredActivities = activities.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'orders') return item.type === 'order_claimed' || item.type === 'order_status';
    if (filter === 'float') return item.type === 'float_taken' || item.type === 'float_returned';
    if (filter === 'tables') return item.type === 'table_order';
    return true;
  });

  const getActivityIcon = (type: WorkerActivityType, status?: string | null) => {
    switch (type) {
      case 'order_claimed':
        return <ClipboardList className="w-4 h-4 text-primary" />;
      case 'order_status':
        if (status === 'served') {
          return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
        }
        return <Utensils className="w-4 h-4 text-amber-500" />;
      case 'float_taken':
        return <DollarSign className="w-4 h-4 text-blue-500" />;
      case 'float_returned':
        return <RotateCcw className="w-4 h-4 text-emerald-500" />;
      case 'table_order':
        return <Receipt className="w-4 h-4 text-purple-500" />;
      case 'shift_started':
        return <LogIn className="w-4 h-4 text-primary" />;
      case 'shift_ended':
        return <LogOut className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getActivityBadge = (type: WorkerActivityType, status?: string | null) => {
    switch (type) {
      case 'order_claimed':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
            Claimed
          </span>
        );
      case 'order_status':
        if (status === 'served') {
          return (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              Served
            </span>
          );
        }
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
            {status || 'In Progress'}
          </span>
        );
      case 'float_taken':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
            Float In
          </span>
        );
      case 'float_returned':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            Float Out
          </span>
        );
      case 'table_order':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-600 border border-purple-500/20">
            Table Order
          </span>
        );
      case 'shift_started':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
            Shift Start
          </span>
        );
      case 'shift_ended':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
            Shift End
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Persistence Badge */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-primary" /> My Shift Activity Log
          </h2>
          <p className="text-[11px] text-muted-foreground">
            Local real-time journal of your orders, tables, and float movements.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[10px] font-medium">
            <ShieldCheck className="w-3 h-3" />
            <span>Persisted Locally</span>
          </div>
          {activities.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="p-1 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
              title="Clear Log"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Dialog for Clear */}
      {showClearConfirm && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl space-y-2 text-xs">
          <p className="font-semibold text-destructive">Clear your local activity history for this shift?</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowClearConfirm(false)}
              className="px-2.5 py-1 rounded-lg bg-card border border-border text-foreground text-xs"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                clearActivities();
                setShowClearConfirm(false);
              }}
              className="px-2.5 py-1 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold"
            >
              Clear Log
            </button>
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-card p-2.5 rounded-xl border border-border text-center">
          <span className="text-[10px] font-medium text-muted-foreground uppercase">Actions</span>
          <p className="text-base font-bold text-foreground">{stats.totalActions}</p>
        </div>
        <div className="bg-card p-2.5 rounded-xl border border-border text-center">
          <span className="text-[10px] font-medium text-muted-foreground uppercase">Served</span>
          <p className="text-base font-bold text-emerald-600">{stats.ordersServed}</p>
        </div>
        <div className="bg-card p-2.5 rounded-xl border border-border text-center">
          <span className="text-[10px] font-medium text-muted-foreground uppercase">Sales Value</span>
          <p className="text-base font-bold text-primary truncate">
            {stats.totalSalesValue > 0 ? `GH₵${stats.totalSalesValue.toFixed(0)}` : 'GH₵0'}
          </p>
        </div>
        <div className="bg-card p-2.5 rounded-xl border border-border text-center">
          <span className="text-[10px] font-medium text-muted-foreground uppercase">Net Float</span>
          <p className="text-base font-bold text-blue-600 truncate">
            GH₵{(stats.floatTakenTotal - stats.floatReturnedTotal).toFixed(0)}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 p-1 bg-muted/60 rounded-xl">
        {(
          [
            { id: 'all', label: `All (${activities.length})` },
            { id: 'orders', label: `Orders (${stats.ordersClaimed + stats.ordersServed})` },
            { id: 'float', label: 'Float' },
            { id: 'tables', label: 'Tables' },
          ] as const
        ).map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium transition-all ${
              filter === tab.id
                ? 'bg-card text-foreground shadow-sm font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Timeline List */}
      <div className="space-y-2">
        {filteredActivities.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 text-center border border-border">
            <Clock className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs font-semibold text-foreground">No activities recorded yet</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              When you claim orders, change statuses, or adjust float, each action is logged here automatically.
            </p>
          </div>
        ) : (
          filteredActivities.map(item => (
            <div
              key={item.id}
              className="bg-card rounded-xl p-3 border border-border hover:border-primary/20 transition-all flex items-start gap-3 shadow-xs"
            >
              <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center shrink-0 mt-0.5">
                {getActivityIcon(item.type, item.status)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="font-semibold text-xs text-foreground truncate">{item.title}</span>
                  {getActivityBadge(item.type, item.status)}
                </div>

                {item.details && (
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{item.details}</p>
                )}

                <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground/80">
                  <span className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {formatTimeAgo(item.timestamp)} ({new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                  </span>

                  {item.amount && item.amount > 0 ? (
                    <span className="font-bold text-foreground font-mono">
                      GH₵ {Number(item.amount).toFixed(2)}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
