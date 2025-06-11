import { execSync, spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs-extra';
import { AgpPushOptions } from '../types';
import { logger } from './logger';

// Helper function to execute commands asynchronously  
function execAsync(command: string, args?: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    let cmd: string;
    let cmdArgs: string[];
    
    if (args) {
      cmd = command;
      cmdArgs = args;
    } else {
      const parts = command.split(' ');
      cmd = parts[0] || '';
      cmdArgs = parts.slice(1);
    }
    
    if (!cmd) {
      reject(new Error('Empty command'));
      return;
    }
    
    const child = spawn(cmd, cmdArgs, { 
      stdio: ['ignore', 'ignore', 'ignore']
    });
    
    child.on('close', (code: number | null) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}: ${cmd} ${cmdArgs.join(' ')}`));
      }
    });
    
    child.on('error', (error: Error) => {
      reject(error);
    });
  });
}


export async function pushAgpChanges(options: AgpPushOptions): Promise<void> {
  const cwd = process.cwd();
  const agpPath = path.join(cwd, '.agp');

  // Check if .agp directory exists
  if (!(await fs.pathExists(agpPath))) {
    throw new Error('AGP directory not found. Run "agp init" first.');
  }

  // Check if .agp is a git repository
  const agpGitPath = path.join(agpPath, '.git');
  if (!(await fs.pathExists(agpGitPath))) {
    throw new Error('AGP directory is not a git repository. Please check your setup.');
  }

  try {
    // Change to .agp directory
    process.chdir(agpPath);

    // Check if there are any changes
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (!status.trim()) {
      logger.info('No changes to push');
      return;
    }

    const changedFiles = status.trim().split('\n');

    // Generate commit message if not provided
    const commitMessage = options.message || generateCommitMessage(changedFiles);

    // Use spinner for actual Git operations
    await logger.withSpinner(`Pushing ${changedFiles.length} AGP files`, async () => {
      // Execute git commands asynchronously to keep spinner running
      await execAsync('git', ['add', '.']);
      await execAsync('git', ['commit', '-m', commitMessage]);
      await execAsync('git', ['push']);

      // Update submodule reference in parent repository
      process.chdir(cwd);
      await execAsync('git', ['add', '.agp']);

      // Check if parent has changes to commit
      const parentStatus = execSync('git status --porcelain', { encoding: 'utf8' });
      if (parentStatus.includes('.agp')) {
        await execAsync('git', ['commit', '-m', 'chore: update AGP submodule pointer']);
      }
    });
  } catch (error) {
    throw new Error(`Failed to push AGP changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    // Always return to original directory
    process.chdir(cwd);
  }
}

function generateCommitMessage(changedFiles: string[]): string {
  const sessionFiles = changedFiles.filter((f) => f.includes('sessions/'));
  const knowledgeFiles = changedFiles.filter((f) => f.includes('project/'));
  const patternFiles = changedFiles.filter((f) => f.includes('patterns/'));
  const architectureFiles = changedFiles.filter((f) => f.includes('architecture/'));

  const parts = [];
  if (sessionFiles.length > 0) parts.push('session progress');
  if (knowledgeFiles.length > 0) parts.push('project knowledge');
  if (patternFiles.length > 0) parts.push('patterns');
  if (architectureFiles.length > 0) parts.push('architecture');

  if (parts.length === 0) return 'docs: update AGP knowledge';

  return `docs: update ${parts.join(', ')}`;
}
