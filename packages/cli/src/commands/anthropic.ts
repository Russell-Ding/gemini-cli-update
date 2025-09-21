/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnthropicModelSelector, ANTHROPIC_MODEL_CONFIGS } from '@google/gemini-cli-core/config/anthropicModels.js';
import { AnthropicModel } from '@google/gemini-cli-core/core/anthropicContentGenerator.js';

export interface AnthropicCommandOptions {
  listModels?: boolean;
  setModel?: string;
  showConfig?: boolean;
  recommend?: 'coding' | 'analysis' | 'general' | 'fast';
  filter?: 'cost' | 'speed' | 'capability';
}

export class AnthropicCommand {
  static listAvailableModels(): void {
    console.log('\n🤖 Available Anthropic Claude Models:\n');

    const models = AnthropicModelSelector.getAvailableModels();

    models.forEach((model, index) => {
      const config = ANTHROPIC_MODEL_CONFIGS[model.id];
      console.log(`${index + 1}. ${model.name}`);
      console.log(`   Model ID: ${model.id}`);
      console.log(`   Description: ${config.description}`);
      console.log(`   Max Tokens: ${config.maxTokens.toLocaleString()}`);
      console.log(`   Cost Tier: ${config.costTier.toUpperCase()}`);
      console.log(`   Speed: ${config.speed.toUpperCase()}`);
      console.log(`   Capabilities: ${config.capabilities.join(', ')}`);
      console.log('');
    });
  }

  static showCurrentConfig(): void {
    console.log('\n⚙️  Current Anthropic Configuration:\n');

    const awsRegion = process.env['AWS_REGION'] || process.env['AWS_DEFAULT_REGION'] || 'us-east-1';
    const anthropicModel = process.env['ANTHROPIC_MODEL'] || process.env['CLAUDE_MODEL'] || 'claude-3.5-sonnet';
    const awsAccessKeyId = process.env['AWS_ACCESS_KEY_ID'] ? '✅ Set' : '❌ Not set';
    const awsSecretAccessKey = process.env['AWS_SECRET_ACCESS_KEY'] ? '✅ Set' : '❌ Not set';
    const awsSessionToken = process.env['AWS_SESSION_TOKEN'] ? '✅ Set' : '❌ Not set';

    console.log(`AWS Region: ${awsRegion}`);
    console.log(`Selected Model: ${anthropicModel}`);
    console.log(`AWS Access Key ID: ${awsAccessKeyId}`);
    console.log(`AWS Secret Access Key: ${awsSecretAccessKey}`);
    console.log(`AWS Session Token: ${awsSessionToken}`);

    if (AnthropicModelSelector.validateModel(anthropicModel)) {
      const config = ANTHROPIC_MODEL_CONFIGS[anthropicModel as AnthropicModel];
      console.log(`\nModel Details:`);
      console.log(`  Name: ${config.name}`);
      console.log(`  Description: ${config.description}`);
      console.log(`  Max Tokens: ${config.maxTokens.toLocaleString()}`);
      console.log(`  Cost Tier: ${config.costTier.toUpperCase()}`);
      console.log(`  Speed: ${config.speed.toUpperCase()}`);
    }
    console.log('');
  }

  static getRecommendation(task: 'coding' | 'analysis' | 'general' | 'fast'): void {
    console.log(`\n🎯 Recommended Model for ${task.toUpperCase()} tasks:\n`);

    const recommendedModel = AnthropicModelSelector.getRecommendedModel(task);
    const config = ANTHROPIC_MODEL_CONFIGS[recommendedModel];

    console.log(`Recommended: ${config.name}`);
    console.log(`Model ID: ${recommendedModel}`);
    console.log(`Description: ${config.description}`);
    console.log(`Why this model: ${this.getRecommendationReason(task)}`);
    console.log('');
    console.log(`To set this model, run:`);
    console.log(`export ANTHROPIC_MODEL="${recommendedModel}"`);
    console.log('');
  }

  static filterModels(filterType: 'cost' | 'speed' | 'capability', filterValue?: string): void {
    console.log(`\n🔍 Models filtered by ${filterType.toUpperCase()}:\n`);

    let filteredModels;

    switch (filterType) {
      case 'cost':
        const costTier = (filterValue as 'low' | 'medium' | 'high') || 'low';
        filteredModels = AnthropicModelSelector.getModelsByCostTier(costTier);
        console.log(`Showing models with ${costTier.toUpperCase()} cost tier:`);
        break;
      case 'speed':
        const speed = (filterValue as 'fast' | 'medium' | 'slow') || 'fast';
        filteredModels = AnthropicModelSelector.getModelsBySpeed(speed);
        console.log(`Showing ${speed.toUpperCase()} models:`);
        break;
      case 'capability':
        const capability = filterValue || 'code';
        filteredModels = AnthropicModelSelector.getModelsByCapability(capability);
        console.log(`Showing models with '${capability}' capability:`);
        break;
      default:
        console.log('Invalid filter type. Use: cost, speed, or capability');
        return;
    }

    if (filteredModels.length === 0) {
      console.log('No models found matching the filter criteria.');
      return;
    }

    filteredModels.forEach((config, index) => {
      console.log(`${index + 1}. ${config.name}`);
      console.log(`   Model ID: ${config.id}`);
      console.log(`   Cost: ${config.costTier} | Speed: ${config.speed}`);
      console.log('');
    });
  }

  static setModel(modelInput: string): void {
    console.log(`\n🔧 Setting Anthropic Model...\n`);

    let modelId: AnthropicModel;

    if (AnthropicModelSelector.validateModel(modelInput)) {
      modelId = modelInput as AnthropicModel;
    } else {
      modelId = AnthropicModelSelector.parseModelFromString(modelInput);
    }

    const config = ANTHROPIC_MODEL_CONFIGS[modelId];

    console.log(`Selected model: ${config.name}`);
    console.log(`Model ID: ${modelId}`);
    console.log('');
    console.log('To set this model permanently, add this to your shell configuration:');
    console.log(`export ANTHROPIC_MODEL="${modelId}"`);
    console.log('');
    console.log('Or set it for this session only:');
    console.log(`export ANTHROPIC_MODEL="${modelId}"`);
    console.log('');
  }

  static validateEnvironment(): boolean {
    console.log('\n🔍 Validating Anthropic/AWS Environment...\n');

    const awsAccessKeyId = process.env['AWS_ACCESS_KEY_ID'];
    const awsSecretAccessKey = process.env['AWS_SECRET_ACCESS_KEY'];
    const awsRegion = process.env['AWS_REGION'] || process.env['AWS_DEFAULT_REGION'];

    let isValid = true;

    if (!awsAccessKeyId) {
      console.log('❌ AWS_ACCESS_KEY_ID is not set');
      isValid = false;
    } else {
      console.log('✅ AWS_ACCESS_KEY_ID is set');
    }

    if (!awsSecretAccessKey) {
      console.log('❌ AWS_SECRET_ACCESS_KEY is not set');
      isValid = false;
    } else {
      console.log('✅ AWS_SECRET_ACCESS_KEY is set');
    }

    if (!awsRegion) {
      console.log('⚠️  AWS_REGION not set, using default: us-east-1');
    } else {
      console.log(`✅ AWS_REGION is set to: ${awsRegion}`);
    }

    const sessionToken = process.env['AWS_SESSION_TOKEN'];
    if (sessionToken) {
      console.log('✅ AWS_SESSION_TOKEN is set (for temporary credentials)');
    }

    if (!isValid) {
      console.log('\n💡 To fix this, set your AWS credentials:');
      console.log('export AWS_ACCESS_KEY_ID="your-access-key-id"');
      console.log('export AWS_SECRET_ACCESS_KEY="your-secret-access-key"');
      console.log('export AWS_SESSION_TOKEN="your-session-token"  # if using temporary credentials');
      console.log('export AWS_REGION="us-east-1"  # or your preferred region');
    } else {
      console.log('\n✅ Environment is properly configured for Anthropic via AWS Bedrock!');
    }

    console.log('');
    return isValid;
  }

  private static getRecommendationReason(task: string): string {
    switch (task) {
      case 'coding':
        return 'Claude 3.5 Sonnet offers the best balance of coding capabilities and performance';
      case 'analysis':
        return 'Claude 3 Opus provides the most sophisticated reasoning for complex analysis tasks';
      case 'general':
        return 'Claude 3.5 Sonnet is the most well-rounded model for general use cases';
      case 'fast':
        return 'Claude 3.5 Haiku is optimized for speed and cost-effectiveness';
      default:
        return 'This model provides good performance for the specified task type';
    }
  }

  static printUsage(): void {
    console.log(`
🤖 Anthropic Model Management Commands:

gemini anthropic --list-models              List all available Anthropic Claude models
gemini anthropic --show-config              Show current Anthropic configuration
gemini anthropic --set-model <model>        Set the Anthropic model to use
gemini anthropic --recommend <task>         Get model recommendation for task type
gemini anthropic --filter <type> [value]    Filter models by cost/speed/capability
gemini anthropic --validate                 Validate AWS environment setup

Task types for recommendations:
  coding     - Best for software development and code generation
  analysis   - Best for complex reasoning and analysis tasks
  general    - Best for general-purpose use
  fast       - Best for quick responses and cost efficiency

Filter examples:
  --filter cost low                         Show low-cost models
  --filter speed fast                       Show fast models
  --filter capability code                  Show models with coding capability

Environment variables:
  AWS_ACCESS_KEY_ID                         Your AWS access key ID
  AWS_SECRET_ACCESS_KEY                     Your AWS secret access key
  AWS_SESSION_TOKEN                         Your AWS session token (if temporary)
  AWS_REGION                                AWS region (default: us-east-1)
  ANTHROPIC_MODEL                           Preferred Anthropic model
`);
  }
}

export function handleAnthropicCommand(options: AnthropicCommandOptions): void {
  if (options.listModels) {
    AnthropicCommand.listAvailableModels();
  } else if (options.showConfig) {
    AnthropicCommand.showCurrentConfig();
  } else if (options.setModel) {
    AnthropicCommand.setModel(options.setModel);
  } else if (options.recommend) {
    AnthropicCommand.getRecommendation(options.recommend);
  } else if (options.filter) {
    // This would need additional parsing for filter value
    AnthropicCommand.filterModels(options.filter as any);
  } else {
    AnthropicCommand.printUsage();
  }
}