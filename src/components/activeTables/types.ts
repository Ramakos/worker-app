export interface TableLineItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface TableOrder {
  id: string;
  tableName: string;
  items: TableLineItem[];
  notes: string;
  timestamp: number;
}

export type ConfirmAction = 'undo' | 'clear' | 'clearAll' | 'deleteTable' | null;
