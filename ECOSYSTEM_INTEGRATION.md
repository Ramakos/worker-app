# Restaurant Hub Ecosystem Integration Guide

## System Overview

The Restaurant Hub consists of three interconnected applications sharing a single Supabase database:

1. **Counter App** - Point of Sale, order creation, worker management
2. **Kitchen App** - Order preparation, status updates
3. **Server App** (This App) - Order delivery, float management

## Data Flow Architecture

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│ Counter App │──────▶│   Supabase  │◀──────│ Kitchen App │
│   (POS)     │       │   Database  │       │  (Cooking)  │
└─────────────┘       └──────┬──────┘       └─────────────┘
                             │
                             ▼
                      ┌─────────────┐
                      │ Server App  │
                      │ (Delivery)  │
                      └─────────────┘
```

## Critical Integration Points

### 1. Worker Account Creation (Counter App → Server App)

**Counter App Must Create:**

```typescript
// Step 1: Create Supabase Auth user
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: username, // e.g., 'john.doe@restaurant.local'
  password: userPassword,
  options: {
    data: {
      full_name: fullName,
      role: role
    }
  }
});

// Step 2: Create user profile
const { error: profileError } = await supabase
  .from('user_profiles')
  .insert({
    id: authData.user.id,
    full_name: fullName,
    username: username,
    worker_id: workerId, // optional
    is_active: true
  });

// Step 3: Assign role
const { error: roleError } = await supabase
  .from('user_roles')
  .insert({
    user_id: authData.user.id,
    role: role // 'server', 'cook', or 'manager'
  });
```

**Server App Will:**
- Fetch all active workers
- Display them in sign-in list
- Authenticate using the email/password

### 2. Order Creation (Counter App → Kitchen & Server Apps)

**Counter App Must Create Orders With:**

```typescript
interface OrderCreate {
  status: 'pending'; // Always start as pending
  order_type: 'dine-in' | 'takeout' | 'delivery';
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    modifiers?: string; // Special instructions
  }>;
  customer_name?: string;
  payment_method?: 'cash' | 'momo' | 'card' | 'split';
  cash_received?: number;
  momo_received?: number;
  total_paid: number;
  created_by: string; // Counter worker's user_id
  created_at: timestamp; // Auto-generated
}
```

**Example Order Creation:**
```typescript
const { data, error } = await supabase
  .from('orders')
  .insert({
    status: 'pending',
    order_type: 'dine-in',
    items: [
      {
        id: 'item-1',
        name: 'Jollof Rice with Chicken',
        quantity: 2,
        price: 25.00,
        modifiers: 'Extra spicy'
      },
      {
        id: 'item-2',
        name: 'Fried Plantains',
        quantity: 1,
        price: 8.00
      }
    ],
    customer_name: 'Table 5',
    payment_method: 'cash',
    cash_received: 60.00,
    total_paid: 58.00,
    created_by: currentCounterWorker.id
  })
  .select()
  .single();
```

### 3. Order Status Updates (Kitchen App)

**Kitchen App Responsibilities:**

```typescript
// When starting to cook
await supabase
  .from('orders')
  .update({ status: 'preparing' })
  .eq('id', orderId);

// When food is ready
await supabase
  .from('orders')
  .update({
    status: 'ready',
    ready_at: new Date().toISOString()
  })
  .eq('id', orderId);
```

**Status Flow:**
- `pending` → Kitchen sees new order
- `preparing` → Kitchen is cooking
- `ready` → Server can claim and deliver
- `served` → Server marks as delivered (Server App)

### 4. Real-time Subscriptions

**All Apps Should Subscribe:**

```typescript
// Subscribe to order changes
const subscription = supabase
  .channel('orders')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'orders' },
    (payload) => {
      // Refresh order list
      fetchOrders();
    }
  )
  .subscribe();
```

**Important:** All three apps must use the same channel name for consistency.

## Database Schema Requirements

### Essential Tables

#### user_profiles
```sql
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  full_name text,
  username text UNIQUE NOT NULL,
  worker_id text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

#### user_roles
```sql
CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) NOT NULL,
  role text CHECK (role IN ('server', 'cook', 'manager')),
  UNIQUE(user_id, role)
);
```

#### orders
```sql
CREATE TABLE orders (
  id serial PRIMARY KEY,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'served', 'completed', 'delivered')),
  order_type text DEFAULT 'dine-in' CHECK (order_type IN ('dine-in', 'takeout', 'delivery')),
  items jsonb NOT NULL DEFAULT '[]',
  customer_name text,
  payment_method text,
  total_paid numeric(10, 2),
  created_by uuid REFERENCES user_profiles(id),
  claimed_by uuid REFERENCES user_profiles(id),
  claimed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  ready_at timestamptz
);
```

#### worker_shifts (Server App Only)
```sql
CREATE TABLE worker_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) NOT NULL,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  amount_taken_float numeric(10, 2),
  amount_returned_float numeric(10, 2),
  notes text,
  created_at timestamptz DEFAULT now()
);
```

## RLS Policies Coordination

### Critical: All Apps Must Respect RLS

**Counter App:**
- Can create orders
- Can create user profiles
- Can read all workers

**Kitchen App:**
- Can read all orders
- Can update order status (pending → preparing → ready)
- Cannot modify user profiles

**Server App:**
- Can read all orders
- Can claim orders (set claimed_by)
- Can update status (ready → served)
- Can manage own shifts
- Can read own profile

### Example RLS Policy Check

```sql
-- Test if current user can update order
SELECT * FROM orders
WHERE id = 123
AND (
  claimed_by = auth.uid() OR
  claimed_by IS NULL OR
  auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'manager')
);
```

## Testing Integration

### Test Scenario 1: Complete Order Flow

1. **Counter App:** Create worker "John Doe" with password "test123"
2. **Server App:** Sign in as "John Doe" with password "test123" ✓
3. **Counter App:** Create order #1 with items
4. **Kitchen App:** See order #1 appear in real-time ✓
5. **Kitchen App:** Mark order #1 as "preparing"
6. **Server App:** See status update in real-time ✓
7. **Kitchen App:** Mark order #1 as "ready"
8. **Server App:** Claim order #1
9. **Server App:** Mark order #1 as "served"
10. **All Apps:** See final status ✓

### Test Scenario 2: Float Management

1. **Server App:** Sign in as server
2. **Server App:** Take float of $100
3. **Counter App:** Create cash orders
4. **Server App:** Return float of $150
5. **Server App:** Sign out (ends shift)
6. **Verify:** Float difference = $50 (sales) ✓

### Test Scenario 3: Concurrent Access

1. **Multiple Server Apps:** Open in different browsers
2. **Counter App:** Create order
3. **Server App 1:** Claim order
4. **Server App 2:** Should not be able to claim same order ✓
5. **Verify:** Only one claimed_by value ✓

## Common Integration Issues

### Issue 1: Workers Not Appearing in Server App

**Cause:** Counter App didn't create proper user profile

**Fix:**
```sql
-- Check if profile exists
SELECT * FROM user_profiles WHERE username = 'john.doe@restaurant.local';

-- Check if active
SELECT * FROM user_profiles WHERE is_active = true;
```

### Issue 2: Authentication Fails

**Cause:** Username/email mismatch

**Fix:** Ensure Counter App uses email field for username:
```typescript
const username = 'john.doe@restaurant.local'; // Must be email format
```

### Issue 3: Orders Not Syncing

**Cause:** Real-time subscription not established

**Fix:**
```typescript
// Check subscription status
const channel = supabase.channel('orders');
console.log(channel.state); // Should be 'joined'
```

### Issue 4: Cannot Update Order Status

**Cause:** RLS policy blocking update

**Fix:**
```sql
-- Check current user's permissions
SELECT current_user, auth.uid();

-- Verify order ownership
SELECT * FROM orders WHERE id = 123 AND (claimed_by = auth.uid() OR claimed_by IS NULL);
```

## Performance Considerations

### Optimize for Real-time Updates

**Do:**
- Subscribe to specific table changes only
- Use filters to reduce payload size
- Unsubscribe when component unmounts
- Implement debouncing for rapid updates

**Don't:**
- Subscribe to all database changes
- Fetch entire table on each update
- Leave subscriptions active indefinitely
- Poll database repeatedly

### Database Indexing

**Ensure these indexes exist:**
```sql
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_claimed_by ON orders(claimed_by);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_user_profiles_is_active ON user_profiles(is_active);
```

## Deployment Coordination

### Recommended Deployment Order

1. **Deploy Database Schema** - Run migrations once
2. **Deploy Counter App** - Create worker accounts
3. **Deploy Server App** - Workers can sign in
4. **Deploy Kitchen App** - Complete the workflow
5. **Test Integration** - Run full order flow

### Environment Variables

**All apps must use the same:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**Keep separate:**
- App-specific features
- UI customization
- Business logic

## Monitoring and Debugging

### What to Monitor

**Counter App:**
- Worker creation success rate
- Order creation errors
- Payment processing issues

**Kitchen App:**
- Order processing time
- Status update failures
- Subscription connection drops

**Server App:**
- Sign-in success/failure rate
- Float discrepancies
- Order claim conflicts

### Debug Checklist

- [ ] All apps using same Supabase URL
- [ ] All apps using same anon key
- [ ] Database schema matches all apps
- [ ] RLS policies allow necessary operations
- [ ] Real-time subscriptions active
- [ ] Worker accounts exist in auth.users
- [ ] User profiles created in user_profiles
- [ ] Roles assigned in user_roles

## Support and Maintenance

### Regular Tasks

**Daily:**
- Monitor error logs
- Check order flow completion
- Verify shift reconciliations

**Weekly:**
- Review float discrepancies
- Check authentication failures
- Update worker accounts

**Monthly:**
- Analyze performance metrics
- Review RLS policy effectiveness
- Update documentation

### Troubleshooting Contact Points

1. Check application logs
2. Review Supabase dashboard
3. Test real-time subscriptions
4. Verify database queries
5. Consult integration documentation

## Future Enhancements

### Planned Features

- **Manager Dashboard** - View all apps in one place
- **Reporting System** - Sales, shifts, and performance
- **Notification System** - Push alerts for orders
- **Offline Mode** - Queue operations when offline
- **Analytics** - Track metrics across all apps

### API Considerations

If building additional integrations:
- Use Edge Functions for complex operations
- Maintain consistent data structures
- Document all API endpoints
- Version API changes carefully
- Test backward compatibility
