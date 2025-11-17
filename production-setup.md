# Production Setup for Gloop

## 1. Clean Up Test Data
Run this SQL in your Supabase SQL Editor:
```sql
-- Delete all test data
DELETE FROM gloops;
DELETE FROM invite_links;  
DELETE FROM users;
```

## 2. Supabase Security Settings
Go to Supabase Dashboard → Settings → API:
- **Enable Row Level Security** on all tables (should already be enabled)
- **Verify RLS policies** are active for public access
- Check that your **anon key** is properly configured

## 3. Deploy to Vercel Production
Your app is already connected to GitHub. To get a production domain:

### Option A: Use Vercel's Free Domain
1. Go to vercel.com/dashboard
2. Find your Gloop project
3. Click on it → Settings → Domains
4. Your app is available at: `gloop-app-<random-id>.vercel.app`

### Option B: Add Custom Domain (Recommended)
1. Buy a domain (like `gloop.app` or `mygloop.com`)
2. In Vercel Dashboard → Your Project → Settings → Domains
3. Add your custom domain
4. Follow Vercel's DNS configuration instructions

## 4. Environment Variables (Already Configured)
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY

## 5. Security Headers (Now Added)
✅ X-Frame-Options: DENY
✅ X-Content-Type-Options: nosniff  
✅ Referrer-Policy: strict-origin-when-cross-origin
✅ Permissions-Policy restrictions

## 6. Final Steps
1. Test all functionality on production
2. Share the production URL with users
3. Monitor usage in Vercel Analytics & Supabase Dashboard

## Production URL
Once deployed, share this URL: `https://your-domain.vercel.app`