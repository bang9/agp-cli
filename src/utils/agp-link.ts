import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs-extra';
import { AgpLinkOptions } from '../types';

export async function linkAgpRepository(options: AgpLinkOptions): Promise<void> {
  const cwd = process.cwd();
  const agpPath = path.join(cwd, '.agp');

  // Check if .agp directory exists
  if (!(await fs.pathExists(agpPath))) {
    throw new Error('AGP directory not found. Run "agp init" first.');
  }

  try {
    // Change to .agp directory
    process.chdir(agpPath);

    // Check for uncommitted changes
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim() && !options.force) {
      throw new Error('Uncommitted changes in .agp directory. Commit them first or use --force.');
    }

    // Remove current remote
    try {
      execSync('git remote remove origin', { stdio: 'pipe' });
    } catch {
      // Remote might not exist, continue
    }

    // Add new remote
    execSync(`git remote add origin ${options.repositoryUrl}`, { stdio: 'inherit' });

    // Try to push to new remote
    try {
      execSync('git push -u origin main', { stdio: 'inherit' });
    } catch {
      // If push fails, try to pull and merge
      try {
        execSync('git pull origin main --allow-unrelated-histories', { stdio: 'inherit' });
        execSync('git push -u origin main', { stdio: 'inherit' });
      } catch (error) {
        throw new Error(`Failed to sync with new repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Update submodule URL in parent repository
    process.chdir(cwd);
    
    // Update .gitmodules file
    const gitmodulesPath = path.join(cwd, '.gitmodules');
    if (await fs.pathExists(gitmodulesPath)) {
      let gitmodules = await fs.readFile(gitmodulesPath, 'utf8');
      gitmodules = gitmodules.replace(/url = .+/g, `url = ${options.repositoryUrl}`);
      await fs.writeFile(gitmodulesPath, gitmodules);
      
      execSync('git add .gitmodules', { stdio: 'inherit' });
      execSync('git commit -m "Update AGP submodule URL"', { stdio: 'inherit' });
    }
  } catch (error) {
    throw new Error(`Failed to link repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    // Always return to original directory
    process.chdir(cwd);
  }
}