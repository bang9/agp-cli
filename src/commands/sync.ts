import { Command } from 'commander';
import chalk from 'chalk';
import { syncAgpDirectory } from '../utils/agp-sync';

export const syncCommand = new Command('sync')
  .description('Commit and push .agp submodule changes')
  .option('-m, --message <msg>', 'Commit message', 'Update AGP knowledge')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🔄 Syncing AGP changes...'));
      
      await syncAgpDirectory({
        message: options.message,
      });
      
      console.log(chalk.green('✅ AGP changes synced successfully!'));
    } catch (error) {
      console.error(chalk.red('❌ Failed to sync AGP changes:'));
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
      process.exit(1);
    }
  });