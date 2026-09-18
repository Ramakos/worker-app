# Counter App Requirements for Server App Integration

## Critical: Worker Account Creation

The Server App **depends entirely** on the Counter App to create worker accounts. Without worker accounts, the Server App cannot function.

## Worker Creation Requirements

### 1. Supabase Auth User

Create a user in Supabase Auth with email format username:

```typescript
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: `${username}@restaurant.local`, // Must be email format
  password: password,
});
```

**Important:**
- Username must be in email format (e.g., `john.doe@restaurant.local`)
- Store the user ID from `authData.user.id`
- Password should be set by manager or worker during creation

### 2. User Profile Entry

Create corresponding profile in `user_profiles` table:

```typescript
const { error: profileError } = await supabase
  .from('user_profiles')
  .insert({
    id: authData.user.id, // MUST match auth.users.id
    full_name: 'John Doe', // Server App displays this
    username: 'john.doe@restaurant.local', // Used for authentication
    worker_id: 'EMP001', // Optional employee ID
    is_active: true, // Must be true to appear in Server App
  });
```

**Required Fields:**
- `id` - UUID from Supabase Auth
- `username` - Must match email from auth.users
- `full_name` - Displayed in Server App sign-in screen

**Optional Fields:**
- `worker_id` - Employee/worker ID for internal tracking

### 3. Role Assignment

Assign role in `user_roles` table:

```typescript
const { error: roleError } = await supabase
  .from('user_roles')
  .insert({
    user_id: authData.user.id, // Same user ID
    role: 'server', // or 'cook', 'manager'
  });
```

**Valid Roles:**
- `server` - Can claim and serve orders
- `cook` - Can update order status in Kitchen App
- `manager` - Has full access across all apps

### Complete Worker Creation Example

```typescript
async function createWorker(fullName: string, username: string, password: string, role: 'server' | 'cook' | 'manager') {
  try {
    // Step 1: Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: `${username}@restaurant.local`,
      password: password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user');

    const userId = authData.user.id;

    // Step 2: Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        full_name: fullName,
        username: `${username}@restaurant.local`,
        is_active: true,
      });

    if (profileError) throw profileError;

    // Step 3: Assign role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: role,
      });

    if (roleError) throw roleError;

    return { success: true, userId };
  } catch (error) {
    console.error('Error creating worker:', error);
    return { success: false, error };
  }
}

// Usage
await createWorker('John Doe', 'john.doe', 'secure123', 'server');
```

## Order Creation Requirements

### Order Structure

```typescript
interface Order {
  status: 'pending'; // Always start as pending
  order_type: 'dine-in' | 'takeout' | 'delivery';
  items: OrderItem[];
  customer_name?: string;
  payment_method?: 'cash' | 'momo' | 'card' | 'split';
  cash_received?: number;
  momo_received?: number;
  total_paid: number;
  created_by: string; // Counter worker's user_id
}

interface OrderItem {
  id: string; // Unique ID for this item in order
  name: string; // Menu item name
  quantity: number;
  price: number; // Unit price
  modifiers?: string; // Special instructions/customizations
}
```

### Order Creation Example

```typescript
async function createOrder(customerId: string, items: OrderItem[], paymentMethod: string) {
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const { data, error } = await supabase
    .from('orders')
    .insert({
      status: 'pending',
      order_type: 'dine-in',
      items: items,
      customer_name: customerId, // e.g., "Table 5"
      payment_method: paymentMethod,
      total_paid: total,
      created_by: currentCounterWorker.id, // Counter staff ID
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating order:', error);
    return null;
  }

  return data;
}

// Usage
const orderItems = [
  {
    id: 'item-1',
    name: 'Jollof Rice with Chicken',
    quantity: 2,
    price: 25.00,
    modifiers: 'Extra spicy, no vegetables'
  },
  {
    id: 'item-2',
    name: 'Fresh Orange Juice',
    quantity: 1,
    price: 5.00
  }
];

await createOrder('Table 5', orderItems, 'cash');
```

## UI Requirements for Counter App

### Worker Management Screen

Should include:
- [ ] Create new worker form
- [ ] Full name input
- [ ] Username input (auto-append @restaurant.local)
- [ ] Password input (with visibility toggle)
- [ ] Role selection dropdown
- [ ] Optional worker ID field
- [ ] Active/Inactive toggle
- [ ] Save button

### Example UI Flow

```
┌─────────────────────────────────────┐
│   Create New Worker                 │
├─────────────────────────────────────┤
│ Full Name: [John Doe            ]  │
│ Username:  [john.doe] @restaurant.local │
│ Password:  [••••••••] [👁]         │
│ Role:      [Server ▼]               │
│ Worker ID: [EMP001    ] (optional)  │
│ Status:    [●] Active               │
│                                     │
│        [Cancel]  [Create Worker]    │
└─────────────────────────────────────┘
```

## Testing Checklist

After creating a worker in Counter App, verify:

- [ ] Worker appears in Server App sign-in list
- [ ] Worker's full name displays correctly
- [ ] Worker can sign in with password
- [ ] Sign-in creates a shift record
- [ ] Worker sees dashboard after sign-in
- [ ] Worker role displays correctly

## Common Issues and Solutions

### Issue: Worker doesn't appear in Server App

**Possible Causes:**
1. `is_active` flag is false
2. User profile not created
3. Username doesn't match email in auth.users

**Solution:**
```sql
-- Check if profile exists and is active
SELECT * FROM user_profiles WHERE username = 'john.doe@restaurant.local';

-- Activate worker if needed
UPDATE user_profiles SET is_active = true WHERE username = 'john.doe@restaurant.local';
```

### Issue: Authentication fails in Server App

**Possible Causes:**
1. Password incorrect
2. Email format wrong in auth.users
3. User not in auth.users table

**Solution:**
```sql
-- Check if auth user exists
SELECT email FROM auth.users WHERE email = 'john.doe@restaurant.local';

-- Reset password if needed (admin function)
```

### Issue: Worker role not showing correctly

**Possible Cause:**
Role not assigned in user_roles table

**Solution:**
```sql
-- Check role assignment
SELECT * FROM user_roles WHERE user_id = '<user-uuid>';

-- Add role if missing
INSERT INTO user_roles (user_id, role) VALUES ('<user-uuid>', 'server');
```

## Data Validation

### Before Creating Worker

```typescript
function validateWorkerData(fullName: string, username: string, password: string) {
  const errors = [];

  if (!fullName || fullName.trim().length < 2) {
    errors.push('Full name must be at least 2 characters');
  }

  if (!username || username.trim().length < 3) {
    errors.push('Username must be at least 3 characters');
  }

  if (username.includes('@')) {
    errors.push('Username should not include @ symbol');
  }

  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  return errors;
}
```

## Security Considerations

### Password Requirements

Recommend enforcing:
- Minimum 6 characters (8+ is better)
- Mix of letters and numbers
- No common passwords
- Change password on first login (optional)

### Worker Deactivation

Instead of deleting workers:

```typescript
async function deactivateWorker(userId: string) {
  const { error } = await supabase
    .from('user_profiles')
    .update({ is_active: false })
    .eq('id', userId);

  if (error) {
    console.error('Error deactivating worker:', error);
    return false;
  }

  return true;
}
```

**Benefits:**
- Preserves historical data
- Can reactivate if needed
- Maintains referential integrity

## Database Permissions

Counter App needs permission to:
- Insert into `user_profiles`
- Insert into `user_roles`
- Update `user_profiles` (for activation/deactivation)
- Read from `user_profiles` (to display worker list)

Ensure RLS policies allow these operations for authenticated counter staff.

## Sample Test Data

For initial testing, create these workers:

```typescript
// Manager
await createWorker('Admin User', 'admin', 'admin123', 'manager');

// Servers
await createWorker('John Doe', 'john.doe', 'server123', 'server');
await createWorker('Jane Smith', 'jane.smith', 'server123', 'server');

// Cooks
await createWorker('Chef Mike', 'chef.mike', 'cook123', 'cook');
```

Then verify all appear in Server App sign-in screen.

## Support

If Server App team reports issues with worker authentication:
1. Verify worker exists in `auth.users` table
2. Check `user_profiles` entry matches
3. Confirm `is_active` is true
4. Validate `user_roles` assignment
5. Test password authentication manually

## Quick Reference SQL

```sql
-- View all active workers
SELECT
  up.full_name,
  up.username,
  ur.role,
  up.is_active
FROM user_profiles up
LEFT JOIN user_roles ur ON up.id = ur.user_id
WHERE up.is_active = true;

-- Count workers by role
SELECT role, COUNT(*)
FROM user_roles
GROUP BY role;

-- Find worker by name
SELECT * FROM user_profiles
WHERE full_name ILIKE '%john%';

-- Check if email exists in auth
SELECT email FROM auth.users
WHERE email = 'john.doe@restaurant.local';
```

## Summary

The Counter App is the **single source of truth** for worker accounts. The Server App cannot create, edit, or manage workers - it only authenticates them. Please ensure proper worker creation before deploying the Server App to production.
