import { useState, useEffect } from 'react';
import { RefreshCw, Search, Plus, X, Check, ChevronDown, Wifi, WifiOff, ShoppingBag, UtensilsCrossed } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  is_available: boolean;
  category_id: string;
}

interface MenuCategory {
  id: string;
  name: string;
  sort_order: number;
  items: MenuItem[];
}

interface PickedItem {
  id: string;
  name: string;
  price: number;
  timestamp: number;
}

const MENU_CACHE_KEY = 'menuReferenceCache';
const PICKED_ITEMS_KEY = 'pickedMenuItems';

export const MenuReference = ({ onAddToTable }: { onAddToTable?: (item: { name: string; price: number }) => void }) => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [pickedItems, setPickedItems] = useState<PickedItem[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const [recentlyPickedId, setRecentlyPickedId] = useState<string | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem(MENU_CACHE_KEY);
    if (cached) {
      try {
        const data = JSON.parse(cached);
        setCategories(data.categories || []);
        setLastSynced(data.lastSynced);
      } catch {
        // ignore invalid cache
      }
    }

    const savedPicked = localStorage.getItem(PICKED_ITEMS_KEY);
    if (savedPicked) {
      try {
        setPickedItems(JSON.parse(savedPicked));
      } catch {
        // ignore invalid cache
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(PICKED_ITEMS_KEY, JSON.stringify(pickedItems));
  }, [pickedItems]);

  const fetchMenu = async () => {
    if (!navigator.onLine) {
      setIsOffline(true);
      return;
    }
    setIsOffline(!navigator.onLine);

    setIsLoading(true);
    try {
      const { data: items, error: itemError } = await supabase
        .from('menu_items')
        .select('id, name, price, is_active, in_stock, category')
        .eq('is_active', true)
        .order('name');

      if (itemError) throw itemError;

      const categoryMap = new Map<string, MenuItem[]>();
      (items || []).forEach(item => {
        const catName = item.category || 'General';
        if (!categoryMap.has(catName)) {
          categoryMap.set(catName, []);
        }
        categoryMap.get(catName)!.push({
          id: String(item.id),
          name: item.name,
          price: item.price ?? 0,
          is_available: item.in_stock ?? true,
          category_id: catName,
        });
      });

      const combined: MenuCategory[] = Array.from(categoryMap.entries()).map(([name, catItems], idx) => ({
        id: name,
        name,
        sort_order: idx,
        items: catItems,
      }));

      setCategories(combined);
      const now = new Date().toISOString();
      setLastSynced(now);

      localStorage.setItem(MENU_CACHE_KEY, JSON.stringify({
        categories: combined,
        lastSynced: now,
      }));
    } catch (error) {
      console.error('Error fetching menu:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handlePickItem = (item: MenuItem) => {
    const picked: PickedItem = {
      id: `${item.id}-${Date.now()}`,
      name: item.name,
      price: item.price,
      timestamp: Date.now(),
    };
    setPickedItems(prev => [...prev, picked]);
    setRecentlyPickedId(item.id);
    setTimeout(() => setRecentlyPickedId(null), 300);
  };

  const handleRemovePickedItem = (id: string) => {
    setPickedItems(prev => prev.filter(i => i.id !== id));
  };

  const handleConfirmPickedItems = () => {
    pickedItems.forEach(item => {
      onAddToTable?.({ name: item.name, price: item.price });
    });
    setPickedItems([]);
  };

  const handleClearPickedItems = () => {
    setPickedItems([]);
  };

  const filteredCategories = searchQuery
    ? categories.map(cat => ({
        ...cat,
        items: cat.items.filter(item =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(cat => cat.items.length > 0)
    : categories;

  const pickedTotal = pickedItems.reduce((sum, i) => sum + i.price, 0);

  return (
    <div className="space-y-3 pb-32">
      {/* Header Card */}
      <div className="card-elevated p-3 scale-in">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-brand">
              <UtensilsCrossed className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground text-sm">Menu Reference</h2>
              <p className="text-xs text-muted-foreground">
                {lastSynced ? `Synced ${new Date(lastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Loading...'}
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
              onClick={() => fetchMenu()}
              disabled={isLoading}
              className="w-9 h-9 rounded-xl bg-muted hover:bg-muted/70 flex items-center justify-center transition-colors disabled:opacity-50 haptic"
              title="Refresh menu"
            >
              <RefreshCw className={`w-4 h-4 text-muted-foreground ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items..."
            className="input pl-10 bg-muted/50 border-border"
          />
        </div>
      </div>

      {/* Categories */}
      {filteredCategories.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
            <UtensilsCrossed className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">No items found</p>
          <p className="text-muted-foreground/70 text-sm mt-1">Try a different search or refresh</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredCategories.map(category => {
            const isExpanded = expandedCategories.has(category.id) || searchQuery !== '';
            const itemCount = category.items.length;

            if (itemCount === 0) return null;

            return (
              <div key={category.id} className="card overflow-hidden fade-in">
                {/* Category Header */}
                <button
                  onClick={() => !searchQuery && toggleCategory(category.id)}
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
                    <div className={`w-7 h-7 rounded-lg bg-muted flex items-center justify-center transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
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
                            onClick={() => handlePickItem(item)}
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
          })}
        </div>
      )}

      {/* Picked Items Bottom Sheet */}
      {pickedItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-2xl z-50 safe-bottom slide-up">
          <div className="max-w-lg mx-auto">
            {/* Handle */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <span className="font-semibold text-foreground text-sm">{pickedItems.length} item{pickedItems.length !== 1 ? 's' : ''}</span>
                  <span className="text-xs text-muted-foreground ml-2">picked</span>
                </div>
              </div>
              <button
                onClick={handleClearPickedItems}
                className="text-xs text-destructive hover:text-destructive/80 font-medium"
              >
                Clear
              </button>
            </div>

            {/* Picked Items Scroll */}
            <div className="flex gap-2 overflow-x-auto px-4 py-2 hide-scrollbar">
              {pickedItems.map(item => (
                <div
                  key={item.id}
                  className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-muted rounded-xl animate-in"
                >
                  <div className="text-xs">
                    <div className="font-medium text-foreground max-w-[120px] truncate">{item.name}</div>
                    <div className="text-muted-foreground">GHS {item.price.toFixed(2)}</div>
                  </div>
                  <button
                    onClick={() => handleRemovePickedItem(item.id)}
                    className="w-6 h-6 rounded-full bg-muted-foreground/20 hover:bg-destructive/20 flex items-center justify-center transition-colors haptic"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ))}
            </div>

            {/* Footer with Total & Confirm */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-muted/50">
              <div>
                <span className="text-xs text-muted-foreground">Total</span>
                <div className="text-xl font-bold text-foreground">GHS {pickedTotal.toFixed(2)}</div>
              </div>
              <button
                onClick={handleConfirmPickedItems}
                className="btn btn-primary px-6 py-3 haptic"
              >
                <Check className="w-4 h-4" />
                <span>Add to Table</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .slide-up {
          animation: slide-up 0.3s ease-out;
        }
        @keyframes animate-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-in {
          animation: animate-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};
