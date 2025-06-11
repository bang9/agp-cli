#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join } from 'path';
import { initCommand } from './commands/init';
import { createStartCommand } from './commands/start';
import { pushCommand } from './commands/push';
import { connectCommand } from './commands/connect';

// Read version from package.json
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));

const program = new Command();

program
  .name('agp')
  .description('Agentic Programming Project CLI - Standardized knowledge layer for AI-assisted development')
  .version(packageJson.version);

// Register commands
program.addCommand(initCommand);
program.addCommand(createStartCommand());
program.addCommand(pushCommand);
program.addCommand(connectCommand);

// Parse command line arguments
program.parse();