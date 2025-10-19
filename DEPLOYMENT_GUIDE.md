# 🚀 Kirana Store - Deployment Guide

## Prerequisites
- Node.js 18+ installed
- Supabase project created
- Git installed
- Vercel/Netlify account (optional)

## Step 1: Environment Setup

Create `.env` file in project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Database Migration

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy contents of `DATABASE_MIGRATION.sql`
4. Paste and run the script
5. Verify all columns were added successfully

### Alternative: Manual Setup

If the script fails, manually add these columns:

```sql
-- Products
ALTER TABLE products ADD COLUMN supplier_name TEXT;

-- Sales
ALTER TABLE sales ADD COLUMN customer_name TEXT;

-- Sale Items
ALTER TABLE sale_items ADD COLUMN product_name TEXT;

-- Purchases
ALTER TABLE purchases ADD COLUMN supplier_name TEXT;

-- Expenses
ALTER TABLE expenses ADD COLUMN category TEXT;
```

## Step 4: Test Locally

```bash
npm run dev
```

Open `http://localhost:5173` and test:
1. Register a new account
2. Login
3. Add a product
4. Create a sale
5. Check PDF generation
6. Verify toast notifications

## Step 5: Build for Production

```bash
npm run build
```

This creates a `dist/` folder with optimized files.

## Step 6: Deploy to Vercel

### Option A: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# For production
vercel --prod
```

### Option B: Via GitHub

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repository
5. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Deploy!

## Step 7: Deploy to Netlify

### Option A: Drag & Drop

1. Build the project: `npm run build`
2. Go to [netlify.com](https://netlify.com)
3. Drag the `dist/` folder
4. Add environment variables in Site Settings

### Option B: Via Netlify CLI

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy

# For production
netlify deploy --prod
```

### Build Settings:
- **Build command:** `npm run build`
- **Publish directory:** `dist`

## Step 8: Post-Deployment Checklist

- [ ] Test registration flow
- [ ] Test login with different roles
- [ ] Create products
- [ ] Record sales (check PDF generation)
- [ ] Verify stock auto-update
- [ ] Check charts display
- [ ] Test on mobile devices
- [ ] Verify toast notifications
- [ ] Test forgot password
- [ ] Check role-based access

## Step 9: Configure Custom Domain (Optional)

### Vercel:
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

### Netlify:
1. Go to Site Settings → Domain Management
2. Add custom domain
3. Configure DNS

## Step 10: Enable Analytics (Optional)

### Google Analytics:

Add to `index.html` before `</head>`:

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Vercel Analytics:

```bash
npm i @vercel/analytics
```

Add to `src/main.tsx`:
```tsx
import { inject } from '@vercel/analytics';
inject();
```

## Troubleshooting

### Issue: White screen after deployment

**Solution:** Check browser console for errors. Usually missing environment variables.

```bash
# Verify env vars are set
vercel env ls
# or
netlify env:list
```

### Issue: Database errors

**Solution:** Ensure migration script ran successfully. Check Supabase logs.

### Issue: PDF not downloading

**Solution:** Check jsPDF is installed. Verify browser allows downloads.

### Issue: Toast not showing

**Solution:** Ensure react-hot-toast is installed and Toaster component is in App.tsx

### Issue: Authentication not working

**Solution:** Check Supabase URL and anon key in environment variables.

## Performance Optimization

### 1. Enable Compression

Vercel and Netlify automatically enable gzip compression.

### 2. Add PWA Support (Optional)

```bash
npm i vite-plugin-pwa -D
```

Update `vite.config.ts`:
```ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Kirana Store',
        short_name: 'Kirana',
        description: 'Kirana Store Management System',
        theme_color: '#2563eb',
      }
    })
  ]
});
```

### 3. Enable Lazy Loading

Update `src/App.tsx`:
```tsx
import { lazy, Suspense } from 'react';

const Products = lazy(() => import('./pages/Products').then(m => ({ default: m.Products })));
const Sales = lazy(() => import('./pages/SalesNew').then(m => ({ default: m.SalesNew })));

// Wrap routes with Suspense
<Suspense fallback={<div>Loading...</div>}>
  <Route path="/products" element={<Products />} />
</Suspense>
```

## Security Best Practices

1. **Never commit `.env` file**
   - Add to `.gitignore`
   
2. **Use environment variables** for all secrets

3. **Enable RLS** in Supabase (Row Level Security)

4. **Regular backups** of database

5. **Monitor logs** for suspicious activity

6. **Keep dependencies updated**
   ```bash
   npm audit
   npm audit fix
   ```

## Monitoring & Logging

### Sentry (Error Tracking)

```bash
npm i @sentry/react @sentry/tracing
```

Add to `src/main.tsx`:
```tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

### LogRocket (Session Replay)

```bash
npm i logrocket
```

## Backup Strategy

### Database Backups (Supabase)

1. Go to Database → Backups
2. Enable automatic backups
3. Download manual backup before major changes

### Code Backups

```bash
# Commit frequently
git add .
git commit -m "Feature: xyz"
git push origin main

# Tag releases
git tag -a v1.0.0 -m "Production release"
git push origin v1.0.0
```

## Scaling Considerations

### Database Optimization

1. Add indexes on frequently queried columns
2. Use connection pooling
3. Monitor slow queries
4. Archive old data

### Frontend Optimization

1. Enable code splitting
2. Use React.memo for expensive components
3. Implement virtual scrolling for large lists
4. Optimize images

### Caching Strategy

1. React Query handles API caching
2. Service Worker for offline support
3. CDN for static assets

## Support & Maintenance

### Regular Updates

```bash
# Check for updates
npm outdated

# Update packages
npm update

# Update React Query
npm install @tanstack/react-query@latest
```

### Monitor Performance

- Use Chrome DevTools Lighthouse
- Check Core Web Vitals
- Monitor bundle size

### User Feedback

- Add feedback form
- Monitor error rates
- Track feature usage

## Conclusion

Your Kirana Store app is now deployed and production-ready! 🎉

### Quick Links:
- Supabase Dashboard: `https://app.supabase.com`
- Vercel Dashboard: `https://vercel.com/dashboard`
- Netlify Dashboard: `https://app.netlify.com`

### Need Help?
- Check documentation
- Review GitHub issues
- Contact support

---

**Last Updated:** October 18, 2025  
**Version:** 2.0.0  
**Deployment Platform:** Vercel/Netlify
