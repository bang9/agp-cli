#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init';
import { createStartCommand } from './commands/start';
import { syncCommand } from './commands/sync';
import { linkCommand } from './commands/link';
import { connectCommand } from './commands/connect';

const program = new Command();

program
  .name('agp')
  .description('Agentic Programming Project CLI - Standardized knowledge layer for AI-assisted development')
  .version('0.1.0');

// Register commands
program.addCommand(initCommand);
program.addCommand(createStartCommand());
program.addCommand(syncCommand);
program.addCommand(linkCommand);
program.addCommand(connectCommand);

// Error handling
program.exitOverride();

try {
  program.parse();
} catch (error) {
  console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error occurred');
  process.exit(1);
}