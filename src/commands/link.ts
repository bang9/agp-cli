import { Command } from 'commander';
import chalk from 'chalk';
import { linkAgpRepository } from '../utils/agp-link';

export const linkCommand = new Command('link')
  .description('Link .agp directory to a different repository')
  .argument('<repository>', 'Git repository URL (e.g., git@github.com:user/repo.git)')
  .option('-f, --force', 'Force linking even if there are uncommitted changes')
  .action(async (repository, options) => {
    try {
      console.log(chalk.blue(`🔗 Linking AGP to repository: ${repository}`));
      
      await linkAgpRepository({
        repositoryUrl: repository,
        force: options.force || false,
      });
      
      console.log(chalk.green('✅ AGP repository linked successfully!'));
    } catch (error) {
      console.error(chalk.red('❌ Failed to link AGP repository:'));
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
      process.exit(1);
    }
  });