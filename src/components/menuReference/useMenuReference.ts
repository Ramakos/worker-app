import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { MenuCategory, MenuItem, PickedItem } from './types';

const MENU_CACHE_KEY = 'menuReferenceCache';
const PICKED_ITEMS_KEY = 'pickedMenuItems';

// Standard fallback menu prices from the Ramakos restaurant operations catalog
const FALLBACK_MENU_PRICES: Record<string, number> = {
  "2 fingers": 5,
  "4 fingers": 10,
  "shots": 10,
  "half quart": 20,
  "quart": 40,
  "puff puff": 5,
  "ampese with stew": 60,
  "ampesi with stew": 60,
  "ampesi only": 35,
  "ampese only": 35,
  "banku & okro": 65,
  "banku & any soup": 65,
  "banku only": 20,
  "garden egg stew": 55,
  "fufu with soup": 65,
  "fufu only": 35,
  "rice balls & soup": 55,
  "rice ball only": 25,
  "yam or plantain with egusi": 60,
  "egusi soup only": 40,
  "white rice only": 15,
  "white rice & stew": 40,
  "fried rice & chicken": 50,
  "fried rice only": 35,
  "spaghetti jollof": 40,
  "spaghetti jollof only": 25,
  "yam porridge": 45,
  "boiled yam only": 20,
  "jollof rice only": 15,
  "jollof rice & chicken": 50,
  "roasted plantain": 15,
  "roasted yam": 15,
  "red red only": 15,
  "grilled chicken": 30,
  "asaro only": 15,
  "beans & gari": 20,
  "kebab": 10,
  "gizdodo": 25,
  "garden salad": 20,
  "coleslaw": 15,
  "sprite": 8,
  "coca cola": 8,
  "fanta": 8,
  "water": 5,
  "malta guinness": 10,
  "alvaro": 10,
  "sobolo": 8,
  "sobol0": 8,
  "ginger beer": 8,
  "club beer": 15,
  "star beer": 15,
  "guilder": 12,
  "orijin": 15,
  "cider": 15,
  "guinness": 15,
  "campari": 10,
  "whisky shot": 25,
  "vodka shot": 25,
  "gin shot": 20,
  "margherita": 50,
  "pepperoni pizza": 55,
  "meat lover's pizza": 60,
  "suya chicken pizza": 60,
  "vegetarian pizza": 50,
};

export const extractMenuItemPrice = (item: any): number => {
  // 1. Direct price column if positive number
  if (item.price != null && Number(item.price) > 0) {
    return Number(item.price);
  }

  // 2. Parse variants (can be JSON array or JSON string in Supabase)
  if (item.variants) {
    try {
      const v = typeof item.variants === 'string' ? JSON.parse(item.variants) : item.variants;
      if (Array.isArray(v) && v.length > 0) {
        const found = v.find((x: any) => Number(x?.price) > 0);
        if (found) return Number(found.price);
        if (v[0]?.price != null && Number(v[0].price) > 0) return Number(v[0].price);
      }
    } catch {
      // ignore
    }
  }

  // 3. Fallback catalog matching by item name
  if (item.name) {
    const key = String(item.name).toLowerCase().trim();
    if (FALLBACK_MENU_PRICES[key] !== undefined) {
      return FALLBACK_MENU_PRICES[key];
    }
  }

  // 4. Alternate price fields in schema
  if (item.base_price != null && Number(item.base_price) > 0) return Number(item.base_price);
  if (item.item_price != null && Number(item.item_price) > 0) return Number(item.item_price);
  if (item.cost != null && Number(item.cost) > 0) return Number(item.cost);

  return 0;
};

export const useMenuReference = (onAddToTable?: (item: { name: string; price: number }) => void) => {
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
        const cachedCats = data.categories || [];
        // Only hydrate cache if it contains non-zero pricing (ignore stale zero-price caches)
        const hasValidPrices = cachedCats.some((c: any) =>
          c.items?.some((i: any) => Number(i.price) > 0)
        );
        if (hasValidPrices) {
          setCategories(cachedCats);
          setLastSynced(data.lastSynced);
        }
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
      // Select all columns including variants, description, in_stock
      const { data: items, error: itemError } = await (supabase as any)
        .from('menu_items')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (itemError) throw itemError;

      const categoryMap = new Map<string, MenuItem[]>();
      (items || []).forEach((item: any) => {
        // Only include active items
        if (item.is_active === false) return;

        const catName = item.category || 'General';
        if (!categoryMap.has(catName)) {
          categoryMap.set(catName, []);
        }

        const resolvedPrice = extractMenuItemPrice(item);
        const isAvailable = item.in_stock !== false && item.is_active !== false;

        categoryMap.get(catName)!.push({
          id: String(item.id),
          name: item.name,
          price: resolvedPrice,
          is_available: isAvailable,
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

      localStorage.setItem(
        MENU_CACHE_KEY,
        JSON.stringify({
          categories: combined,
          lastSynced: now,
        })
      );
    } catch (error) {
      console.error('Error fetching menu:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();

    // Subscribe to real-time menu modifications from admin portal
    const sub = supabase
      .channel('worker_menu_items_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
        fetchMenu();
      })
      .subscribe();

    return () => {
      sub.unsubscribe();
    };
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
    ? categories
        .map(cat => ({
          ...cat,
          items: cat.items.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter(cat => cat.items.length > 0)
    : categories;

  const pickedTotal = pickedItems.reduce((sum, i) => sum + i.price, 0);

  return {
    categories: filteredCategories,
    expandedCategories,
    searchQuery,
    setSearchQuery,
    isLoading,
    lastSynced,
    pickedItems,
    isOffline,
    recentlyPickedId,
    fetchMenu,
    toggleCategory,
    handlePickItem,
    handleRemovePickedItem,
    handleConfirmPickedItems,
    handleClearPickedItems,
    pickedTotal,
  };
};
