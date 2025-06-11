import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs-extra';
import { AgpSyncOptions } from '../types';

export async function syncAgpDirectory(options: AgpSyncOptions): Promise<void> {
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
      console.log('No changes to sync.');
      return;
    }

    // Add all changes
    execSync('git add .', { stdio: 'inherit' });

    // Commit changes
    execSync(`git commit -m "${options.message}"`, { stdio: 'inherit' });

    // Push changes
    execSync('git push', { stdio: 'inherit' });

    // Update submodule reference in parent repository
    process.chdir(cwd);
    execSync('git add .agp', { stdio: 'inherit' });
    
    // Check if parent has changes to commit
    const parentStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    if (parentStatus.includes('.agp')) {
      execSync(`git commit -m "Update AGP submodule"`, { stdio: 'inherit' });
    }
  } catch (error) {
    throw new Error(`Failed to sync AGP: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    // Always return to original directory
    process.chdir(cwd);
  }
}