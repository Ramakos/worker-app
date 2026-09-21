export interface MenuItem {
  id: string;
  name: string;
  price: number;
  is_available: boolean;
  category_id: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  sort_order: number;
  items: MenuItem[];
}

export interface PickedItem {
  id: string;
  name: string;
  price: number;
  timestamp: number;
}
