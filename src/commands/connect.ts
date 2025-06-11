import { Command } from 'commander';
import { connectToAiTool } from '../utils/agp-connect';
import { logger } from '../utils/logger';

export const connectCommand = new Command('connect')
  .description('Configure AGP for specific AI tools')
  .argument('<tool>', 'AI tool to configure (claude, cursor, chatgpt)')
  .option('--config <path>', 'Custom configuration file path')
  .action(async (tool, options) => {
    try {
      const supportedTools = ['claude', 'cursor', 'chatgpt'];

      if (!supportedTools.includes(tool.toLowerCase())) {
        throw new Error(`Unsupported tool: ${tool}. Supported tools: ${supportedTools.join(', ')}`);
      }

      await logger.withSpinner(`Configuring ${tool}`, async () => {
        await connectToAiTool({
          tool: tool.toLowerCase(),
          configPath: options.config,
        });
      });
    } catch (error) {
      logger.error('Failed to configure AGP:');
      logger.error(error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });
