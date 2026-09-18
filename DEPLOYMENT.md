# Restaurant Server App - Production Deployment Guide

## Overview

This is the **Server/Waiter App** for the Restaurant Hub ecosystem. It's designed to work alongside the Counter App and Kitchen App, sharing the same Supabase database.

## Current Status

✅ **Completed:**
- Authentication system integrated with Supabase Auth
- Worker profiles fetched from database
- Password authentication with proper error handling
- Real-time order tracking and claiming
- Float management for cash handling
- Session management and persistence
- TypeScript type checking passed
- Production build successful
- Deployment configuration ready

⚠️ **Requires Counter App:**
- Worker accounts must be created by the Counter App
- No workers exist in database yet (counter app will create them)
- Authentication uses email/password set up by Counter App

## Architecture

### Database Schema (Already Applied)
The following tables are created and ready:
- `user_profiles` - Worker information
- `user_roles` - Worker roles (server, cook, manager)
- `worker_shifts` - Shift and float tracking
- `orders` - Order management and tracking

All tables have Row Level Security (RLS) enabled.

### Authentication Flow
1. App fetches all active workers from `user_profiles` table
2. Worker selects their name from the list
3. Worker enters password (set by Counter App during account creation)
4. App authenticates with Supabase Auth using username as email
5. On success, creates a new shift record and grants access

### Integration with Counter App
The Counter App is responsible for:
- Creating worker accounts in Supabase Auth
- Creating corresponding entries in `user_profiles` table
- Assigning roles in `user_roles` table
- Setting worker passwords
- Creating orders that servers can claim

## Deployment to Vercel

### Prerequisites
1. Vercel account (free tier works)
2. GitHub repository with this code
3. Supabase project with database schema applied

### Step 1: Connect to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect the Vite framework

### Step 2: Configure Environment Variables
Add these environment variables in Vercel:

```
VITE_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Deploy
1. Click "Deploy"
2. Wait for build to complete (2-3 minutes)
3. Your app will be live at `https://your-project.vercel.app`

### Step 4: Custom Domain (Optional)
1. Go to Project Settings > Domains
2. Add your custom domain
3. Follow DNS configuration instructions

## Post-Deployment Setup

### 1. Create Worker Accounts (Counter App Required)
The Counter App must create worker accounts with:
- Email/username (e.g., `john.doe@restaurant.local`)
- Password
- Full name
- Role (server, cook, or manager)
- Worker ID (optional)

Example worker creation flow in Counter App:
```sql
-- Create auth user
INSERT INTO auth.users (email, encrypted_password)
VALUES ('john.doe@restaurant.local', crypt('password123', gen_salt('bf')));

-- Create profile
INSERT INTO user_profiles (id, full_name, username, is_active)
VALUES (auth_user_id, 'John Doe', 'john.doe@restaurant.local', true);

-- Assign role
INSERT INTO user_roles (user_id, role)
VALUES (auth_user_id, 'server');
```

### 2. Test Authentication
1. Open the deployed Server App
2. You should see worker names listed
3. Select a worker and enter their password
4. Click "Start Shift"
5. Should navigate to dashboard

### 3. Verify Real-time Sync
1. Have Counter App create an order
2. Order should appear in Server App immediately
3. Claim an order in Server App
4. Status should update across all apps

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Public anon key from Supabase | `eyJhbGci...` |

## Troubleshooting

### No Workers Showing
- Counter App hasn't created any workers yet
- Check `is_active` flag in `user_profiles` table
- Verify database connection with Supabase

### Authentication Failed
- Password incorrect (set by Counter App)
- User not in Supabase Auth
- Check browser console for errors

### Orders Not Appearing
- Counter App hasn't created any orders yet
- Real-time subscriptions not working (check Supabase logs)
- RLS policies preventing access

### Build Failures
```bash
# Run locally to debug
npm run build

# Check TypeScript errors
npm run typecheck

# Verify environment variables
cat .env
```

## Ecosystem Integration

### Counter App Responsibilities
- Create and manage worker accounts
- Create orders with proper structure
- Process payments
- Generate receipts

### Kitchen App Responsibilities
- View orders with status 'pending' or 'preparing'
- Update order status to 'ready'
- Notify servers when orders are ready

### Server App Responsibilities (This App)
- Workers sign in and manage shifts
- Take and return cash floats
- Claim orders from counter
- Mark orders as 'served' when delivered
- View personal and all orders

### Order Status Flow
```
Counter: Creates order → 'pending'
Kitchen: Prepares food → 'preparing' → 'ready'
Server:  Claims order → Serves customer → 'served'
```

### Shared Order Item Structure
```json
{
  "id": "unique-id",
  "name": "Item Name",
  "quantity": 2,
  "price": 15.99,
  "modifiers": "No onions, extra sauce"
}
```

## Monitoring

### Key Metrics to Track
- Sign-in success/failure rate
- Average shift duration
- Float discrepancies (taken vs returned)
- Orders claimed per server
- Order claim conflicts

### Logs to Monitor
- Authentication errors
- Shift creation failures
- Order update conflicts
- Real-time subscription drops

## Security Considerations

✅ **Implemented:**
- Row Level Security on all tables
- Supabase Auth integration
- Session token validation
- Password visibility toggle
- Error message sanitization

⚠️ **Important:**
- Never expose service role key
- Use HTTPS only in production
- Rotate anon key if compromised
- Monitor for unusual access patterns

## Next Steps

1. **Deploy Counter App** - Create worker accounts
2. **Deploy Kitchen App** - Complete order workflow
3. **Create Test Data** - Add sample workers and orders
4. **Test Integration** - Verify all three apps sync
5. **Train Staff** - Show workers how to use the app
6. **Monitor Usage** - Track errors and performance

## Support

For issues or questions:
1. Check browser console for errors
2. Verify environment variables
3. Test database connection
4. Review Supabase logs
5. Check real-time subscription status

## Version Information

- React: 18.3.1
- Vite: 5.4.2
- Supabase JS: 2.57.4
- TypeScript: 5.5.3
- Tailwind CSS: 3.4.1
