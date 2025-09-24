/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule } from 'yargs';
import { handleAnthropicCommand, type AnthropicCommandOptions } from './anthropic.js';
import { handleProxySetupCommand, type ProxySetupCommandOptions } from './proxy-setup.js';

export const anthropicCommand: CommandModule = {
  command: 'anthropic',
  describe: 'Manage Anthropic Claude models for AWS Bedrock',
  builder: (yargs) =>
    yargs
      .option('list-models', {
        type: 'boolean',
        description: 'List all available Anthropic Claude models',
        alias: 'l',
      })
      .option('show-config', {
        type: 'boolean',
        description: 'Show current Anthropic configuration',
        alias: 'c',
      })
      .option('set-model', {
        type: 'string',
        description: 'Set the Anthropic model to use',
        alias: 'm',
      })
      .option('recommend', {
        type: 'string',
        choices: ['coding', 'analysis', 'general', 'fast'] as const,
        description: 'Get model recommendation for task type',
        alias: 'r',
      })
      .option('filter', {
        type: 'string',
        choices: ['cost', 'speed', 'capability'] as const,
        description: 'Filter models by criteria',
        alias: 'f',
      })
      .option('validate', {
        type: 'boolean',
        description: 'Validate AWS environment setup',
        alias: 'v',
      })
      .help()
      .example('$0 anthropic --list-models', 'List all available models')
      .example('$0 anthropic --set-model claude-3.5-sonnet', 'Set default model')
      .example('$0 anthropic --recommend coding', 'Get coding recommendations')
      .example('$0 anthropic --validate', 'Check AWS configuration'),
  handler: async (argv) => {
    const options: AnthropicCommandOptions = {
      listModels: argv['list-models'] as boolean,
      showConfig: argv['show-config'] as boolean,
      setModel: argv['set-model'] as string,
      recommend: argv.recommend as 'coding' | 'analysis' | 'general' | 'fast',
      filter: argv.filter as 'cost' | 'speed' | 'capability',
    };

    if (argv.validate) {
      // Import dynamically to avoid circular dependencies
      const { AnthropicCommand } = await import('./anthropic.js');
      AnthropicCommand.validateEnvironment();
      return;
    }

    handleAnthropicCommand(options);
  },
};

export const proxySetupCommand: CommandModule = {
  command: 'proxy-setup',
  describe: 'Configure corporate proxy authentication for AWS Bedrock',
  builder: (yargs) =>
    yargs
      .option('interactive', {
        type: 'boolean',
        description: 'Interactive proxy authentication setup',
        alias: 'i',
      })
      .option('status', {
        type: 'boolean',
        description: 'Show current proxy configuration status',
        alias: 's',
      })
      .option('clear', {
        type: 'boolean',
        description: 'Clear stored proxy configuration',
        alias: 'c',
      })
      .help()
      .example('$0 proxy-setup --interactive', 'Set up proxy interactively')
      .example('$0 proxy-setup --status', 'Check current proxy status')
      .example('$0 proxy-setup --clear', 'Clear proxy settings'),
  handler: async (argv) => {
    const options: ProxySetupCommandOptions = {
      interactive: argv.interactive as boolean,
      status: argv.status as boolean,
      clear: argv.clear as boolean,
    };

    await handleProxySetupCommand(options);
  },
};