/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProxyAuthManager } from '@google/gemini-cli-core/utils/proxyAuth.js';

export interface ProxySetupCommandOptions {
  interactive?: boolean;
  clear?: boolean;
  status?: boolean;
  username?: string;
}

export class ProxySetupCommand {
  static async handleCommand(options: ProxySetupCommandOptions): Promise<void> {
    if (options.clear) {
      await ProxySetupCommand.clearProxyConfig();
      return;
    }

    if (options.status) {
      await ProxySetupCommand.showStatus();
      return;
    }

    if (options.interactive) {
      await ProxyAuthManager.interactiveSetup();
      return;
    }

    // Default behavior - show usage
    ProxySetupCommand.printUsage();
  }

  static async clearProxyConfig(): Promise<void> {
    console.log('🧹 Clearing proxy configuration...');
    await ProxyAuthManager.clearProxyConfig();

    // Clear environment variables
    delete process.env['HTTPS_PROXY'];
    delete process.env['https_proxy'];
    delete process.env['HTTP_PROXY'];
    delete process.env['http_proxy'];
    delete process.env['AWS_HTTPS_PROXY'];
    delete process.env['AWS_HTTP_PROXY'];

    console.log('✅ Proxy configuration cleared.');
    console.log('Note: You may need to restart your shell for changes to take full effect.');
  }

  static async showStatus(): Promise<void> {
    console.log('\n🔍 Proxy Configuration Status\n');

    // Check environment variables
    const httpsProxy = process.env['HTTPS_PROXY'] || process.env['https_proxy'];
    const httpProxy = process.env['HTTP_PROXY'] || process.env['http_proxy'];
    const awsHttpsProxy = process.env['AWS_HTTPS_PROXY'];
    const awsHttpProxy = process.env['AWS_HTTP_PROXY'];

    if (httpsProxy) {
      console.log(`✅ HTTPS_PROXY: ${ProxySetupCommand.maskCredentials(httpsProxy)}`);
    } else {
      console.log('❌ HTTPS_PROXY: Not set');
    }

    if (httpProxy && httpProxy !== httpsProxy) {
      console.log(`✅ HTTP_PROXY: ${ProxySetupCommand.maskCredentials(httpProxy)}`);
    }

    if (awsHttpsProxy) {
      console.log(`✅ AWS_HTTPS_PROXY: ${ProxySetupCommand.maskCredentials(awsHttpsProxy)}`);
    }

    if (awsHttpProxy && awsHttpProxy !== awsHttpsProxy) {
      console.log(`✅ AWS_HTTP_PROXY: ${ProxySetupCommand.maskCredentials(awsHttpProxy)}`);
    }

    // Check stored configuration
    const storedConfig = await ProxyAuthManager.loadProxyConfig();
    if (storedConfig?.username) {
      console.log(`\n📁 Stored username: ${storedConfig.username}`);
    } else {
      console.log('\n📁 No stored configuration found');
    }

    // Overall status
    const isConfigured = ProxyAuthManager.isProxyConfigured();
    console.log(`\n🎯 Proxy Status: ${isConfigured ? '✅ Configured' : '❌ Not configured'}`);

    if (!isConfigured) {
      console.log('\n💡 To set up proxy authentication, run:');
      console.log('   gemini proxy-setup --interactive');
    }

    console.log('');
  }

  private static maskCredentials(url: string): string {
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.username) {
        const maskedPassword = parsedUrl.password ? '***' : '';
        parsedUrl.username = parsedUrl.username;
        parsedUrl.password = maskedPassword;
        return parsedUrl.toString();
      }
      return url;
    } catch {
      return url;
    }
  }

  static printUsage(): void {
    console.log(`
🔐 Proxy Setup Commands:

gemini proxy-setup --interactive         Interactive proxy authentication setup
gemini proxy-setup --status              Show current proxy configuration status
gemini proxy-setup --clear               Clear stored proxy configuration

📝 Description:
   This command helps you configure corporate proxy settings for accessing
   Anthropic models via AWS Bedrock. It supports Windows integrated auth
   and secure credential handling.

🔧 Environment Variables:
   The setup will configure these environment variables:
   - HTTPS_PROXY / https_proxy
   - HTTP_PROXY / http_proxy
   - AWS_HTTPS_PROXY / AWS_HTTP_PROXY (for AWS SDK)

🏢 Corporate Setup:
   Default proxy: primary-proxy.gslb.intranet.aaa.com:8080
   Username: Automatically detected from Windows (USERNAME env var)
   Password: Prompted securely (not stored)

💡 Next Steps:
   1. Run: gemini proxy-setup --interactive
   2. Verify: gemini anthropic --validate
   3. Test: gemini -m claude-3.5-sonnet "Hello world"
`);
  }
}

export function handleProxySetupCommand(options: ProxySetupCommandOptions): Promise<void> {
  return ProxySetupCommand.handleCommand(options);
}