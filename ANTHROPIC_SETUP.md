# Anthropic Claude Integration via AWS Bedrock

This guide shows how to configure the Gemini CLI to use Anthropic's Claude models via AWS Bedrock instead of Google's Gemini models.

## Prerequisites

1. **AWS Account** with Bedrock access
2. **AWS Credentials** configured
3. **Bedrock Model Access** for Anthropic Claude models

## Environment Setup

Set the following environment variables:

```bash
# Required AWS Credentials
export AWS_ACCESS_KEY_ID="your-aws-access-key-id"
export AWS_SECRET_ACCESS_KEY="your-aws-secret-access-key"
export AWS_SESSION_TOKEN="your-session-token"  # if using temporary credentials

# AWS Region (optional, defaults to us-east-1)
export AWS_REGION="us-east-1"

# Anthropic Model Selection (optional, defaults to claude-3.5-sonnet)
export ANTHROPIC_MODEL="claude-3.5-sonnet"

# Set the CLI to use Anthropic
export GEMINI_AUTH_TYPE="anthropic-bedrock"
```

## Available Models

| Model ID | Name | Description | Best For |
|----------|------|-------------|----------|
| `anthropic.claude-3-5-sonnet-20241022-v2:0` | Claude 3.5 Sonnet | Latest and most capable | Coding, reasoning, general use |
| `anthropic.claude-3-5-haiku-20241022-v1:0` | Claude 3.5 Haiku | Fast and efficient | Quick responses, cost-effective |
| `anthropic.claude-3-opus-20240229-v1:0` | Claude 3 Opus | Most capable Claude 3 | Complex analysis, advanced reasoning |
| `anthropic.claude-3-sonnet-20240229-v1:0` | Claude 3 Sonnet | Balanced performance | General purpose, balanced cost/performance |
| `anthropic.claude-3-haiku-20240307-v1:0` | Claude 3 Haiku | Fast and lightweight | Simple tasks, cost-effective |

## Model Selection

You can specify models in several ways:

### Using Environment Variables
```bash
# Full model ID
export ANTHROPIC_MODEL="anthropic.claude-3-5-sonnet-20241022-v2:0"

# Short names (will be mapped automatically)
export ANTHROPIC_MODEL="claude-3.5-sonnet"
export ANTHROPIC_MODEL="sonnet"
export ANTHROPIC_MODEL="haiku"
export ANTHROPIC_MODEL="opus"
```

### Using the CLI Command
```bash
# List available models
npm run start -- anthropic --list-models

# Get recommendations
npm run start -- anthropic --recommend coding
npm run start -- anthropic --recommend analysis
npm run start -- anthropic --recommend fast

# Show current configuration
npm run start -- anthropic --show-config

# Validate environment setup
npm run start -- anthropic --validate

# Filter models by criteria
npm run start -- anthropic --filter cost low
npm run start -- anthropic --filter speed fast
npm run start -- anthropic --filter capability code
```

## Quick Setup Script

Create a setup script for easy configuration:

```bash
#!/bin/bash
# setup-anthropic.sh

echo "Setting up Anthropic Claude integration..."

# Prompt for AWS credentials
read -p "Enter AWS Access Key ID: " AWS_ACCESS_KEY_ID
read -s -p "Enter AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
echo
read -p "Enter AWS Session Token (if temporary): " AWS_SESSION_TOKEN
read -p "Enter AWS Region [us-east-1]: " AWS_REGION

# Set defaults
AWS_REGION=${AWS_REGION:-us-east-1}

# Export environment variables
export AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY"
export AWS_SESSION_TOKEN="$AWS_SESSION_TOKEN"
export AWS_REGION="$AWS_REGION"
export ANTHROPIC_MODEL="claude-3.5-sonnet"
export GEMINI_AUTH_TYPE="anthropic-bedrock"

echo "Environment configured!"
echo "Current settings:"
echo "  AWS Region: $AWS_REGION"
echo "  Anthropic Model: $ANTHROPIC_MODEL"
echo "  Auth Type: $GEMINI_AUTH_TYPE"

# Validate setup
npm run start -- anthropic --validate
```

## Usage Examples

Once configured, use the CLI normally - it will automatically route to Anthropic:

```bash
# Start a coding session
npm run start

# Use with specific model (if different from environment)
ANTHROPIC_MODEL="claude-3-opus" npm run start

# Quick command
echo "Explain how async/await works in JavaScript" | npm run start
```

## Cost Optimization

Choose models based on your needs:

- **Development/Testing**: Use `claude-3.5-haiku` for faster, cheaper responses
- **Production/Complex Tasks**: Use `claude-3.5-sonnet` for best overall performance
- **Advanced Analysis**: Use `claude-3-opus` for the most sophisticated reasoning

## Troubleshooting

### Common Issues

1. **Credentials Error**
   ```
   Error: AWS credentials not found
   ```
   Solution: Ensure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set

2. **Region Error**
   ```
   Error: Bedrock not available in region
   ```
   Solution: Use a supported region like us-east-1 or us-west-2

3. **Model Access Error**
   ```
   Error: Access denied to model
   ```
   Solution: Request model access in AWS Bedrock console

4. **Token Limit Error**
   ```
   Error: Input too long
   ```
   Solution: Use models with higher token limits or reduce input size

### Validation Commands

```bash
# Check AWS credentials
aws sts get-caller-identity

# Test Bedrock access
aws bedrock list-foundation-models --region us-east-1

# Validate CLI setup
npm run start -- anthropic --validate
```

## Migration from Gemini

The integration maintains compatibility with the existing Gemini CLI interface:

1. **Same Commands**: All existing commands work the same way
2. **Same Features**: Streaming, function calling, file operations all supported
3. **Same Configuration**: Most configuration options remain unchanged
4. **Better Models**: Access to Claude's superior coding and reasoning capabilities

Simply change your environment variables and start using Claude models immediately!

## Advanced Configuration

### Custom Model Mapping
You can modify the model mapping in `packages/core/src/core/anthropicContentGenerator.ts`:

```typescript
const modelMap: Record<string, AnthropicModel> = {
  'gemini-2.0-flash': AnthropicModel.CLAUDE_3_5_SONNET,
  'gemini-1.5-pro': AnthropicModel.CLAUDE_3_5_SONNET,
  'gemini-1.5-flash': AnthropicModel.CLAUDE_3_5_HAIKU,
  // Add your custom mappings
};
```

### Regional Configuration
Different AWS regions may have different model availability:

```bash
# Check available models in your region
aws bedrock list-foundation-models --region $AWS_REGION
```

### Session Token Refresh
For temporary credentials, you may need to refresh tokens periodically:

```bash
# Get new session token
aws sts get-session-token --duration-seconds 3600
```