/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { fromEnv } from '@aws-sdk/credential-providers';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { HttpProxyAgent } from 'http-proxy-agent';
import type {
  Content,
  CountTokensParameters,
  CountTokensResponse,
  EmbedContentParameters,
  EmbedContentResponse,
  GenerateContentParameters,
  GenerateContentResponse,
  GenerateContentResponseUsageMetadata,
  Part,
} from '@google/genai';
import type { ContentGenerator } from './contentGenerator.js';

export enum AnthropicModel {
  CLAUDE_3_5_SONNET = 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  CLAUDE_3_5_HAIKU = 'anthropic.claude-3-5-haiku-20241022-v1:0',
  CLAUDE_3_OPUS = 'anthropic.claude-3-opus-20240229-v1:0',
  CLAUDE_3_SONNET = 'anthropic.claude-3-sonnet-20240229-v1:0',
  CLAUDE_3_HAIKU = 'anthropic.claude-3-haiku-20240307-v1:0',
}

export const ANTHROPIC_MODEL_DISPLAY_NAMES: Record<AnthropicModel, string> = {
  [AnthropicModel.CLAUDE_3_5_SONNET]: 'Claude 3.5 Sonnet (Latest)',
  [AnthropicModel.CLAUDE_3_5_HAIKU]: 'Claude 3.5 Haiku (Fast)',
  [AnthropicModel.CLAUDE_3_OPUS]: 'Claude 3 Opus (Most Capable)',
  [AnthropicModel.CLAUDE_3_SONNET]: 'Claude 3 Sonnet (Balanced)',
  [AnthropicModel.CLAUDE_3_HAIKU]: 'Claude 3 Haiku (Fast)',
};

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string | Array<{
    type: 'text' | 'image';
    text?: string;
    source?: {
      type: 'base64';
      media_type: string;
      data: string;
    };
  }>;
}

interface AnthropicRequest {
  model: string;
  messages: AnthropicMessage[];
  max_tokens: number;
  temperature?: number;
  top_p?: number;
  system?: string;
  stream?: boolean;
}

interface AnthropicResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{
    type: 'text';
    text: string;
  }>;
  model: string;
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence';
  stop_sequence?: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

interface AnthropicStreamChunk {
  type: 'message_start' | 'content_block_start' | 'content_block_delta' | 'content_block_stop' | 'message_delta' | 'message_stop';
  message?: Partial<AnthropicResponse>;
  content_block?: {
    type: 'text';
    text: string;
  };
  delta?: {
    type: 'text_delta';
    text: string;
  };
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
}

export class AnthropicContentGenerator implements ContentGenerator {
  private bedrockClient: BedrockRuntimeClient;
  private defaultModel: AnthropicModel;

  constructor(
    region: string = 'us-east-1',
    defaultModel: AnthropicModel = AnthropicModel.CLAUDE_3_5_SONNET,
    proxyUrl?: string
  ) {
    const clientConfig: any = {
      region,
      credentials: fromEnv(),
    };

    // Configure proxy if provided
    if (proxyUrl) {
      const agent = this.createProxyAgent(proxyUrl);
      if (agent) {
        clientConfig.requestHandler = {
          httpAgent: agent,
          httpsAgent: agent,
        };
      }
    } else {
      // Check environment variables for proxy
      const envProxy = process.env['HTTPS_PROXY'] ||
                      process.env['https_proxy'] ||
                      process.env['HTTP_PROXY'] ||
                      process.env['http_proxy'];
      if (envProxy) {
        const agent = this.createProxyAgent(envProxy);
        if (agent) {
          clientConfig.requestHandler = {
            httpAgent: agent,
            httpsAgent: agent,
          };
        }
      }
    }

    this.bedrockClient = new BedrockRuntimeClient(clientConfig);
    this.defaultModel = defaultModel;
  }

  private createProxyAgent(proxyUrl: string): HttpsProxyAgent | HttpProxyAgent | null {
    try {
      const url = new URL(proxyUrl);
      if (url.protocol === 'https:') {
        return new HttpsProxyAgent(proxyUrl);
      } else if (url.protocol === 'http:') {
        return new HttpProxyAgent(proxyUrl);
      }
      return null;
    } catch (error) {
      console.warn('Invalid proxy URL:', proxyUrl);
      return null;
    }
  }

  async generateContent(
    request: GenerateContentParameters,
    userPromptId: string,
  ): Promise<GenerateContentResponse> {
    const anthropicRequest = this.convertToAnthropicRequest(request, false);

    const command = new InvokeModelCommand({
      modelId: this.getAnthropicModelId(request.model),
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(anthropicRequest),
    });

    try {
      const response = await this.bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      return this.convertFromAnthropicResponse(responseBody, request.model);
    } catch (error) {
      throw new Error(`Anthropic API call failed: ${error}`);
    }
  }

  async generateContentStream(
    request: GenerateContentParameters,
    userPromptId: string,
  ): Promise<AsyncGenerator<GenerateContentResponse>> {
    const anthropicRequest = this.convertToAnthropicRequest(request, true);

    const command = new InvokeModelWithResponseStreamCommand({
      modelId: this.getAnthropicModelId(request.model),
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(anthropicRequest),
    });

    const response = await this.bedrockClient.send(command);

    if (!response.body) {
      throw new Error('No response body received from Bedrock');
    }

    return this.processStreamResponse(response.body, request.model);
  }

  async countTokens(request: CountTokensParameters): Promise<CountTokensResponse> {
    // Anthropic doesn't have a direct token counting API
    // We'll estimate based on text length (rough approximation: 1 token ≈ 4 characters)
    const text = this.extractTextFromContents(request.contents || []);
    const estimatedTokens = Math.ceil(text.length / 4);

    return {
      totalTokens: estimatedTokens,
    };
  }

  async embedContent(request: EmbedContentParameters): Promise<EmbedContentResponse> {
    // Anthropic doesn't provide embeddings via Bedrock
    // You would need to use a different service like Amazon Titan embeddings
    throw new Error('Embeddings not supported with Anthropic models. Use Amazon Titan embeddings instead.');
  }

  private convertToAnthropicRequest(request: GenerateContentParameters, stream: boolean): AnthropicRequest {
    const messages = this.convertContentsToMessages(request.contents || []);
    const systemInstruction = this.extractSystemInstruction(request.config);

    return {
      model: this.getAnthropicModelId(request.model),
      messages,
      max_tokens: request.config?.maxOutputTokens || 4096,
      temperature: request.config?.temperature || 0,
      top_p: request.config?.topP || 1,
      ...(systemInstruction && { system: systemInstruction }),
      ...(stream && { stream: true }),
    };
  }

  private convertContentsToMessages(contents: Content[]): AnthropicMessage[] {
    const messages: AnthropicMessage[] = [];

    for (const content of contents) {
      if (content.role === 'user' || content.role === 'model') {
        const role = content.role === 'model' ? 'assistant' : 'user';
        const messageContent = this.convertPartsToContent(content.parts || []);

        if (messageContent) {
          messages.push({
            role,
            content: messageContent,
          });
        }
      }
    }

    return messages;
  }

  private convertPartsToContent(parts: Part[]): string | Array<any> {
    const textParts: string[] = [];
    const multimodalParts: Array<any> = [];

    for (const part of parts) {
      if (part.text) {
        if (multimodalParts.length === 0) {
          textParts.push(part.text);
        } else {
          multimodalParts.push({ type: 'text', text: part.text });
        }
      } else if (part.inlineData) {
        // Handle images
        multimodalParts.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: part.inlineData.mimeType || 'image/jpeg',
            data: part.inlineData.data,
          },
        });
        // Move text parts to multimodal format
        for (const text of textParts) {
          multimodalParts.unshift({ type: 'text', text });
        }
        textParts.length = 0;
      }
      // Note: functionCall and functionResponse would need special handling
      // This is a simplified implementation
    }

    return multimodalParts.length > 0 ? multimodalParts : textParts.join('');
  }

  private extractSystemInstruction(config: any): string | undefined {
    if (config?.systemInstruction) {
      if (typeof config.systemInstruction === 'string') {
        return config.systemInstruction;
      }
      if (config.systemInstruction.text) {
        return config.systemInstruction.text;
      }
      if (config.systemInstruction.parts) {
        return config.systemInstruction.parts
          .filter((part: any) => part.text)
          .map((part: any) => part.text)
          .join('\n');
      }
    }
    return undefined;
  }

  private convertFromAnthropicResponse(anthropicResponse: AnthropicResponse, originalModel: string): GenerateContentResponse {
    const text = anthropicResponse.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');

    const usageMetadata: GenerateContentResponseUsageMetadata = {
      promptTokenCount: anthropicResponse.usage.input_tokens,
      candidatesTokenCount: anthropicResponse.usage.output_tokens,
      totalTokenCount: anthropicResponse.usage.input_tokens + anthropicResponse.usage.output_tokens,
    };

    return {
      candidates: [{
        content: {
          parts: [{ text }],
          role: 'model',
        },
        finishReason: this.mapStopReason(anthropicResponse.stop_reason),
        index: 0,
      }],
      usageMetadata,
      modelVersion: originalModel,
    };
  }

  private async *processStreamResponse(
    responseStream: AsyncIterable<any>,
    originalModel: string
  ): AsyncGenerator<GenerateContentResponse> {
    let accumulatedText = '';
    let inputTokens = 0;
    let outputTokens = 0;

    for await (const event of responseStream) {
      if (event.chunk && event.chunk.bytes) {
        const chunkData = JSON.parse(new TextDecoder().decode(event.chunk.bytes));

        if (chunkData.type === 'message_start' && chunkData.message?.usage) {
          inputTokens = chunkData.message.usage.input_tokens || 0;
        } else if (chunkData.type === 'content_block_delta' && chunkData.delta?.text) {
          accumulatedText += chunkData.delta.text;
          outputTokens++;

          // Yield incremental response
          yield {
            candidates: [{
              content: {
                parts: [{ text: chunkData.delta.text }],
                role: 'model',
              },
              index: 0,
            }],
            modelVersion: originalModel,
          };
        } else if (chunkData.type === 'message_stop') {
          // Final chunk with usage metadata
          const usageMetadata: GenerateContentResponseUsageMetadata = {
            promptTokenCount: inputTokens,
            candidatesTokenCount: outputTokens,
            totalTokenCount: inputTokens + outputTokens,
          };

          yield {
            candidates: [{
              content: {
                parts: [{ text: '' }],
                role: 'model',
              },
              finishReason: 'STOP',
              index: 0,
            }],
            usageMetadata,
            modelVersion: originalModel,
          };
        }
      }
    }
  }

  private mapStopReason(stopReason: string): string {
    switch (stopReason) {
      case 'end_turn':
        return 'STOP';
      case 'max_tokens':
        return 'MAX_TOKENS';
      case 'stop_sequence':
        return 'STOP';
      default:
        return 'OTHER';
    }
  }

  private getAnthropicModelId(geminiModel: string): string {
    // Map Gemini model names to Anthropic model IDs
    const modelMap: Record<string, AnthropicModel> = {
      'gemini-2.0-flash': AnthropicModel.CLAUDE_3_5_SONNET,
      'gemini-1.5-pro': AnthropicModel.CLAUDE_3_5_SONNET,
      'gemini-1.5-flash': AnthropicModel.CLAUDE_3_5_HAIKU,
      'gemini-1.0-pro': AnthropicModel.CLAUDE_3_SONNET,
      'claude-3.5-sonnet': AnthropicModel.CLAUDE_3_5_SONNET,
      'claude-3.5-haiku': AnthropicModel.CLAUDE_3_5_HAIKU,
      'claude-3-opus': AnthropicModel.CLAUDE_3_OPUS,
      'claude-3-sonnet': AnthropicModel.CLAUDE_3_SONNET,
      'claude-3-haiku': AnthropicModel.CLAUDE_3_HAIKU,
    };

    return modelMap[geminiModel] || this.defaultModel;
  }

  private extractTextFromContents(contents: Content[]): string {
    return contents
      .flatMap(content => content.parts || [])
      .filter(part => part.text)
      .map(part => part.text)
      .join(' ');
  }

  // Method to list available models
  static getAvailableModels(): Array<{ id: AnthropicModel; name: string }> {
    return Object.entries(ANTHROPIC_MODEL_DISPLAY_NAMES).map(([id, name]) => ({
      id: id as AnthropicModel,
      name,
    }));
  }

  // Method to set the default model
  setDefaultModel(model: AnthropicModel): void {
    this.defaultModel = model;
  }
}