import { Command } from 'commander';
import chalk from 'chalk';
import { connectToAiTool } from '../utils/agp-connect';

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
      
      console.log(chalk.blue(`🔧 Configuring AGP for ${tool}...`));
      
      await connectToAiTool({
        tool: tool.toLowerCase(),
        configPath: options.config,
      });
      
      console.log(chalk.green(`✅ AGP configured for ${tool} successfully!`));
    } catch (error) {
      console.error(chalk.red('❌ Failed to configure AGP:'));
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
      process.exit(1);
    }
  });