import React from 'react';
import { BarChart3, RefreshCw, X } from 'lucide-react';
import { DateRange } from '../../hooks/useSales';

interface MySalesHeaderProps {
  isLoading: boolean;
  onRefresh: () => void;
  range: DateRange;
  onRangeChange: (range: DateRange) => void;
  showDatePicker: boolean;
  onCloseDatePicker: () => void;
  customStart: string;
  onCustomStartChange: (val: string) => void;
  customEnd: string;
  onCustomEndChange: (val: string) => void;
  rangeMap: Record<DateRange, { label: string }>;
}

export const MySalesHeader: React.FC<MySalesHeaderProps> = ({
  isLoading,
  onRefresh,
  range,
  onRangeChange,
  showDatePicker,
  onCloseDatePicker,
  customStart,
  onCustomStartChange,
  customEnd,
  onCustomEndChange,
  rangeMap,
}) => {
  return (
    <>
      <div className="card-elevated p-3 scale-in">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-brand">
              <BarChart3 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground text-sm">My Sales</h2>
              <p className="text-xs text-muted-foreground">Your served orders</p>
            </div>
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="w-9 h-9 rounded-xl bg-muted hover:bg-muted/70 flex items-center justify-center transition-colors disabled:opacity-50 haptic"
          >
            <RefreshCw
              className={`w-4 h-4 text-muted-foreground ${isLoading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>

        {/* Range Selector */}
        <div className="flex gap-1 p-1 bg-muted/80 rounded-xl">
          {(Object.keys(rangeMap) as DateRange[]).map(key => (
            <button
              key={key}
              onClick={() => onRangeChange(key)}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                range === key
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {rangeMap[key].label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Picker */}
      {range === 'custom' && showDatePicker && (
        <div className="card p-4 space-y-3 fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">Select Date Range</h3>
            <button
              onClick={onCloseDatePicker}
              className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center haptic"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground block mb-1">From</label>
              <input
                type="date"
                value={customStart}
                onChange={e => onCustomStartChange(e.target.value)}
                className="input text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground block mb-1">To</label>
              <input
                type="date"
                value={customEnd}
                onChange={e => onCustomEndChange(e.target.value)}
                className="input text-sm"
              />
            </div>
          </div>
          {customStart && customEnd && new Date(customStart) > new Date(customEnd) && (
            <p className="text-xs text-destructive">Start date must be before end date</p>
          )}
        </div>
      )}
    </>
  );
};
