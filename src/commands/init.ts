import { Command } from 'commander';
import { initializeAgpDirectory } from '../utils/agp-init';
import { logger } from '../utils/logger';

export const initCommand = new Command('init')
  .description('Initialize AGP system in the current project')
  .option('-f, --force', 'Force initialization even if .agp directory already exists')
  .option('--template <url>', 'Use custom template repository URL')
  .action(async (options) => {
    try {
      await initializeAgpDirectory({
        force: options.force || false,
        templateUrl: options.template,
      });
    } catch (error) {
      logger.error('Failed to initialize AGP system:');
      logger.error(error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });
