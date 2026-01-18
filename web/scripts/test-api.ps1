# NeuroKind API Smoke Tests (Windows PowerShell)
# Usage: .\scripts\test-api.ps1

$BASE_URL = "http://localhost:3000"
$passed = 0
$failed = 0

Write-Host ""
Write-Host "NeuroKind API Smoke Tests" -ForegroundColor Cyan
Write-Host ""
Write-Host ("=" * 60)

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Body = $null,
        [int]$ExpectedStatus = 200
    )
    
    Write-Host "$Name... " -NoNewline
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            UseBasicParsing = $true
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json)
            $params.ContentType = "application/json"
        }
        
        try {
            $response = Invoke-WebRequest @params -ErrorAction Stop
            $statusCode = $response.StatusCode
        } catch {
            $statusCode = $_.Exception.Response.StatusCode.value__
            if (-not $statusCode) {
                throw
            }
        }
        
        if ($statusCode -eq $ExpectedStatus) {
            Write-Host "✅" -ForegroundColor Green
            $script:passed++
        } else {
            Write-Host "❌ (Status: $statusCode, Expected: $ExpectedStatus)" -ForegroundColor Red
            $script:failed++
        }
    } catch {
        Write-Host "❌" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        $script:failed++
    }
}

# Run tests
Test-Endpoint "GET /api/health" "$BASE_URL/api/health"
Test-Endpoint "GET /api/categories" "$BASE_URL/api/categories"
Test-Endpoint "GET /api/tags" "$BASE_URL/api/tags"
Test-Endpoint "GET /api/posts" "$BASE_URL/api/posts?limit=5"
Test-Endpoint "GET /api/posts?sort=new" "$BASE_URL/api/posts?limit=5&sort=new"
Test-Endpoint "GET /api/posts?sort=top" "$BASE_URL/api/posts?limit=5&sort=top"
Test-Endpoint "GET /api/posts?sort=hot" "$BASE_URL/api/posts?limit=5&sort=hot"
Test-Endpoint "POST /api/posts (unauthorized)" "$BASE_URL/api/posts" -Method "POST" -Body @{title="Test"; content="Test content"; categoryId="test"} -ExpectedStatus 401
Test-Endpoint "GET /api/auth/session" "$BASE_URL/api/auth/session"
Test-Endpoint "GET /api/auth/csrf" "$BASE_URL/api/auth/csrf"

Write-Host ("=" * 60)

$color = if ($failed -eq 0) { "Green" } else { "Yellow" }
Write-Host ""
Write-Host "Results: $passed passed, $failed failed" -ForegroundColor $color
Write-Host ""

if ($failed -gt 0) {
    exit 1
}
