# Automated Vercel Deployment Script
# Run this after initial `vercel login`

Write-Host "🚀 Deploying NeuroKind to Vercel..." -ForegroundColor Green

# Check if logged in
Write-Host "`n📋 Step 1: Checking Vercel authentication..." -ForegroundColor Cyan
vercel whoami
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in to Vercel. Run: vercel login" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Authenticated" -ForegroundColor Green

# Deploy (first time will fail without env vars, that's expected)
Write-Host "`n📋 Step 2: Initial deployment..." -ForegroundColor Cyan
Write-Host "⚠️  First deploy may fail - that's normal without env vars" -ForegroundColor Yellow

cd C:\Users\User\neurokind\web

# Non-interactive deploy
vercel --yes --name neurokind

Write-Host "`n📋 Step 3: Next steps..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Now you need to:" -ForegroundColor Yellow
Write-Host "1. Setup database (if not done):" -ForegroundColor White
Write-Host "   → Visit https://supabase.com" -ForegroundColor Gray
Write-Host "   → Create project, copy DATABASE_URL" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Add environment variables:" -ForegroundColor White
Write-Host "   vercel env add DATABASE_URL" -ForegroundColor Gray
Write-Host "   vercel env add NEXTAUTH_URL" -ForegroundColor Gray
Write-Host "   vercel env add NEXTAUTH_SECRET" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Deploy to production:" -ForegroundColor White
Write-Host "   vercel --prod" -ForegroundColor Gray
Write-Host ""
Write-Host "📖 See VERCEL_QUICK_DEPLOY.md for detailed instructions" -ForegroundColor Cyan
