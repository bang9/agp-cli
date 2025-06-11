import { Command } from 'commander';
import { pushAgpChanges } from '../utils/agp-push';
import { Logger } from '../utils/logger';

export const pushCommand = new Command('push')
  .description('Commit and push AGP knowledge changes to remote repository')
  .option('-m, --message <msg>', 'Commit message for AGP changes')
  .action(async (options) => {
    const logger = new Logger();
    
    try {
      logger.info('🚀 Pushing AGP knowledge changes...');
      
      await pushAgpChanges({
        message: options.message,
      });
      
      logger.success('✅ AGP knowledge pushed successfully!');
      logger.info('💡 Your AI session progress is now saved and shared');
    } catch (error) {
      logger.error('❌ Failed to push AGP changes:');
      logger.error(error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });