export interface Worker {
  id: string;
  full_name: string;
  username: string;
  worker_id: string | null;
  role: 'admin' | 'counter_worker' | 'general_worker' | 'kitchen_staff';
  is_active: boolean;
  has_pin?: boolean;
  auth_method?: 'password' | 'pin';
}

export interface WorkerShift {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  amount_taken_float: number | null;
  amount_returned_float: number | null;
  notes: string | null;
  active: boolean;
}

export interface Order {
  id: number;
  status: 'pending' | 'confirmed' | 'in_kitchen' | 'ready' | 'served' | 'delivered' | 'cancelled' | 'held';
  order_type: string;
  items: OrderItem[];
  created_at: string;
  ready_at: string | null;
  customer_name: string | null;
  payment_method: string | null;
  total_paid: number | null;
  created_by: string | null;
  claimed_by: string | null;
  claimed_at: string | null;
  mode: string | null;
}

export interface WorkerOrderLog {
  id: string;
  order_id: number;
  worker_id: string;
  action: string;
  amount: number | null;
  mode: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  modifiers?: string;
}

export interface FloatTransaction {
  id: string;
  shift_id: string;
  user_id: string;
  transaction_type: 'take' | 'return';
  amount: number;
  created_at: string;
}