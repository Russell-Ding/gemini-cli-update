@echo off
echo ========================================
echo  Gemini CLI with Anthropic Integration
echo  Windows 11 Installation Script
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

REM Check if npm is available
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm is not available
    pause
    exit /b 1
)

echo npm version:
npm --version
echo.

REM Install dependencies
echo Installing dependencies...
npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    echo Trying to clean cache and reinstall...
    npm cache clean --force
    npm install
    if errorlevel 1 (
        echo ERROR: Still failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo Building project...
npm run build
if errorlevel 1 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Installation Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Set up your AWS credentials (see setup-anthropic.bat)
echo 2. Run: npm run start -- anthropic --validate
echo 3. Start using: npm run start
echo.
pause