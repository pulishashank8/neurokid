# Quick Vercel Deployment Guide

## Step 1: Add Environment Variable to Vercel

### Option A: Via Dashboard (Easiest)
1. Go to: **https://vercel.com**
2. Select your **neurokid** project
3. Click **Settings** → **Environment Variables**
4. Add new variable:
   - **Name**: `RESEND_API_KEY`
   - **Value**: (paste your `re_...` key from `.env.local`)
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development
5. Click **Save**

### Option B: Via CLI
```bash
# From the /web directory
npx vercel env add RESEND_API_KEY production
# Paste your API key when prompted
# Answer "yes" to mark as sensitive
```

---

## Step 2: Deploy to Production

Once the env var is added, deploy:

```bash
npx vercel deploy --prod --yes
```

---

## ✅ What This Deploys

Your production site will now have:
- ✅ Email verification with OTP
- ✅ 3-step registration flow
- ✅ NeuroKid branding (complete rebrand)
- ✅ Emerald/Teal color scheme
- ✅ All latest UI improvements

---

## 📧 Email Sender

**Current**: `NeuroKid <onboarding@resend.dev>`
**After domain verification**: `NeuroKid <noreply@yourdomain.com>`

See `CUSTOM_DOMAIN_EMAIL.md` for domain setup.
