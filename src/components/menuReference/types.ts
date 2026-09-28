export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  is_available: boolean;
  category_id: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  sort_order: number;
  items: MenuItem[];
}
