/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as os from 'node:os';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';

export interface ProxyCredentials {
  username: string;
  password: string;
  proxyUrl: string;
}

export interface ProxyAuthConfig {
  username?: string;
  password?: string;
  proxyHost: string;
  proxyPort: number;
  useSystemUser: boolean;
}

/**
 * Utility class for handling proxy authentication credentials
 */
export class ProxyAuthManager {
  private static readonly CONFIG_DIR = path.join(homedir(), '.gemini-cli');
  private static readonly CREDENTIALS_FILE = path.join(ProxyAuthManager.CONFIG_DIR, '.proxy-credentials');

  /**
   * Get the current system username (Windows only)
   */
  static getSystemUsername(): string | null {
    if (os.platform() !== 'win32') {
      return null;
    }

    return process.env['USERNAME'] || process.env['USER'] || null;
  }

  /**
   * Prompt user for proxy credentials and store them securely
   */
  static async promptForCredentials(config: Partial<ProxyAuthConfig> = {}): Promise<ProxyCredentials> {
    const readline = await import('node:readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const question = (query: string): Promise<string> => {
      return new Promise((resolve) => {
        rl.question(query, resolve);
      });
    };

    const questionHidden = (query: string): Promise<string> => {
      return new Promise((resolve) => {
        // Hide input for password
        const stdin = process.stdin;
        stdin.setRawMode && stdin.setRawMode(true);
        process.stdout.write(query);

        let password = '';
        const onData = (char: Buffer) => {
          const c = char.toString();
          switch (c) {
            case '\n':
            case '\r':
            case '\u0004': // Ctrl+D
              stdin.setRawMode && stdin.setRawMode(false);
              stdin.removeListener('data', onData);
              process.stdout.write('\n');
              resolve(password);
              break;
            case '\u0003': // Ctrl+C
              process.exit(1);
              break;
            case '\u007f': // Backspace
            case '\b':
              if (password.length > 0) {
                password = password.slice(0, -1);
                process.stdout.write('\b \b');
              }
              break;
            default:
              password += c;
              process.stdout.write('*');
          }
        };

        stdin.on('data', onData);
      });
    };

    try {
      console.log('\n🔐 Proxy Authentication Setup');
      console.log('This will configure your corporate proxy settings for Anthropic models via AWS Bedrock.\n');

      // Get or prompt for username
      let username = config.username;
      if (config.useSystemUser !== false) {
        const systemUser = ProxyAuthManager.getSystemUsername();
        if (systemUser) {
          const useSystemUser = await question(`Use system username "${systemUser}"? (Y/n): `);
          if (useSystemUser.toLowerCase() !== 'n') {
            username = systemUser;
          }
        }
      }

      if (!username) {
        username = await question('Enter your username: ');
      }

      // Always prompt for password (never store)
      const password = await questionHidden('Enter your password: ');

      // Construct proxy URL
      const host = config.proxyHost || 'primary-proxy.gslb.intranet.aaa.com';
      const port = config.proxyPort || 8080;
      const proxyUrl = `http://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}`;

      console.log('\n✅ Proxy credentials configured successfully!');
      console.log(`Proxy: ${host}:${port}`);
      console.log(`Username: ${username}\n`);

      rl.close();

      return {
        username,
        password,
        proxyUrl
      };
    } finally {
      rl.close();
    }
  }

  /**
   * Set up proxy environment variables
   */
  static setProxyEnvironment(credentials: ProxyCredentials): void {
    process.env['HTTPS_PROXY'] = credentials.proxyUrl;
    process.env['https_proxy'] = credentials.proxyUrl;
    process.env['HTTP_PROXY'] = credentials.proxyUrl;
    process.env['http_proxy'] = credentials.proxyUrl;

    // For AWS SDK
    process.env['AWS_HTTPS_PROXY'] = credentials.proxyUrl;
    process.env['AWS_HTTP_PROXY'] = credentials.proxyUrl;
  }

  /**
   * Store proxy configuration (username only, never password)
   */
  static async storeProxyConfig(username: string): Promise<void> {
    try {
      // Ensure config directory exists
      await fs.promises.mkdir(ProxyAuthManager.CONFIG_DIR, { recursive: true });

      const config = {
        username,
        timestamp: new Date().toISOString(),
      };

      await fs.promises.writeFile(
        ProxyAuthManager.CREDENTIALS_FILE,
        JSON.stringify(config, null, 2),
        { mode: 0o600 } // Read/write for owner only
      );
    } catch (error) {
      console.warn('Warning: Could not save proxy configuration:', error);
    }
  }

  /**
   * Load stored proxy configuration
   */
  static async loadProxyConfig(): Promise<{ username?: string } | null> {
    try {
      const configData = await fs.promises.readFile(ProxyAuthManager.CREDENTIALS_FILE, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      return null;
    }
  }

  /**
   * Clear stored proxy configuration
   */
  static async clearProxyConfig(): Promise<void> {
    try {
      await fs.promises.unlink(ProxyAuthManager.CREDENTIALS_FILE);
    } catch (error) {
      // File doesn't exist, that's fine
    }
  }

  /**
   * Check if proxy environment is properly configured
   */
  static isProxyConfigured(): boolean {
    const httpsProxy = process.env['HTTPS_PROXY'] || process.env['https_proxy'];
    const httpProxy = process.env['HTTP_PROXY'] || process.env['http_proxy'];

    return !!(httpsProxy || httpProxy);
  }

  /**
   * Validate proxy URL format
   */
  static validateProxyUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol) &&
             !!parsed.hostname &&
             !!parsed.port;
    } catch {
      return false;
    }
  }

  /**
   * Interactive proxy setup for new users
   */
  static async interactiveSetup(): Promise<void> {
    console.log('\n🚀 Welcome to Gemini CLI with Anthropic Support!');
    console.log('Let\'s set up your corporate proxy for AWS Bedrock access.\n');

    // Check if already configured
    if (ProxyAuthManager.isProxyConfigured()) {
      console.log('✅ Proxy is already configured in your environment.');
      console.log('Current HTTPS_PROXY:', process.env['HTTPS_PROXY'] || process.env['https_proxy']);
      return;
    }

    // Load any existing config
    const existingConfig = await ProxyAuthManager.loadProxyConfig();

    const config: Partial<ProxyAuthConfig> = {
      proxyHost: 'primary-proxy.gslb.intranet.aaa.com',
      proxyPort: 8080,
      useSystemUser: true,
      username: existingConfig?.username,
    };

    const credentials = await ProxyAuthManager.promptForCredentials(config);

    // Set environment variables
    ProxyAuthManager.setProxyEnvironment(credentials);

    // Store username for future use (but not password)
    await ProxyAuthManager.storeProxyConfig(credentials.username);

    console.log('🎉 Setup complete! You can now use Anthropic models via AWS Bedrock.');
    console.log('\nNext steps:');
    console.log('1. Ensure your AWS credentials are set (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)');
    console.log('2. Run: gemini anthropic --validate');
    console.log('3. Start using: gemini -m claude-3.5-sonnet "Hello world"\n');
  }
}