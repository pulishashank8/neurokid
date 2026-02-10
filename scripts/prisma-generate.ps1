# Run this script when "npx prisma generate" fails with EPERM on Windows.
# Close Cursor (or at least stop the dev server and all terminals), then run:
#   powershell -ExecutionPolicy Bypass -File scripts\prisma-generate.ps1
# Or from PowerShell: .\scripts\prisma-generate.ps1

Set-Location $PSScriptRoot\..

# Remove old engine and temp files so Prisma can write fresh
$clientPath = "node_modules\.prisma\client"
if (Test-Path "$clientPath\query_engine-windows.dll.node") {
  Remove-Item "$clientPath\query_engine-windows.dll.node" -Force -ErrorAction SilentlyContinue
}
Get-ChildItem "$clientPath\query_engine-windows.dll.node.tmp*" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue

npx prisma generate
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "If you still see EPERM: close Cursor completely, open a new PowerShell, cd to the project, run: npx prisma generate" -ForegroundColor Yellow
  exit 1
}
Write-Host "Prisma client generated successfully." -ForegroundColor Green
exit 0
