# Gemini CLI with Anthropic Support - Setup Guide

## Overview

This guide will help you set up Gemini CLI to use Anthropic Claude models (Opus 4.1 and Sonnet 4) via AWS Bedrock with corporate proxy authentication.

## Prerequisites

- **Windows 11** (recommended)
- **Corporate network access** with proxy authentication
- **AWS account** with Bedrock access
- **Administrator privileges** (for installation)

## Quick Setup (Automated)

### Windows 11 - Automated Setup

1. **Download and run the setup script:**
   ```powershell
   # Download the script
   Invoke-WebRequest -Uri "https://raw.githubusercontent.com/your-repo/gemini_cli_update/main/scripts/windows-setup.ps1" -OutFile "gemini-setup.ps1"

   # Run as Administrator
   PowerShell -ExecutionPolicy Bypass -File "gemini-setup.ps1"
   ```

2. **Follow the interactive prompts:**
   - The script will install Node.js, AWS CLI, and Gemini CLI
   - Configure your corporate proxy settings
   - Set up AWS credentials

3. **Test your installation:**
   ```bash
   gemini anthropic --validate
   gemini -m claude-3.5-sonnet "Hello world!"
   ```

## Manual Setup

### Step 1: Install Prerequisites

#### 1.1 Install Node.js
```bash
# Windows (using winget)
winget install OpenJS.NodeJS.LTS

# Or download from https://nodejs.org
```

#### 1.2 Install AWS CLI
```bash
# Windows (using winget)
winget install Amazon.AWSCLI

# Or download from https://aws.amazon.com/cli/
```

### Step 2: Install Gemini CLI

```bash
npm install -g @google/gemini-cli
```

### Step 3: Configure Corporate Proxy

#### 3.1 Interactive Proxy Setup
```bash
gemini proxy-setup --interactive
```

This will:
- Detect your Windows username automatically
- Prompt for your corporate password (securely)
- Configure proxy settings for AWS Bedrock access

#### 3.2 Manual Proxy Configuration
```bash
# Set environment variables (replace with your credentials)
export HTTPS_PROXY=http://username:password@primary-proxy.gslb.intranet.aaa.com:8080
export HTTP_PROXY=http://username:password@primary-proxy.gslb.intranet.aaa.com:8080

# For AWS SDK
export AWS_HTTPS_PROXY=http://username:password@primary-proxy.gslb.intranet.aaa.com:8080
export AWS_HTTP_PROXY=http://username:password@primary-proxy.gslb.intranet.aaa.com:8080
```

#### 3.3 Check Proxy Status
```bash
gemini proxy-setup --status
```

### Step 4: Configure AWS Credentials

#### 4.1 Interactive AWS Setup
```bash
aws configure
```

Enter your:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `us-east-1`)
- Output format (e.g., `json`)

#### 4.2 Environment Variables Method
```bash
export AWS_ACCESS_KEY_ID="your-access-key-id"
export AWS_SECRET_ACCESS_KEY="your-secret-access-key"
export AWS_REGION="us-east-1"
```

### Step 5: Validate Setup

```bash
# Test AWS connection
aws sts get-caller-identity

# Validate Anthropic/Bedrock setup
gemini anthropic --validate

# Test proxy configuration
gemini proxy-setup --status
```

## Using Anthropic Models

### Available Models

```bash
# List all available models
gemini anthropic --list-models

# Show current configuration
gemini anthropic --show-config
```

**Available Models:**
- **Claude 3.5 Sonnet** (Latest) - Best for general use and coding
- **Claude 3.5 Haiku** (Fast) - Best for quick responses
- **Claude 3 Opus** (Most Capable) - Best for complex reasoning
- **Claude 3 Sonnet** (Balanced) - Good balance of capability and speed
- **Claude 3 Haiku** (Fast) - Cost-effective option

### Model Recommendations

```bash
# Get recommendations by task type
gemini anthropic --recommend coding     # For software development
gemini anthropic --recommend analysis   # For complex reasoning
gemini anthropic --recommend general    # For general-purpose use
gemini anthropic --recommend fast       # For quick responses
```

### Setting Your Preferred Model

```bash
# Set default model
gemini anthropic --set-model claude-3.5-sonnet

# Or set environment variable
export ANTHROPIC_MODEL="claude-3.5-sonnet"
export CLAUDE_MODEL="claude-3.5-sonnet"  # Alternative
```

### Using Models

```bash
# Use specific model for one command
gemini -m claude-3.5-sonnet "Explain quantum computing"

# Use with file context
gemini -m claude-3-opus "Review this code" @myfile.js

# Interactive mode with Anthropic model
gemini -m claude-3.5-haiku
```

## Troubleshooting

### Common Issues

#### 1. Proxy Authentication Fails
```bash
# Clear and reset proxy configuration
gemini proxy-setup --clear
gemini proxy-setup --interactive

# Check proxy status
gemini proxy-setup --status
```

#### 2. AWS Credentials Issues
```bash
# Test AWS connection
aws sts get-caller-identity

# Reconfigure credentials
aws configure

# Check environment variables
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY
```

#### 3. Bedrock Access Denied
- Ensure your AWS account has Bedrock access enabled
- Check that Anthropic models are available in your region
- Verify your IAM permissions for Bedrock

#### 4. Model Not Found
```bash
# List available models
gemini anthropic --list-models

# Check current configuration
gemini anthropic --show-config

# Reset to default model
gemini anthropic --set-model claude-3.5-sonnet
```

### Debug Mode

```bash
# Run with debug information
DEBUG=1 gemini -m claude-3.5-sonnet "test prompt"

# Check network connectivity
gemini anthropic --validate
```

### Environment Variables Reference

```bash
# Proxy Configuration
export HTTPS_PROXY="http://user:pass@primary-proxy.gslb.intranet.aaa.com:8080"
export https_proxy="http://user:pass@primary-proxy.gslb.intranet.aaa.com:8080"
export HTTP_PROXY="http://user:pass@primary-proxy.gslb.intranet.aaa.com:8080"
export http_proxy="http://user:pass@primary-proxy.gslb.intranet.aaa.com:8080"

# AWS Configuration
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_SESSION_TOKEN="your-session-token"  # If using temporary credentials
export AWS_REGION="us-east-1"
export AWS_HTTPS_PROXY="http://user:pass@proxy:8080"
export AWS_HTTP_PROXY="http://user:pass@proxy:8080"

# Model Configuration
export ANTHROPIC_MODEL="claude-3.5-sonnet"
export CLAUDE_MODEL="claude-3.5-sonnet"
```

## Advanced Configuration

### Custom Proxy Settings

```bash
# For different proxy hosts/ports
gemini proxy-setup --interactive  # Will prompt for custom settings
```

### Model Filtering

```bash
# Filter by cost
gemini anthropic --filter cost low

# Filter by speed
gemini anthropic --filter speed fast

# Filter by capability
gemini anthropic --filter capability code
```

### Batch Operations

```bash
# Set up proxy for team deployment
gemini proxy-setup --interactive --username "shared-user"

# Validate multiple configurations
gemini anthropic --validate && echo "✅ Ready for deployment"
```

## Security Best Practices

1. **Never store passwords in scripts or environment variables permanently**
2. **Use the interactive proxy setup for secure password handling**
3. **Regularly rotate AWS access keys**
4. **Use IAM roles when possible instead of long-term access keys**
5. **Clear proxy configuration when not needed:**
   ```bash
   gemini proxy-setup --clear
   ```

## Support and Updates

### Getting Help

```bash
# General help
gemini --help

# Anthropic-specific help
gemini anthropic --help

# Proxy setup help
gemini proxy-setup --help
```

### Updating

```bash
# Update Gemini CLI
npm update -g @google/gemini-cli

# Check version
gemini --version
```

### Configuration Files

Gemini CLI stores configuration in:
- **Windows:** `%USERPROFILE%\.gemini-cli\`
- **Settings:** `settings.json`
- **Proxy config:** `.proxy-credentials` (username only)

## Examples

### Basic Usage

```bash
# Simple question
gemini -m claude-3.5-sonnet "What's the capital of France?"

# Code generation
gemini -m claude-3-opus "Write a Python function to calculate fibonacci numbers"

# File analysis
gemini -m claude-3.5-sonnet "Analyze this code" @app.js @utils.js
```

### Advanced Usage

```bash
# Interactive session with context
gemini -m claude-3.5-sonnet --include-directories ./src ./docs

# Batch processing with different models
gemini -m claude-3.5-haiku "Summarize" @doc1.md
gemini -m claude-3-opus "Deep analysis" @doc2.md
```

## FAQ

**Q: Do I need to enter my password every time?**
A: No, the proxy setup saves your username and automatically detects it from your Windows account. You only need to enter the password when setting up or when it changes.

**Q: Can I use this without a corporate proxy?**
A: Yes, skip the proxy setup steps if you have direct internet access. The AWS Bedrock connection will work directly.

**Q: Which model should I use?**
A: Use `gemini anthropic --recommend <task-type>` to get personalized recommendations based on your use case.

**Q: How do I know if everything is working?**
A: Run `gemini anthropic --validate` to check your complete setup.

**Q: Can I use this with existing Gemini CLI setups?**
A: Yes, this extends the existing Gemini CLI with Anthropic support. Your existing Google/Gemini configurations remain unchanged.

---

🎉 **You're all set!** Enjoy using Anthropic Claude models with Gemini CLI through your corporate network!