import { Command } from 'commander';
import { pushAgpChanges } from '../utils/agp-push';
import { logger } from '../utils/logger';

export const pushCommand = new Command('push')
  .description('Commit and push AGP knowledge changes to remote repository')
  .option('-m, --message <msg>', 'Commit message for AGP changes')
  .action(async (options) => {

    try {
      await logger.withSpinner('Pushing changes', async () => {
        await pushAgpChanges({
          message: options.message,
        });
      });
    } catch (error) {
      logger.error('Failed to push AGP changes:');
      logger.error(error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });
