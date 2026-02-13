@echo off
echo ========================================
echo Fixing Prisma Client Generation
echo ========================================
echo.

echo Step 1: Killing all Node.js processes...
taskkill /F /IM node.exe /T 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Step 2: Deleting .prisma folder...
rmdir /S /Q "node_modules\.prisma" 2>nul

echo.
echo Step 3: Generating Prisma Client...
call npx prisma generate

echo.
echo Step 4: Verifying...
if exist "node_modules\.prisma\client" (
    echo [SUCCESS] Prisma client generated successfully!
    echo.
    echo You can now run: npm run dev
) else (
    echo [ERROR] Prisma client generation failed.
    echo Please close VS Code and try again.
)

echo.
pause
