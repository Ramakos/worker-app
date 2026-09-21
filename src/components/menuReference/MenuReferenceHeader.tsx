import React from 'react';
import { UtensilsCrossed, Wifi, WifiOff, RefreshCw, Search } from 'lucide-react';

interface MenuReferenceHeaderProps {
  lastSynced: string | null;
  isOffline: boolean;
  isLoading: boolean;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onRefresh: () => void;
}

export const MenuReferenceHeader: React.FC<MenuReferenceHeaderProps> = ({
  lastSynced,
  isOffline,
  isLoading,
  searchQuery,
  onSearchQueryChange,
  onRefresh,
}) => {
  return (
    <div className="card-elevated p-3 scale-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-brand">
            <UtensilsCrossed className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground text-sm">Menu Reference</h2>
            <p className="text-xs text-muted-foreground">
              {lastSynced
                ? `Synced ${new Date(lastSynced).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : 'Loading...'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOffline ? (
            <span className="flex items-center gap-1 text-xs text-destructive bg-destructive/10 px-2 py-1 rounded-full">
              <WifiOff className="w-3.5 h-3.5" />
              Offline
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-secondary-foreground bg-secondary px-2 py-1 rounded-full">
              <Wifi className="w-3.5 h-3.5" />
              Online
            </span>
          )}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="w-9 h-9 rounded-xl bg-muted hover:bg-muted/70 flex items-center justify-center transition-colors disabled:opacity-50 haptic"
            title="Refresh menu"
          >
            <RefreshCw
              className={`w-4 h-4 text-muted-foreground ${isLoading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => onSearchQueryChange(e.target.value)}
          placeholder="Search items..."
          className="input pl-10 bg-muted/50 border-border h-11 text-sm"
        />
      </div>
    </div>
  );
};
