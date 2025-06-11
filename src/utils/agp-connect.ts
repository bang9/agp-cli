import * as fs from 'fs-extra';
import * as path from 'path';
import { AgpConnectOptions } from '../types';

export async function connectToAiTool(options: AgpConnectOptions): Promise<void> {
  const cwd = process.cwd();
  const agpPath = path.join(cwd, '.agp');

  // Check if .agp directory exists
  if (!(await fs.pathExists(agpPath))) {
    throw new Error('AGP directory not found. Run "agp init" first.');
  }

  const configPath = options.configPath || path.join(agpPath, 'config');
  await fs.ensureDir(configPath);

  switch (options.tool) {
    case 'claude':
      await setupClaudeConfig(configPath);
      break;
    case 'cursor':
      await setupCursorConfig(configPath);
      break;
    case 'chatgpt':
      await setupChatGptConfig(configPath);
      break;
    default:
      throw new Error(`Unsupported tool: ${options.tool}`);
  }
}

async function setupClaudeConfig(configPath: string): Promise<void> {
  const claudeConfig = {
    instructions: 'Read .agp/instructions.md for AGP system rules and workflows.',
    contextFiles: [
      '.agp/instructions.md',
      '.agp/architecture/overview.md',
      '.agp/patterns/overview.md',
    ],
    rules: [
      'Always read AGP knowledge files before starting work',
      'Update AGP documentation after making changes',
      'Follow the standardized knowledge file format',
    ],
  };

  const claudeConfigPath = path.join(configPath, 'claude.json');
  await fs.writeJson(claudeConfigPath, claudeConfig, { spaces: 2 });
}

async function setupCursorConfig(configPath: string): Promise<void> {
  const cursorConfig = {
    contextFiles: ['.agp/**/*.md'],
    instructions: 'This project uses AGP (Agentic Programming Project) for knowledge management. Read .agp/instructions.md for workflows.',
  };

  const cursorConfigPath = path.join(configPath, 'cursor.json');
  await fs.writeJson(cursorConfigPath, cursorConfig, { spaces: 2 });
}

async function setupChatGptConfig(configPath: string): Promise<void> {
  const instructions = `
# AGP System Instructions for ChatGPT

This project uses the Agentic Programming Project (AGP) system for knowledge management.

## Key Files to Read:
- .agp/instructions.md - Complete AGP system rules and workflows
- .agp/architecture/overview.md - Project architecture overview
- .agp/patterns/overview.md - Implementation patterns

## Workflow:
1. Before working on any file, read its corresponding .agp/project/{file-path}.md
2. For new features, start with architecture and patterns overviews
3. Always update AGP documentation after making changes
4. Follow the standardized knowledge file format

## Commands:
Use glob patterns to find knowledge files:
- .agp/project/src/components/*.md (for component knowledge)
- .agp/project/**/*.md (for all project knowledge)
`;

  const instructionsPath = path.join(configPath, 'chatgpt-instructions.md');
  await fs.writeFile(instructionsPath, instructions.trim());
}