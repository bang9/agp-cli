#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init';
import { createStartCommand } from './commands/start';
import { pushCommand } from './commands/push';
import { connectCommand } from './commands/connect';

const program = new Command();

program
  .name('agp')
  .description('Agentic Programming Project CLI - Standardized knowledge layer for AI-assisted development')
  .version('0.1.0');

// Register commands
program.addCommand(initCommand);
program.addCommand(createStartCommand());
program.addCommand(pushCommand);
program.addCommand(connectCommand);

// Parse command line arguments
program.parse();