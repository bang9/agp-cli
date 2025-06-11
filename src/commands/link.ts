import { Command } from 'commander';
import { linkAgpRepository } from '../utils/agp-link';
import { logger } from '../utils/logger';

export const linkCommand = new Command('link')
  .description('Link .agp directory to a different repository')
  .argument('<repository>', 'Git repository URL (e.g., git@github.com:user/repo.git)')
  .option('-f, --force', 'Force linking even if there are uncommitted changes')
  .action(async (repository, options) => {
    try {
      logger.info(`Linking AGP to repository: ${repository}`);
      
      await linkAgpRepository({
        repositoryUrl: repository,
        force: options.force || false,
      });
      
      logger.success('AGP repository linked successfully!');
    } catch (error) {
      logger.error('Failed to link AGP repository:');
      logger.error(error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });