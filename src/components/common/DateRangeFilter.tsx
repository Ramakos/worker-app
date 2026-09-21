import React, { useState } from 'react';
import { Calendar, RotateCcw, ChevronDown, Check } from 'lucide-react';
import {
  DateFilterState,
  DatePreset,
  resolveDateRange,
} from '../../lib/dateFilter';

interface DateRangeFilterProps {
  value: DateFilterState;
  onChange: (filter: DateFilterState) => void;
  defaultPreset?: DatePreset;
  allowedPresets?: DatePreset[];
  className?: string;
}

const ALL_PRESET_OPTIONS: { value: DatePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7days', label: 'Last 7 Days' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'all', label: 'All Time' },
  { value: 'custom', label: 'Custom Range…' },
];

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  value,
  onChange,
  defaultPreset = 'today',
  allowedPresets,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [localStart, setLocalStart] = useState(
    value.startDate || new Date().toISOString().slice(0, 10)
  );
  const [localEnd, setLocalEnd] = useState(
    value.endDate || new Date().toISOString().slice(0, 10)
  );

  const options = allowedPresets
    ? ALL_PRESET_OPTIONS.filter((o) => allowedPresets.includes(o.value))
    : ALL_PRESET_OPTIONS;

  const rangeInfo = resolveDateRange(value);
  const isDefault =
    value.preset === defaultPreset && !value.startDate && !value.endDate;

  const handleSelectPreset = (preset: DatePreset) => {
    if (preset === 'custom') {
      setShowCustomModal(true);
      setIsOpen(false);
    } else {
      onChange({ preset });
      setIsOpen(false);
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    onChange({
      preset: 'custom',
      startDate: localStart,
      endDate: localEnd,
    });
    setShowCustomModal(false);
  };

  const handleReset = () => {
    onChange({ preset: defaultPreset });
    setLocalStart(new Date().toISOString().slice(0, 10));
    setLocalEnd(new Date().toISOString().slice(0, 10));
    setIsOpen(false);
    setShowCustomModal(false);
  };

  return (
    <div className={`relative flex flex-wrap items-center gap-1.5 ${className}`}>
      {/* Trigger Button */}
      <div className="relative flex items-center gap-1.5 w-full sm:w-auto">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-between gap-2 px-3 py-2 sm:py-1.5 rounded-xl border text-xs font-semibold transition-all haptic ${
            !isDefault
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-card border-border/80 text-foreground hover:bg-muted/70'
          } shadow-xs w-full sm:w-auto`}
        >
          <span className="flex items-center gap-1.5 truncate">
            <Calendar className={`w-3.5 h-3.5 shrink-0 ${!isDefault ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className="truncate">{rangeInfo.label}</span>
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        </button>

        {/* Reset Button (Shown when not default) */}
        {!isDefault && (
          <button
            type="button"
            onClick={handleReset}
            title="Reset to default date"
            className="p-2 sm:p-1.5 rounded-xl border border-border/70 bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all shrink-0 haptic"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Preset Dropdown Popover */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-1 left-0 z-50 w-48 sm:w-56 bg-card rounded-2xl border border-border/80 shadow-xl py-1.5 animate-in fade-in zoom-in-95">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40">
              Filter By Date
            </div>
            {options.map((opt) => {
              const isSelected = value.preset === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelectPreset(opt.value)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-left transition-colors ${
                    isSelected
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-foreground hover:bg-muted/80'
                  }`}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Custom Range Dialog */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl p-5 w-full max-w-xs border border-border shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-primary" />
              <h4 className="font-bold text-sm text-foreground">Select Date Range</h4>
            </div>

            <form onSubmit={handleApplyCustom} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={localStart}
                  onChange={(e) => setLocalStart(e.target.value)}
                  className="input h-10 w-full rounded-xl text-xs px-3"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={localEnd}
                  onChange={(e) => setLocalEnd(e.target.value)}
                  className="input h-10 w-full rounded-xl text-xs px-3"
                  required
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="flex-1 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-brand-dark shadow-xs"
                >
                  Apply Filter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
