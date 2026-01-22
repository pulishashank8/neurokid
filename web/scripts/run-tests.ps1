$env:PGPASSWORD = "Chowdary"
$pgPath = "C:\Program Files\PostgreSQL\18\bin"

Write-Host "Creating test database..." -ForegroundColor Cyan

try {
    & "$pgPath\createdb.exe" -U postgres neurokind_test 2>&1 | Out-Null
    Write-Host "Database created successfully!" -ForegroundColor Green
} catch {
    if ($_ -match "already exists") {
        Write-Host "Database already exists - continuing..." -ForegroundColor Yellow
    } else {
        Write-Host "Error: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Running migrations..." -ForegroundColor Cyan
$env:DATABASE_URL = "postgresql://postgres:Chowdary@localhost:5432/neurokind_test"

cd $PSScriptRoot\..
npx prisma migrate deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Migration completed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Running tests..." -ForegroundColor Cyan
    npm run test
} else {
    Write-Host "Migration failed!" -ForegroundColor Red
    exit 1
}
