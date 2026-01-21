# Custom Domain Email Setup Guide

## 🎯 Goal
Set up a professional sender email like `noreply@neurokid.com` instead of the test domain.

---

## Step 1: Verify Your Domain in Resend

### Option A: If you DON'T have a custom domain yet
**Skip this step for now** - you can continue using `onboarding@resend.dev` for free. This works perfectly fine!

### Option B: If you HAVE a custom domain (e.g., neurokid.com)

1. **Go to Resend Dashboard**
   - Visit: https://resend.com/domains
   - Click "Add Domain"

2. **Enter your domain**
   - Type: `neurokid.com` (or whatever your domain is)
   - Click "Add"

3. **Add DNS Records**
   Resend will show you 3 DNS records to add:
   
   **SPF Record:**
   ```
   Type: TXT
   Name: @
   Value: v=spf1 include:resend.com ~all
   ```

   **DKIM Record:**
   ```
   Type: TXT
   Name: resend._domainkey
   Value: [They'll give you a unique value]
   ```

   **DMARC Record (Optional but recommended):**
   ```
   Type: TXT
   Name: _dmarc
   Value: v=DMARC1; p=none; rua=mailto:your-email@neurokid.com
   ```

4. **Add records to your DNS provider**
   - Go to where you bought your domain (e.g., Namecheap, GoDaddy, Cloudflare)
   - Navigate to DNS settings
   - Add the 3 TXT records exactly as shown
   - Save changes

5. **Verify in Resend**
   - Wait 5-15 minutes for DNS propagation
   - Click "Verify" in Resend dashboard
   - Status should turn green ✅

---

## Step 2: Update Environment Variable

Once your domain is verified, add this to your `.env.local`:

```bash
EMAIL_FROM="NeuroKid <noreply@neurokid.com>"
```

**Or keep using the test domain:**
```bash
# No need to add EMAIL_FROM - it will use onboarding@resend.dev by default
```

---

## Step 3: Add to Vercel (Production)

We need to add `RESEND_API_KEY` and optionally `EMAIL_FROM` to Vercel:

### Manual Method (via Dashboard):
1. Go to: https://vercel.com/
2. Select your project → Settings → Environment Variables
3. Add:
   - `RESEND_API_KEY` = `re_your_api_key`
   - `EMAIL_FROM` = `NeuroKid <noreply@yourdomain.com>` (optional)

### CLI Method (I can do this):
Run these commands to add the env vars automatically.

---

## ⚠️ Important Notes

1. **DNS Propagation**: Can take 5-60 minutes
2. **Test Domain Works Fine**: You can skip domain verification entirely if you don't have a custom domain
3. **Free Tier**: Works even with test domain - 3,000 emails/month

---

**Ready?** Let me know:
- Do you have a custom domain?
- If yes, what is it?
- Should I add the env vars to Vercel now?
