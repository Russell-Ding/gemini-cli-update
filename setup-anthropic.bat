@echo off
echo ========================================
echo  Anthropic Claude Configuration Setup
echo ========================================
echo.

echo This script will help you configure Anthropic Claude via AWS Bedrock
echo.

REM Get AWS credentials
set /p AWS_ACCESS_KEY_ID="Enter your AWS Access Key ID: "
echo.
set /p AWS_SECRET_ACCESS_KEY="Enter your AWS Secret Access Key: "
echo.
set /p AWS_SESSION_TOKEN="Enter your AWS Session Token (optional, press Enter to skip): "
echo.
set /p AWS_REGION="Enter your AWS Region [us-east-1]: "
if "%AWS_REGION%"=="" set AWS_REGION=us-east-1

echo.
echo Available Anthropic Models:
echo 1. claude-3.5-sonnet (Recommended for coding)
echo 2. claude-3.5-haiku (Fast and cost-effective)
echo 3. claude-3-opus (Most capable for analysis)
echo 4. claude-3-sonnet (Balanced performance)
echo 5. claude-3-haiku (Lightweight)
echo.
set /p MODEL_CHOICE="Choose a model (1-5) [1]: "
if "%MODEL_CHOICE%"=="" set MODEL_CHOICE=1

if "%MODEL_CHOICE%"=="1" set ANTHROPIC_MODEL=claude-3.5-sonnet
if "%MODEL_CHOICE%"=="2" set ANTHROPIC_MODEL=claude-3.5-haiku
if "%MODEL_CHOICE%"=="3" set ANTHROPIC_MODEL=claude-3-opus
if "%MODEL_CHOICE%"=="4" set ANTHROPIC_MODEL=claude-3-sonnet
if "%MODEL_CHOICE%"=="5" set ANTHROPIC_MODEL=claude-3-haiku

echo.
echo Setting environment variables...

REM Set environment variables for current session
set AWS_ACCESS_KEY_ID=%AWS_ACCESS_KEY_ID%
set AWS_SECRET_ACCESS_KEY=%AWS_SECRET_ACCESS_KEY%
set AWS_SESSION_TOKEN=%AWS_SESSION_TOKEN%
set AWS_REGION=%AWS_REGION%
set ANTHROPIC_MODEL=%ANTHROPIC_MODEL%
set GEMINI_AUTH_TYPE=anthropic-bedrock

echo.
echo Configuration for this session:
echo   AWS Region: %AWS_REGION%
echo   Anthropic Model: %ANTHROPIC_MODEL%
echo   Auth Type: %GEMINI_AUTH_TYPE%
echo.

REM Create a batch file to set these permanently
echo Creating set-env.bat for permanent configuration...
echo @echo off > set-env.bat
echo REM Anthropic/AWS Environment Variables >> set-env.bat
echo set AWS_ACCESS_KEY_ID=%AWS_ACCESS_KEY_ID% >> set-env.bat
echo set AWS_SECRET_ACCESS_KEY=%AWS_SECRET_ACCESS_KEY% >> set-env.bat
if not "%AWS_SESSION_TOKEN%"=="" echo set AWS_SESSION_TOKEN=%AWS_SESSION_TOKEN% >> set-env.bat
echo set AWS_REGION=%AWS_REGION% >> set-env.bat
echo set ANTHROPIC_MODEL=%ANTHROPIC_MODEL% >> set-env.bat
echo set GEMINI_AUTH_TYPE=anthropic-bedrock >> set-env.bat

echo.
echo ========================================
echo  Configuration Complete!
echo ========================================
echo.
echo To use these settings:
echo 1. Run 'set-env.bat' in each new command prompt, OR
echo 2. Add these to your system environment variables permanently
echo.
echo Testing configuration...
npm run start -- anthropic --validate

echo.
echo You can now start using Anthropic Claude:
echo   npm run start
echo.
pause