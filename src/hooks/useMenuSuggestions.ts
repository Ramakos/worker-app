import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { extractMenuItemPrice } from '../components/menuReference/useMenuReference';

export interface MenuSuggestionItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

const MENU_CACHE_KEY = 'menuReferenceCache';

export const useMenuSuggestions = () => {
  const [menuItems, setMenuItems] = useState<MenuSuggestionItem[]>(() => {
    try {
      const cached = localStorage.getItem(MENU_CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        const categories = data.categories || [];
        const items: MenuSuggestionItem[] = [];
        categories.forEach((cat: any) => {
          (cat.items || []).forEach((item: any) => {
            if (item.name && item.is_available !== false) {
              items.push({
                id: String(item.id),
                name: item.name,
                price: Number(item.price) || 0,
                category: cat.name || item.category_id || 'General',
              });
            }
          });
        });
        if (items.length > 0) return items;
      }
    } catch {}
    return [];
  });

  const fetchMenuItems = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('menu_items')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      if (data && Array.isArray(data)) {
        const mapped: MenuSuggestionItem[] = data.map((item: any) => ({
          id: String(item.id),
          name: item.name,
          price: extractMenuItemPrice(item),
          category: item.category || 'General',
        }));
        setMenuItems(mapped);
      }
    } catch (err) {
      console.warn('[useMenuSuggestions] Error fetching menu suggestions:', err);
    }
  }, []);

  useEffect(() => {
    fetchMenuItems();

    const channel = supabase
      .channel('worker_menu_suggestions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_items' },
        () => {
          fetchMenuItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMenuItems]);

  const getSuggestions = useCallback(
    (query: string, maxResults = 8): MenuSuggestionItem[] => {
      const trimmed = query.trim().toLowerCase();
      if (!trimmed) return [];

      const filtered = menuItems.filter((item) => {
        const nameMatch = item.name.toLowerCase().includes(trimmed);
        const catMatch = item.category.toLowerCase().includes(trimmed);
        return nameMatch || catMatch;
      });

      // Sort exact/prefix matches first
      return filtered
        .sort((a, b) => {
          const aStartsWith = a.name.toLowerCase().startsWith(trimmed);
          const bStartsWith = b.name.toLowerCase().startsWith(trimmed);
          if (aStartsWith && !bStartsWith) return -1;
          if (!aStartsWith && bStartsWith) return 1;
          return a.name.localeCompare(b.name);
        })
        .slice(0, maxResults);
    },
    [menuItems]
  );

  return {
    menuItems,
    getSuggestions,
    refreshSuggestions: fetchMenuItems,
  };
};
