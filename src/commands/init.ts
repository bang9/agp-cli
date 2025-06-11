import { Command } from 'commander';
import chalk from 'chalk';
import { initializeAgpDirectory } from '../utils/agp-init';

export const initCommand = new Command('init')
  .description('Initialize AGP system in the current project')
  .option('-f, --force', 'Force initialization even if .agp directory already exists')
  .option('--template <url>', 'Use custom template repository URL')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🚀 Initializing AGP system...'));
      
      await initializeAgpDirectory({
        force: options.force || false,
        templateUrl: options.template,
      });
      
      console.log(chalk.green('✅ AGP system initialized successfully!'));
      console.log(chalk.gray('Next steps:'));
      console.log(chalk.gray('  1. Review .agp/instructions.md'));
      console.log(chalk.gray('  2. Start documenting your project with AGP'));
      console.log(chalk.gray('  3. Use "agp sync" to save changes'));
    } catch (error) {
      console.error(chalk.red('❌ Failed to initialize AGP system:'));
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
      process.exit(1);
    }
  });