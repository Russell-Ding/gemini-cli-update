/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnthropicModel, ANTHROPIC_MODEL_DISPLAY_NAMES } from '../core/anthropicContentGenerator.js';

export interface AnthropicModelConfig {
  id: AnthropicModel;
  name: string;
  description: string;
  maxTokens: number;
  costTier: 'low' | 'medium' | 'high';
  speed: 'fast' | 'medium' | 'slow';
  capabilities: string[];
}

export const ANTHROPIC_MODEL_CONFIGS: Record<AnthropicModel, AnthropicModelConfig> = {
  [AnthropicModel.CLAUDE_3_5_SONNET]: {
    id: AnthropicModel.CLAUDE_3_5_SONNET,
    name: ANTHROPIC_MODEL_DISPLAY_NAMES[AnthropicModel.CLAUDE_3_5_SONNET],
    description: 'Latest and most capable Claude model with enhanced reasoning and coding abilities',
    maxTokens: 8192,
    costTier: 'high',
    speed: 'medium',
    capabilities: ['text', 'images', 'code', 'analysis', 'reasoning', 'tool-use'],
  },
  [AnthropicModel.CLAUDE_3_5_HAIKU]: {
    id: AnthropicModel.CLAUDE_3_5_HAIKU,
    name: ANTHROPIC_MODEL_DISPLAY_NAMES[AnthropicModel.CLAUDE_3_5_HAIKU],
    description: 'Fast and efficient model optimized for speed and cost-effectiveness',
    maxTokens: 8192,
    costTier: 'low',
    speed: 'fast',
    capabilities: ['text', 'images', 'code', 'basic-analysis'],
  },
  [AnthropicModel.CLAUDE_3_OPUS]: {
    id: AnthropicModel.CLAUDE_3_OPUS,
    name: ANTHROPIC_MODEL_DISPLAY_NAMES[AnthropicModel.CLAUDE_3_OPUS],
    description: 'Most capable Claude 3 model with superior performance on complex tasks',
    maxTokens: 4096,
    costTier: 'high',
    speed: 'slow',
    capabilities: ['text', 'images', 'code', 'advanced-reasoning', 'complex-analysis'],
  },
  [AnthropicModel.CLAUDE_3_SONNET]: {
    id: AnthropicModel.CLAUDE_3_SONNET,
    name: ANTHROPIC_MODEL_DISPLAY_NAMES[AnthropicModel.CLAUDE_3_SONNET],
    description: 'Balanced Claude 3 model offering good performance and reasonable cost',
    maxTokens: 4096,
    costTier: 'medium',
    speed: 'medium',
    capabilities: ['text', 'images', 'code', 'analysis'],
  },
  [AnthropicModel.CLAUDE_3_HAIKU]: {
    id: AnthropicModel.CLAUDE_3_HAIKU,
    name: ANTHROPIC_MODEL_DISPLAY_NAMES[AnthropicModel.CLAUDE_3_HAIKU],
    description: 'Fast and lightweight Claude 3 model for simple tasks',
    maxTokens: 4096,
    costTier: 'low',
    speed: 'fast',
    capabilities: ['text', 'code', 'basic-analysis'],
  },
};

export class AnthropicModelSelector {
  static getAvailableModels(): AnthropicModelConfig[] {
    return Object.values(ANTHROPIC_MODEL_CONFIGS);
  }

  static getModelConfig(modelId: AnthropicModel): AnthropicModelConfig {
    return ANTHROPIC_MODEL_CONFIGS[modelId];
  }

  static getModelsByCapability(capability: string): AnthropicModelConfig[] {
    return Object.values(ANTHROPIC_MODEL_CONFIGS).filter(config =>
      config.capabilities.includes(capability)
    );
  }

  static getModelsByCostTier(costTier: 'low' | 'medium' | 'high'): AnthropicModelConfig[] {
    return Object.values(ANTHROPIC_MODEL_CONFIGS).filter(config =>
      config.costTier === costTier
    );
  }

  static getModelsBySpeed(speed: 'fast' | 'medium' | 'slow'): AnthropicModelConfig[] {
    return Object.values(ANTHROPIC_MODEL_CONFIGS).filter(config =>
      config.speed === speed
    );
  }

  static getRecommendedModel(task: 'coding' | 'analysis' | 'general' | 'fast'): AnthropicModel {
    switch (task) {
      case 'coding':
        return AnthropicModel.CLAUDE_3_5_SONNET;
      case 'analysis':
        return AnthropicModel.CLAUDE_3_OPUS;
      case 'general':
        return AnthropicModel.CLAUDE_3_5_SONNET;
      case 'fast':
        return AnthropicModel.CLAUDE_3_5_HAIKU;
      default:
        return AnthropicModel.CLAUDE_3_5_SONNET;
    }
  }

  static validateModel(modelId: string): modelId is AnthropicModel {
    return Object.values(AnthropicModel).includes(modelId as AnthropicModel);
  }

  static parseModelFromString(modelString: string): AnthropicModel {
    // Handle various input formats
    const normalizedModel = modelString.toLowerCase().replace(/[-_\s]/g, '');

    const modelMappings: Record<string, AnthropicModel> = {
      'claude35sonnet': AnthropicModel.CLAUDE_3_5_SONNET,
      'claude3.5sonnet': AnthropicModel.CLAUDE_3_5_SONNET,
      'claude35haiku': AnthropicModel.CLAUDE_3_5_HAIKU,
      'claude3.5haiku': AnthropicModel.CLAUDE_3_5_HAIKU,
      'claude3opus': AnthropicModel.CLAUDE_3_OPUS,
      'claude3sonnet': AnthropicModel.CLAUDE_3_SONNET,
      'claude3haiku': AnthropicModel.CLAUDE_3_HAIKU,
      'sonnet': AnthropicModel.CLAUDE_3_5_SONNET,
      'haiku': AnthropicModel.CLAUDE_3_5_HAIKU,
      'opus': AnthropicModel.CLAUDE_3_OPUS,
    };

    return modelMappings[normalizedModel] || AnthropicModel.CLAUDE_3_5_SONNET;
  }
}

// Environment variable helper
export function getAnthropicModelFromEnv(): AnthropicModel {
  const envModel = process.env['ANTHROPIC_MODEL'] || process.env['CLAUDE_MODEL'];
  if (envModel && AnthropicModelSelector.validateModel(envModel)) {
    return envModel as AnthropicModel;
  }
  if (envModel) {
    return AnthropicModelSelector.parseModelFromString(envModel);
  }
  return AnthropicModel.CLAUDE_3_5_SONNET;
}

export function getAwsRegionFromEnv(): string {
  return process.env['AWS_REGION'] || process.env['AWS_DEFAULT_REGION'] || 'us-east-1';
}