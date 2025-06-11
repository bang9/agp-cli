import { Command } from 'commander';
import { initializeAgpDirectory } from '../utils/agp-init';
import { logger } from '../utils/logger';

export const initCommand = new Command('init')
  .description('Initialize AGP system in the current project')
  .option('-f, --force', 'Force initialization even if .agp directory already exists')
  .option('--template <url>', 'Use custom template repository URL')
  .action(async (options) => {
    try {
      logger.info('Initializing AGP system...');
      
      await initializeAgpDirectory({
        force: options.force || false,
        templateUrl: options.template,
      });
      
      logger.success('AGP system initialized successfully!');
      logger.info('Next steps:');
      logger.step('Review .agp/instructions.md');
      logger.step('Start documenting your project with AGP');
      logger.step('Use "agp push" to save changes');
    } catch (error) {
      logger.error('Failed to initialize AGP system:');
      logger.error(error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });