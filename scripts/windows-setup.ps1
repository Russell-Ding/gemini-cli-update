# Gemini CLI with Anthropic Support - Windows 11 Setup Script
# Copyright 2025 Google LLC
# SPDX-License-Identifier: Apache-2.0

param(
    [switch]$SkipProxySetup,
    [switch]$SkipAWSSetup,
    [switch]$InstallOnly,
    [string]$ProxyHost = "primary-proxy.gslb.intranet.aaa.com",
    [int]$ProxyPort = 8080
)

# Color functions for better output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )

    $colors = @{
        "Red" = [ConsoleColor]::Red
        "Green" = [ConsoleColor]::Green
        "Yellow" = [ConsoleColor]::Yellow
        "Blue" = [ConsoleColor]::Blue
        "Cyan" = [ConsoleColor]::Cyan
        "White" = [ConsoleColor]::White
    }

    Write-Host $Message -ForegroundColor $colors[$Color]
}

function Write-Header {
    param([string]$Title)

    Write-Host ""
    Write-ColorOutput "=" * 60 "Cyan"
    Write-ColorOutput "  $Title" "Cyan"
    Write-ColorOutput "=" * 60 "Cyan"
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "✅ $Message" "Green"
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "⚠️  $Message" "Yellow"
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "❌ $Message" "Red"
}

function Write-Info {
    param([string]$Message)
    Write-ColorOutput "ℹ️  $Message" "Blue"
}

# Check if running as administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Install Node.js if not present
function Install-NodeJS {
    Write-Header "Node.js Installation"

    $nodeVersion = $null
    try {
        $nodeVersion = node --version 2>$null
    } catch {
        # Node not found
    }

    if ($nodeVersion) {
        Write-Success "Node.js is already installed: $nodeVersion"
        return $true
    }

    Write-Info "Node.js not found. Installing Node.js LTS..."

    # Check if winget is available
    try {
        winget --version | Out-Null
        Write-Info "Using winget to install Node.js..."
        winget install OpenJS.NodeJS.LTS --silent

        # Refresh environment variables
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

        # Test installation
        try {
            $nodeVersion = node --version 2>$null
            if ($nodeVersion) {
                Write-Success "Node.js installed successfully: $nodeVersion"
                return $true
            }
        } catch {
            Write-Error "Node.js installation verification failed"
            return $false
        }
    } catch {
        Write-Warning "winget not available. Please install Node.js manually from https://nodejs.org"
        Write-Info "After installing Node.js, re-run this script."
        return $false
    }
}

# Install AWS CLI if not present
function Install-AWSCLI {
    Write-Header "AWS CLI Installation"

    $awsVersion = $null
    try {
        $awsVersion = aws --version 2>$null
    } catch {
        # AWS CLI not found
    }

    if ($awsVersion) {
        Write-Success "AWS CLI is already installed: $awsVersion"
        return $true
    }

    Write-Info "AWS CLI not found. Installing..."

    try {
        # Download and install AWS CLI v2
        $awsCliUrl = "https://awscli.amazonaws.com/AWSCLIV2.msi"
        $tempFile = "$env:TEMP\AWSCLIV2.msi"

        Write-Info "Downloading AWS CLI installer..."
        Invoke-WebRequest -Uri $awsCliUrl -OutFile $tempFile

        Write-Info "Installing AWS CLI..."
        Start-Process msiexec.exe -ArgumentList "/i `"$tempFile`" /quiet" -Wait

        # Clean up
        Remove-Item $tempFile -Force

        # Refresh environment variables
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

        # Test installation
        try {
            $awsVersion = aws --version 2>$null
            if ($awsVersion) {
                Write-Success "AWS CLI installed successfully: $awsVersion"
                return $true
            }
        } catch {
            Write-Error "AWS CLI installation verification failed"
            return $false
        }
    } catch {
        Write-Error "Failed to install AWS CLI: $($_.Exception.Message)"
        Write-Info "Please install AWS CLI manually from https://aws.amazon.com/cli/"
        return $false
    }
}

# Install Gemini CLI
function Install-GeminiCLI {
    Write-Header "Gemini CLI Installation"

    # Check if npm is available
    try {
        npm --version | Out-Null
    } catch {
        Write-Error "npm not found. Please install Node.js first."
        return $false
    }

    Write-Info "Installing Gemini CLI..."
    try {
        npm install -g @google/gemini-cli
        Write-Success "Gemini CLI installed successfully"

        # Verify installation
        try {
            gemini --version | Out-Null
            Write-Success "Gemini CLI verification passed"
            return $true
        } catch {
            Write-Warning "Gemini CLI installed but verification failed. You may need to restart your terminal."
            return $true
        }
    } catch {
        Write-Error "Failed to install Gemini CLI: $($_.Exception.Message)"
        return $false
    }
}

# Setup proxy configuration
function Setup-ProxyConfiguration {
    Write-Header "Corporate Proxy Configuration"

    if ($SkipProxySetup) {
        Write-Info "Skipping proxy setup as requested"
        return $true
    }

    $username = $env:USERNAME
    Write-Info "Setting up proxy authentication for user: $username"
    Write-Info "Proxy server: ${ProxyHost}:${ProxyPort}"

    # Get password securely
    $password = Read-Host "Enter your corporate proxy password" -AsSecureString
    $passwordPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

    # URL encode username and password
    $encodedUsername = [System.Web.HttpUtility]::UrlEncode($username)
    $encodedPassword = [System.Web.HttpUtility]::UrlEncode($passwordPlain)

    # Create proxy URL
    $proxyUrl = "http://${encodedUsername}:${encodedPassword}@${ProxyHost}:${ProxyPort}"

    # Set environment variables for current session
    $env:HTTPS_PROXY = $proxyUrl
    $env:https_proxy = $proxyUrl
    $env:HTTP_PROXY = $proxyUrl
    $env:http_proxy = $proxyUrl
    $env:AWS_HTTPS_PROXY = $proxyUrl
    $env:AWS_HTTP_PROXY = $proxyUrl

    Write-Success "Proxy configuration set for current session"

    # Ask if user wants to set permanently
    $setPermanent = Read-Host "Do you want to set proxy configuration permanently for this user? (y/N)"
    if ($setPermanent -eq "y" -or $setPermanent -eq "Y") {
        try {
            # Set user environment variables (without credentials for security)
            [System.Environment]::SetEnvironmentVariable("GEMINI_PROXY_HOST", $ProxyHost, "User")
            [System.Environment]::SetEnvironmentVariable("GEMINI_PROXY_PORT", $ProxyPort, "User")
            [System.Environment]::SetEnvironmentVariable("GEMINI_PROXY_USER", $username, "User")

            Write-Success "Proxy configuration saved permanently"
            Write-Warning "Note: Password is not saved permanently for security reasons"
            Write-Info "You can use 'gemini proxy-setup --interactive' to set up authentication"
        } catch {
            Write-Warning "Failed to save permanent proxy configuration: $($_.Exception.Message)"
        }
    }

    # Clear password from memory
    $passwordPlain = $null
    $password.Dispose()

    return $true
}

# Setup AWS credentials
function Setup-AWSCredentials {
    Write-Header "AWS Credentials Configuration"

    if ($SkipAWSSetup) {
        Write-Info "Skipping AWS setup as requested"
        return $true
    }

    # Check if AWS credentials are already configured
    try {
        aws sts get-caller-identity --output table 2>$null | Out-Null
        Write-Success "AWS credentials are already configured and working"
        return $true
    } catch {
        # Credentials not configured or not working
    }

    Write-Info "AWS credentials not found or not working. Let's set them up."
    Write-Info "You'll need your AWS Access Key ID and Secret Access Key"

    $setupAWS = Read-Host "Do you want to set up AWS credentials now? (y/N)"
    if ($setupAWS -eq "y" -or $setupAWS -eq "Y") {
        try {
            aws configure

            # Test the configuration
            Write-Info "Testing AWS configuration..."
            aws sts get-caller-identity --output table
            Write-Success "AWS credentials configured successfully"
            return $true
        } catch {
            Write-Error "AWS configuration failed: $($_.Exception.Message)"
            return $false
        }
    } else {
        Write-Warning "AWS credentials not configured. You'll need to set them up later with 'aws configure'"
        Write-Info "Required environment variables:"
        Write-Info "  AWS_ACCESS_KEY_ID"
        Write-Info "  AWS_SECRET_ACCESS_KEY"
        Write-Info "  AWS_REGION (optional, default: us-east-1)"
        return $true
    }
}

# Verify installation
function Test-Installation {
    Write-Header "Installation Verification"

    $allGood = $true

    # Test Node.js
    try {
        $nodeVersion = node --version
        Write-Success "Node.js: $nodeVersion"
    } catch {
        Write-Error "Node.js not working"
        $allGood = $false
    }

    # Test AWS CLI
    try {
        $awsVersion = aws --version
        Write-Success "AWS CLI: $awsVersion"
    } catch {
        Write-Error "AWS CLI not working"
        $allGood = $false
    }

    # Test Gemini CLI
    try {
        $geminiVersion = gemini --version
        Write-Success "Gemini CLI: $geminiVersion"
    } catch {
        Write-Error "Gemini CLI not working"
        $allGood = $false
    }

    # Test proxy configuration
    if ($env:HTTPS_PROXY) {
        Write-Success "Proxy configuration: Set"
    } else {
        Write-Warning "Proxy configuration: Not set"
    }

    # Test Anthropic integration
    Write-Info "Testing Anthropic integration..."
    try {
        gemini anthropic --validate | Out-Host
    } catch {
        Write-Warning "Anthropic validation failed. You may need to configure AWS credentials."
    }

    return $allGood
}

# Show next steps
function Show-NextSteps {
    Write-Header "Setup Complete! Next Steps"

    Write-Info "🎉 Installation completed successfully!"
    Write-Host ""

    Write-ColorOutput "📋 Quick Start Commands:" "Yellow"
    Write-Host "  gemini proxy-setup --interactive    # Set up proxy authentication"
    Write-Host "  gemini anthropic --validate         # Validate AWS/Anthropic setup"
    Write-Host "  gemini anthropic --list-models      # List available models"
    Write-Host "  gemini -m claude-3.5-sonnet 'Hello' # Test with Anthropic model"
    Write-Host ""

    Write-ColorOutput "🔧 Configuration:" "Yellow"
    Write-Host "  • Proxy: Use 'gemini proxy-setup --interactive' for secure authentication"
    Write-Host "  • AWS: Use 'aws configure' or set environment variables"
    Write-Host "  • Models: Use 'gemini anthropic --recommend coding' for suggestions"
    Write-Host ""

    Write-ColorOutput "📚 Documentation:" "Yellow"
    Write-Host "  • Run 'gemini --help' for general help"
    Write-Host "  • Run 'gemini anthropic --help' for Anthropic-specific commands"
    Write-Host "  • Run 'gemini proxy-setup --help' for proxy setup options"
    Write-Host ""

    if (-not $env:HTTPS_PROXY) {
        Write-Warning "Remember to set up proxy authentication for corporate network access!"
        Write-Info "Run: gemini proxy-setup --interactive"
    }

    Write-Success "Setup complete! Enjoy using Gemini CLI with Anthropic models! 🚀"
}

# Main execution
function Main {
    Write-Header "🤖 Gemini CLI with Anthropic Support - Windows 11 Setup"

    Write-Info "This script will set up Gemini CLI with Anthropic model support via AWS Bedrock"
    Write-Info "Requirements: Windows 11, Administrator privileges (recommended)"
    Write-Host ""

    if (-not (Test-Administrator)) {
        Write-Warning "Not running as administrator. Some installations may fail."
        $continue = Read-Host "Continue anyway? (y/N)"
        if ($continue -ne "y" -and $continue -ne "Y") {
            Write-Info "Please run this script as Administrator for best results."
            return
        }
    }

    # Load System.Web for URL encoding
    Add-Type -AssemblyName System.Web

    $success = $true

    # Install Node.js
    if (-not (Install-NodeJS)) {
        $success = $false
    }

    # Install AWS CLI
    if ($success -and -not (Install-AWSCLI)) {
        $success = $false
    }

    # Install Gemini CLI
    if ($success -and -not (Install-GeminiCLI)) {
        $success = $false
    }

    if (-not $success) {
        Write-Error "Installation failed. Please check the errors above and retry."
        return
    }

    if ($InstallOnly) {
        Write-Info "Installation complete. Skipping configuration as requested."
        Test-Installation
        return
    }

    # Setup proxy
    Setup-ProxyConfiguration

    # Setup AWS credentials
    Setup-AWSCredentials

    # Test everything
    $testResult = Test-Installation

    # Show next steps
    Show-NextSteps

    if ($testResult) {
        Write-Success "🎉 All systems go! Gemini CLI with Anthropic support is ready!"
    } else {
        Write-Warning "⚠️  Setup completed with some issues. Please review the messages above."
    }
}

# Run the main function
Main