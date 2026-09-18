export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          full_name: string | null;
          worker_id: string | null;
          created_at: string | null;
          is_active: boolean | null;
          username: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          worker_id?: string | null;
          created_at?: string | null;
          is_active?: boolean | null;
          username: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          worker_id?: string | null;
          created_at?: string | null;
          is_active?: boolean | null;
          username?: string;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: 'admin' | 'counter_worker' | 'general_worker' | 'kitchen_staff';
        };
        Insert: {
          id?: string;
          user_id: string;
          role: 'admin' | 'counter_worker' | 'general_worker' | 'kitchen_staff';
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: 'admin' | 'counter_worker' | 'general_worker' | 'kitchen_staff';
        };
      };
      worker_shifts: {
        Row: {
          id: string;
          user_id: string;
          started_at: string;
          ended_at: string | null;
          amount_taken_float: number | null;
          amount_returned_float: number | null;
          notes: string | null;
          created_by: string | null;
          created_at: string | null;
          active: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          started_at?: string;
          ended_at?: string | null;
          amount_taken_float?: number | null;
          amount_returned_float?: number | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string | null;
          active?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          started_at?: string;
          ended_at?: string | null;
          amount_taken_float?: number | null;
          amount_returned_float?: number | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string | null;
          active?: boolean;
        };
      };
      orders: {
        Row: {
          id: number;
          status: string;
          order_type: string;
          items: any;
          created_at: string;
          ready_at: string | null;
          customer_name: string | null;
          payment_method: string | null;
          cash_received: number | null;
          momo_received: number | null;
          total_paid: number | null;
          created_by: string | null;
          claimed_by: string | null;
          claimed_at: string | null;
        };
        Insert: {
          id?: number;
          status?: string;
          order_type?: string;
          items: any;
          created_at?: string;
          ready_at?: string | null;
          customer_name?: string | null;
          payment_method?: string | null;
          cash_received?: number | null;
          momo_received?: number | null;
          total_paid?: number | null;
          created_by?: string | null;
          claimed_by?: string | null;
          claimed_at?: string | null;
        };
        Update: {
          id?: number;
          status?: string;
          order_type?: string;
          items?: any;
          created_at?: string;
          ready_at?: string | null;
          customer_name?: string | null;
          payment_method?: string | null;
          cash_received?: number | null;
          momo_received?: number | null;
          total_paid?: number | null;
          created_by?: string | null;
          claimed_by?: string | null;
          claimed_at?: string | null;
        };
      };
      worker_orders: {
        Row: {
          id: string;
          order_id: number;
          worker_id: string;
          action: 'CLAIMED' | 'SERVED' | 'DELIVERED' | 'CANCELLED';
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: number;
          worker_id: string;
          action: 'CLAIMED' | 'SERVED' | 'DELIVERED' | 'CANCELLED';
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: number;
          worker_id?: string;
          action?: 'CLAIMED' | 'SERVED' | 'DELIVERED' | 'CANCELLED';
          created_at?: string;
        };
      };
    };
  };
}