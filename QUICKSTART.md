# Quick Start Guide - Server App

## For Developers

### Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# App runs at http://localhost:5173
```

### Environment Setup

Create `.env` file:
```
VITE_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Build for Production

```bash
# Type check
npm run typecheck

# Build
npm run build

# Preview build
npm run preview
```

## For Deployment

### Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repo
5. Add environment variables
6. Click "Deploy"
7. Done! ✅

### Environment Variables in Vercel

```
VITE_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

## For Managers

### Creating Worker Accounts (via Counter App)

Workers must be created by the Counter App before they can use the Server App.

**Required Information:**
- Full name (e.g., "John Doe")
- Username (e.g., "john.doe")
- Password (min 6 characters)
- Role (server, cook, or manager)

**Counter App will handle:**
- Creating Supabase Auth user
- Creating user profile
- Assigning role
- Setting password

### First-Time Setup

1. Deploy Server App to Vercel
2. Deploy Counter App
3. Create worker accounts in Counter App
4. Test sign-in in Server App
5. Train workers on app usage

## For Workers

### How to Sign In

1. Open Server App on your device
2. Find your name in the list
3. Tap your name
4. Enter your password
5. Tap "Start Shift"

### Managing Your Float

**Taking Float:**
1. Sign in
2. Go to "Float" tab
3. Enter amount (e.g., 100.00)
4. Tap "Take Float"

**Returning Float:**
1. Go to "Float" tab
2. Enter return amount
3. Tap "Return Float & End Shift"
4. You'll be signed out automatically

### Handling Orders

**Viewing Orders:**
1. Sign in
2. Go to "Orders" tab
3. Switch between "All Orders" and "My Orders"

**Claiming an Order:**
1. Find unclaimed order
2. Tap "Claim Order"
3. Order is now assigned to you

**Marking Order as Served:**
1. Deliver food to customer
2. Find order in "My Orders"
3. Tap "Mark served"

### Signing Out

1. Tap profile icon in top-right
2. Tap sign-out icon
3. Your shift will end automatically

## Troubleshooting

### Can't See Any Workers
- Counter App hasn't created workers yet
- Contact your manager

### Can't Sign In
- Check password (case-sensitive)
- Make sure you selected correct name
- Contact manager if issue persists

### Orders Not Showing
- Counter App hasn't created any orders yet
- Check internet connection
- Try refreshing by pulling down

### Float Not Saving
- Check internet connection
- Make sure you entered valid amount
- Try again or contact manager

## Support

### For Technical Issues
- Check documentation files
- Review error messages
- Contact IT support

### For Account Issues
- Contact manager
- Manager uses Counter App to reset

## Key Features

✅ Real-time order updates
✅ Secure password authentication
✅ Cash float tracking
✅ Shift management
✅ Order claiming
✅ Mobile-friendly design

## Important Notes

- Always return float before signing out
- Claim orders only when ready to serve
- Check "My Orders" regularly
- Report any issues immediately
- Keep app updated

## Files Overview

- `DEPLOYMENT.md` - Full deployment guide
- `ECOSYSTEM_INTEGRATION.md` - How apps work together
- `COUNTER_APP_REQUIREMENTS.md` - What Counter App must do
- `PRODUCTION_READY.md` - Production readiness checklist
- `QUICKSTART.md` - This file

## Questions?

Check the appropriate guide:
- **Developers** → `DEPLOYMENT.md`
- **Integration** → `ECOSYSTEM_INTEGRATION.md`
- **Counter Team** → `COUNTER_APP_REQUIREMENTS.md`
- **Production** → `PRODUCTION_READY.md`
