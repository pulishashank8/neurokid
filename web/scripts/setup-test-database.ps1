# Setup Test Database for NeuroKind
# This script creates the test database and runs migrations

Write-Host "🚀 Setting up NeuroKind Test Database..." -ForegroundColor Cyan
Write-Host ""

# Database configuration
$PGUSER = "postgres"
$PGPASSWORD = "Chowdary"
$PGHOST = "localhost"
$PGPORT = "5432"
$TESTDB = "neurokind_test"

# Set PostgreSQL password environment variable
$env:PGPASSWORD = $PGPASSWORD

# Find PostgreSQL bin directory
$pgPaths = @(
    "C:\Program Files\PostgreSQL\18\bin",
    "C:\Program Files\PostgreSQL\17\bin",
    "C:\Program Files\PostgreSQL\16\bin",
    "C:\Program Files\PostgreSQL\15\bin",
    "C:\Program Files (x86)\PostgreSQL\18\bin",
    "C:\Program Files (x86)\PostgreSQL\17\bin"
)

$psqlPath = $null
foreach ($path in $pgPaths) {
    if (Test-Path "$path\psql.exe") {
        $psqlPath = "$path\psql.exe"
        Write-Host "✅ Found PostgreSQL at: $path" -ForegroundColor Green
        break
    }
}

if (-not $psqlPath) {
    Write-Host "❌ PostgreSQL not found in standard locations" -ForegroundColor Red
    Write-Host "Please ensure PostgreSQL is installed" -ForegroundColor Yellow
    exit 1
}

# Check if database exists
Write-Host "Checking if test database exists..." -ForegroundColor Yellow
$dbExists = & $psqlPath -U $PGUSER -h $PGHOST -p $PGPORT -lqt | Select-String -Pattern $TESTDB

if ($dbExists) {
    Write-Host "✅ Database '$TESTDB' already exists" -ForegroundColor Green
} else {
    Write-Host "Creating database '$TESTDB'..." -ForegroundColor Yellow
    & $psqlPath -U $PGUSER -h $PGHOST -p $PGPORT -c "CREATE DATABASE $TESTDB;"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database created successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to create database" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Running Prisma migrations on test database..." -ForegroundColor Yellow

# Set environment variable and run migrations
$env:DATABASE_URL = "postgresql://$PGUSER:$PGPASSWORD@$PGHOST:$PGPORT/$TESTDB"

try {
    npx prisma migrate deploy
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migrations completed successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Migrations had some issues" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Failed to run migrations: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Test database setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "You can now run tests with:" -ForegroundColor Cyan
Write-Host "  npm run test" -ForegroundColor White
Write-Host ""
