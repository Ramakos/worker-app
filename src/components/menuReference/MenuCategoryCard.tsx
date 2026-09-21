import React from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { MenuCategory, MenuItem } from './types';

interface MenuCategoryCardProps {
  category: MenuCategory;
  isExpanded: boolean;
  searchQuery: string;
  recentlyPickedId: string | null;
  onToggle: (id: string) => void;
  onPickItem: (item: MenuItem) => void;
}

export const MenuCategoryCard: React.FC<MenuCategoryCardProps> = ({
  category,
  isExpanded,
  searchQuery,
  recentlyPickedId,
  onToggle,
  onPickItem,
}) => {
  const itemCount = category.items.length;
  if (itemCount === 0) return null;

  return (
    <div className="card overflow-hidden fade-in">
      {/* Category Header */}
      <button
        onClick={() => !searchQuery && onToggle(category.id)}
        className={`w-full p-3.5 flex items-center justify-between ${
          searchQuery ? 'cursor-default' : 'hover:bg-muted/50'
        } transition-colors`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center">
            <span className="text-sm font-bold text-muted-foreground">
              {category.name.charAt(0)}
            </span>
          </div>
          <div className="text-left">
            <span className="font-medium text-foreground">{category.name}</span>
            <span className="text-xs text-muted-foreground ml-2">({itemCount})</span>
          </div>
        </div>
        {!searchQuery && (
          <div
            className={`w-7 h-7 rounded-lg bg-muted flex items-center justify-center transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          >
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
      </button>

      {/* Items */}
      {isExpanded && (
        <div className="border-t border-border/50 bg-muted/30">
          {category.items.map((item, idx) => {
            const wasRecentlyPicked = recentlyPickedId === item.id;

            return (
              <div
                key={item.id}
                className={`flex items-center justify-between px-4 py-3 border-b border-border/50 last:border-b-0 transition-all ${
                  wasRecentlyPicked ? 'bg-secondary scale-[1.02]' : 'hover:bg-card'
                }`}
                style={{ animationDelay: `${idx * 20}ms` }}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground text-sm truncate">{item.name}</div>
                  <div className="text-xs text-muted-foreground">GHS {item.price.toFixed(2)}</div>
                </div>
                <button
                  onClick={() => onPickItem(item)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-secondary hover:bg-accent text-secondary-foreground rounded-xl text-xs font-medium transition-all haptic"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
