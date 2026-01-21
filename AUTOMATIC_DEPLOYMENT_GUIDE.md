# Automatic Deployment Guide

## 🎯 Goal
Make your website **automatically update** when you push code to GitHub.

---

## 🚀 Option 1: Vercel Git Integration (Recommended)

### ✅ What This Does:
- Push code to GitHub → Vercel **automatically** builds and deploys
- No manual `vercel --prod` command needed
- Instant preview deployments for every commit
- Production deployment on `main` branch

### 📝 Setup Steps:

#### 1. **Connect Vercel to GitHub** (One-Time Setup)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Select your GitHub account
5. Find and select `neurokind` repository
6. Click **"Import"**

#### 2. **Configure Project Settings**

- **Framework Preset**: Next.js
- **Root Directory**: `web/`
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm ci` (default)

#### 3. **Add Environment Variables**

In Vercel Dashboard → Settings → Environment Variables, add:

```bash
# Required
DATABASE_URL=postgresql://...        # Supabase Transaction Pooler
DIRECT_URL=postgresql://...          # Supabase Direct Connection
NEXTAUTH_SECRET=your-secret-here     # Min 32 chars
NEXTAUTH_URL=https://your-app.vercel.app

# Optional
GROQ_API_KEY=gsk_...                # AI chat (FREE tier)
GOOGLE_PLACES_API_KEY=AIza...       # Provider search
GOOGLE_CLIENT_ID=...                 # OAuth
GOOGLE_CLIENT_SECRET=...             # OAuth
REDIS_URL=redis://...                # Rate limiting persistence
```

#### 4. **Deploy**

Click **"Deploy"** and Vercel will build and deploy your app.

---

### 🔄 How It Works After Setup:

```bash
# 1. Make changes to your code (UI, features, etc.)
code .

# 2. Commit and push to GitHub
git add .
git commit -m "Updated homepage UI"
git push origin main

# 3. ✨ AUTOMATIC DEPLOYMENT ✨
# Vercel detects the push and automatically:
# - Runs build
# - Runs tests (if configured)
# - Deploys to production
# - Updates your live website

# 4. Check deployment status
# Visit: https://vercel.com/dashboard
```

**No manual deployment needed!** 🎉

---

## 🚀 Option 2: GitHub Actions Auto-Deploy

If you prefer to keep control in GitHub Actions, you can add an auto-deploy step.

### 📝 Setup Steps:

#### 1. **Get Vercel Token**

1. Go to [Vercel Settings → Tokens](https://vercel.com/account/tokens)
2. Create a new token: **"GitHub Actions Deploy"**
3. Copy the token (starts with `vercel_...`)

#### 2. **Add Secrets to GitHub**

1. Go to your GitHub repo: `https://github.com/YOUR_USERNAME/neurokind`
2. Settings → Secrets and variables → Actions
3. Click **"New repository secret"**
4. Add these secrets:
   - `VERCEL_TOKEN` = Your Vercel token
   - `VERCEL_ORG_ID` = Your Vercel org ID (find in Vercel settings)
   - `VERCEL_PROJECT_ID` = Your Vercel project ID (find in Vercel project settings)

#### 3. **Update GitHub Actions Workflow**

Add this to `.github/workflows/ci.yml`:

```yaml
# Add this new job at the end of the file
  deploy:
    name: Deploy to Vercel
    runs-on: ubuntu-latest
    needs: ci  # Only deploy if CI passes
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./web
```

---

## 🎯 Recommended Workflow

I recommend **Option 1** (Vercel Git Integration) because:

✅ **Simplest** - No GitHub secrets to manage
✅ **Fastest** - Optimized Vercel infrastructure
✅ **Preview Deploys** - Automatic preview URLs for PRs
✅ **Rollbacks** - Easy to rollback to previous deployments
✅ **Analytics** - Built-in Vercel analytics

---

## 🔄 Typical Development Workflow

Once automatic deployment is set up:

```bash
# 1. Work on a feature
git checkout -b feature/new-ui
# Make your changes...

# 2. Test locally
npm run dev

# 3. Commit and push
git add .
git commit -m "Added new homepage design"
git push origin feature/new-ui

# 4. ✨ Vercel creates a PREVIEW deployment
# You get a unique URL like:
# https://neurokind-abc123.vercel.app

# 5. Merge to main
git checkout main
git merge feature/new-ui
git push origin main

# 6. ✨ Vercel AUTOMATICALLY deploys to PRODUCTION
# Your live site at https://neurokind.vercel.app updates!
```

---

## 🐛 Troubleshooting

### Issue: Vercel deployment fails

**Check:**
1. Build logs in Vercel dashboard
2. All environment variables are set
3. `web/package.json` has correct scripts
4. Database is accessible from Vercel

### Issue: GitHub Actions fails but deployment works

**Solution:**
- GitHub Actions and Vercel are independent
- Fix CI issues in `.github/workflows/ci.yml`
- Deployment can still work via Vercel

### Issue: Changes don't appear on website

**Check:**
1. Deployment shows as "Ready" in Vercel
2. Clear browser cache (Ctrl+Shift+R)
3. Check correct domain is deployed
4. Verify changes are in `main` branch

---

## 📊 Monitoring Deployments

### Vercel Dashboard
- View all deployments: https://vercel.com/dashboard
- See build logs
- Monitor performance
- View analytics

### GitHub Commits
- Each commit shows deployment status
- ✅ Green checkmark = deployed successfully
- ❌ Red X = deployment failed

---

## 🎉 Summary

**After setup, your workflow is:**

```bash
# Local development
1. Make changes to code
2. git add . && git commit -m "Your changes"
3. git push origin main
4. ✨ Website automatically updates in ~2 minutes!
```

**No manual deployment commands needed!**

---

## ⚡ Quick Start (Choose One)

### Option 1: Vercel Git Integration
```bash
1. Visit https://vercel.com/new
2. Import your GitHub repo
3. Configure environment variables
4. Deploy

# Done! Future pushes auto-deploy.
```

### Option 2: Manual (Current Method)
```bash
cd web
vercel --prod

# This works but you have to run it every time
```

---

**Recommended**: Use Option 1 for automatic, hassle-free deployments! 🚀
