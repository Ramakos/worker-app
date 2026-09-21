import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { MenuCategory, MenuItem, PickedItem } from './types';

const MENU_CACHE_KEY = 'menuReferenceCache';
const PICKED_ITEMS_KEY = 'pickedMenuItems';

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
