import React from 'react';
import { ChevronDown } from 'lucide-react';
import { MenuCategory } from './types';

interface MenuCategoryCardProps {
  category: MenuCategory;
  isExpanded: boolean;
  searchQuery: string;
  onToggle: (id: string) => void;
}

export const MenuCategoryCard: React.FC<MenuCategoryCardProps> = ({
  category,
  isExpanded,
  searchQuery,
  onToggle,
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
        <div className="border-t border-border/50 bg-muted/30 divide-y divide-border/40">
          {category.items.map((item, idx) => {
            return (
              <div
                key={item.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-card/70 transition-colors"
                style={{ animationDelay: `${idx * 20}ms` }}
              >
                <div className="flex-1 min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground text-sm truncate">{item.name}</span>
                    {!item.is_available && (
                      <span className="badge badge-destructive text-[10px] px-1.5 py-0.2">
                        86'd / Out
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</div>
                  )}
                </div>
                <div className="text-sm font-bold text-primary font-mono shrink-0">
                  GHS {item.price.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
