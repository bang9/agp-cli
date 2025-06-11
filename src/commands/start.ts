import { Command } from 'commander';
import { startAgpSession } from '../utils/agp-start';
import { logger } from '../utils/logger';

export function createStartCommand(): Command {
  const command = new Command('start');

  command.description('Start or resume AGP session').action(async () => {
    try {
      await startAgpSession();
    } catch (error) {
      logger.error(`Failed to start AGP session: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

  return command;
}
