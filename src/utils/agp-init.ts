import * as fs from 'fs-extra';
import * as path from 'path';
import { AgpInitOptions } from '../types';
import { detectProjectType } from './project-detector';
import { downloadTemplate } from './template-manager';
import { analyzeProject } from './project-analyzer';
import { logger } from './logger';

interface AgpConfig {
  session: {
    user: string;
    current: string;
  };
  submodule: {
    repository: string;
    lastUpdated: string;
  };
}

const DEFAULT_TEMPLATE_URL = 'https://github.com/bang9/agp-template.git';

export async function initializeAgpDirectory(options: AgpInitOptions): Promise<void> {
  const cwd = process.cwd();
  const agpPath = path.join(cwd, '.agp');
  const configPath = path.join(agpPath, '.config.json');


  // Check if .agp already exists
  if ((await fs.pathExists(agpPath)) && !options.force) {
    // Check if .agp directory is empty (cloned project case)
    const agpContents = await fs.readdir(agpPath);
    const nonHiddenFiles = agpContents.filter((file) => !file.startsWith('.'));

    if (nonHiddenFiles.length === 0) {
      await pullSubmoduleContent(cwd);
      return;
    } else {
      throw new Error('AGP directory already exists. Use --force to overwrite.');
    }
  }

  // Check if we're in a git repository
  const gitPath = path.join(cwd, '.git');
  if (!(await fs.pathExists(gitPath))) {
    throw new Error('AGP requires a Git repository. Please run "git init" first.');
  }

  // Backup existing config if force is enabled
  let existingConfig: AgpConfig | null = null;
  if (options.force && (await fs.pathExists(configPath))) {
    try {
      const configContent = await fs.readFile(configPath, 'utf8');
      existingConfig = JSON.parse(configContent);
    } catch (error) {
      // Cannot read existing config, will create new one
    }
  }

  // Setup AGP structure  
  const templateUrl = options.templateUrl || DEFAULT_TEMPLATE_URL;
  let detectedProjectInfo;
  
  await logger.withSpinner('Setting up AGP structure', async () => {
    detectedProjectInfo = await detectProjectType(cwd);
    
    // Remove existing .agp if force is enabled
    if (await fs.pathExists(agpPath)) {
      await fs.remove(agpPath);
    }
    
    // Download template
    await downloadTemplate(templateUrl, agpPath);
    
    // Ensure project directory exists
    const projectPath = path.join(agpPath, 'project');
    await fs.ensureDir(projectPath);
    
    // Analyze project and generate documentation
    await analyzeProject(cwd, detectedProjectInfo);
    
    // Create additional required directories and files
    await setupAdditionalStructure(agpPath);
  });

  // Initialize git submodule (has user interaction - outside spinner)
  const submoduleUrl = await initializeSubmodule(
    agpPath,
    existingConfig?.submodule?.repository || undefined,
    templateUrl,
  );

  // Finalize setup
  await logger.withSpinner('Finalizing setup', async () => {
    // Create or restore config file
    await createConfigFile(agpPath, existingConfig, submoduleUrl);
    
    // Validation step
    await validateAgpSetup(agpPath);
  });
}

async function initializeSubmodule(agpPath: string, existingUrl?: string, templateUrl?: string): Promise<string> {
  const { execSync } = await import('child_process');
  const inquirer = await import('inquirer');
  const cwd = process.cwd();

  // Handle Ctrl+C gracefully
  const originalDirectory = process.cwd();
  const cleanup = () => {
    try {
      process.chdir(originalDirectory);
    } catch {
      // Ignore cleanup errors
    }
  };

  process.on('SIGINT', () => {
    cleanup();
    logger.warning('Operation cancelled by user');
    process.exit(0);
  });

  let repositoryUrl: string = '';
  let success = false;
  let retryCount = 0;
  const maxRetries = 3;

  // Use existing URL if available
  if (existingUrl) {
    repositoryUrl = existingUrl;
    logger.info(`Using existing repository URL: ${existingUrl}`);
  } else {
    logger.info('AGP requires a remote repository for the .agp submodule.');
    logger.info('Please create an empty repository and provide the URL:');
    logger.info('Examples:');
    logger.step('git@github.com:username/my-project-agp.git');
    logger.step('https://github.com/username/my-project-agp.git');
  }

  while (!success && retryCount < maxRetries) {
    try {
      // Get repository URL from user if not already provided
      if (!repositoryUrl) {
        const answers = await inquirer.default.prompt([
          {
            type: 'input',
            name: 'repoUrl',
            message: 'Enter repository URL:',
            validate: (input: string) => {
              if (!input.trim()) {
                return 'Repository URL is required';
              }
              if (!isValidGitUrl(input.trim())) {
                return 'Please enter a valid Git repository URL';
              }
              return true;
            },
          },
        ]);

        repositoryUrl = answers.repoUrl.trim();
      }

      // Initialize .agp as a git repository
      logger.progress('Initializing .agp repository');
      process.chdir(agpPath);
      execSync('git init', { stdio: 'pipe' });
      execSync('git add .', { stdio: 'pipe' });
      execSync('git commit -m "Initial AGP setup"', { stdio: 'pipe' });
      logger.progressDone('.agp repository initialized');

      // Add remote origin
      logger.progress('Connecting to remote repository');
      execSync(`git remote add origin ${repositoryUrl}`, { stdio: 'pipe' });

      // Try to push to remote
      try {
        execSync('git push -u origin main', { stdio: 'pipe' });
        logger.progressDone('Remote repository connected');
      } catch (error) {
        // Repository might not be empty, ask user what to do
        process.chdir(cwd); // Go back to original directory first

        logger.warning('Repository contains existing content.');

        const action = await inquirer.default.prompt([
          {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
              { name: 'Overwrite with new template', value: 'overwrite' },
              { name: 'Merge with existing content', value: 'merge' },
              { name: 'Cancel and use different repository', value: 'cancel' },
            ],
          },
        ]);

        if (action.action === 'cancel') {
          // Remove the created .agp directory and start over
          await fs.remove(agpPath);
          await setupAgpDirectoryAgain(agpPath);
          repositoryUrl = '';
          continue; // Go back to asking for repository URL
        } else if (action.action === 'overwrite') {
          // Force push to overwrite existing content
          process.chdir(agpPath);

          // First try to pull and merge if possible
          try {
            execSync('git pull origin main --allow-unrelated-histories', { stdio: 'pipe' });
            execSync('git push origin main', { stdio: 'pipe' });
          } catch {
            // If pull fails, do a force push
            execSync('git push --force origin main', { stdio: 'pipe' });
          }
        } else if (action.action === 'merge') {
          // Clone existing repository first, then merge template
          await fs.remove(agpPath); // Remove current .agp
          execSync(`git submodule add ${repositoryUrl} .agp`, { cwd, stdio: 'pipe' });

          // Merge template content with existing
          await mergeTemplateWithExisting(agpPath, templateUrl!);

          // Commit merged changes
          process.chdir(agpPath);
          execSync('git add .', { stdio: 'pipe' });
          try {
            execSync('git commit -m "Merge AGP template with existing content"', { stdio: 'pipe' });
            execSync('git push origin main', { stdio: 'pipe' });
          } catch {
            // No changes to commit or push failed, that's ok
          }
        }

        process.chdir(cwd); // Return to original directory
      }

      // Return to parent directory
      process.chdir(cwd);

      // Remove .agp from parent git tracking (in case it was already tracked)
      try {
        execSync('git rm -rf --cached .agp', { stdio: 'pipe' });
      } catch {
        // Ignore if .agp wasn't tracked
      }

      // Add .agp as a submodule
      execSync(`git submodule add ${repositoryUrl} .agp`, { stdio: 'pipe' });

      success = true;
      return repositoryUrl;
    } catch (error) {
      process.chdir(cwd); // Ensure we're back in original directory

      // Clean up .agp directory if it was created
      if (await import('fs-extra').then((fs) => fs.pathExists(agpPath))) {
        await import('fs-extra').then((fs) => fs.remove(agpPath));
        // Recreate .agp with original content
        await setupAgpDirectoryAgain(agpPath);
      }

      retryCount++;

      logger.error(`Failed to connect to repository (attempt ${retryCount}/${maxRetries})`);
      logger.warning('Please check:');
      logger.step('Repository exists and is empty');
      logger.step('You have push permissions');
      logger.step('URL format is correct');
      logger.step('Repository is accessible');

      // Reset repository URL for retry if we haven't exceeded max retries
      if (retryCount < maxRetries) {
        repositoryUrl = '';
        if (existingUrl && retryCount === 1) {
          logger.warning('Cannot connect with existing URL. Please enter a new URL.');
        }
      } else {
        logger.error('Maximum retry attempts exceeded. Please check your repository and try again.');
        throw new Error('Failed to initialize submodule after maximum attempts');
      }
    }
  }

  // This should never be reached, but TypeScript requires it
  throw new Error('Failed to initialize submodule after multiple attempts');
}

function isValidGitUrl(url: string): boolean {
  // Check for common Git URL patterns
  const patterns = [
    /^git@[\w\.-]+:[\w\.-]+\/[\w\.-]+\.git$/, // SSH: git@github.com:user/repo.git
    /^https?:\/\/[\w\.-]+\/[\w\.-]+\/[\w\.-]+\.git$/, // HTTPS: https://github.com/user/repo.git
    /^https?:\/\/[\w\.-]+\/[\w\.-]+\/[\w\.-]+$/, // HTTPS without .git
  ];

  return patterns.some((pattern) => pattern.test(url));
}

async function setupAdditionalStructure(agpPath: string): Promise<void> {
  // Create sessions directory
  const sessionsPath = path.join(agpPath, 'sessions');
  await fs.ensureDir(sessionsPath);

  // Create .gitignore
  const gitignorePath = path.join(agpPath, '.gitignore');
  const gitignoreContent = `.config.json
*.tmp
`;
  await fs.writeFile(gitignorePath, gitignoreContent);
}

async function createConfigFile(
  agpPath: string,
  existingConfig: AgpConfig | null,
  submoduleUrl: string,
): Promise<void> {
  const configPath = path.join(agpPath, '.config.json');

  const config: AgpConfig = {
    session: existingConfig?.session || {
      user: '',
      current: '',
    },
    submodule: {
      repository: submoduleUrl,
      lastUpdated: new Date().toISOString(),
    },
  };

  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
}

async function validateAgpSetup(agpPath: string): Promise<void> {
  const requiredFiles = [
    'instructions.md',
    '.config.json',
    '.gitignore',
    'architecture/overview.md',
    'patterns/overview.md',
    'architecture/feature-domains.md',
    'architecture/project-overview.md',
  ];

  const requiredDirs = ['sessions', 'architecture', 'patterns', 'project'];

  // Check required files
  for (const file of requiredFiles) {
    const filePath = path.join(agpPath, file);
    if (!(await fs.pathExists(filePath))) {
      throw new Error(`Required file missing: ${file}`);
    }
  }

  // Check required directories
  for (const dir of requiredDirs) {
    const dirPath = path.join(agpPath, dir);
    if (!(await fs.pathExists(dirPath))) {
      throw new Error(`Required directory missing: ${dir}`);
    }
  }

  // Check Git submodule status
  const { execSync } = await import('child_process');
  const cwd = process.cwd();

  try {
    const submoduleStatus = execSync('git submodule status .agp', {
      cwd,
      encoding: 'utf8',
      stdio: 'pipe',
    });

    if (!submoduleStatus.trim()) {
      throw new Error('Git submodule not properly initialized');
    }

    // Validation passed
  } catch (error) {
    throw new Error('Git submodule validation failed');
  }
}

async function mergeTemplateWithExisting(agpPath: string, templateUrl: string): Promise<void> {
  // Create a temporary directory for template download
  const tempDir = path.join(agpPath, '.temp-template');
  await fs.ensureDir(tempDir);

  try {
    // Download template to temporary directory
    await downloadTemplate(templateUrl, tempDir);

    // Merge template files with existing content
    // Priority: existing files > template files (don't overwrite existing)
    const templateFiles = await fs.readdir(tempDir);

    for (const file of templateFiles) {
      const templateFilePath = path.join(tempDir, file);
      const targetFilePath = path.join(agpPath, file);

      if (!(await fs.pathExists(targetFilePath))) {
        // File doesn't exist in target, copy from template
        await fs.copy(templateFilePath, targetFilePath);
      } else if (file === 'instructions.md') {
        // Always update instructions.md from template
        await fs.copy(templateFilePath, targetFilePath);
      }
      // For other existing files, keep the existing version
    }

    // Clean up temporary directory
    await fs.remove(tempDir);
  } catch (error) {
    // Clean up on error
    await fs.remove(tempDir);
    throw error;
  }
}

async function pullSubmoduleContent(cwd: string): Promise<void> {
  const { execSync } = await import('child_process');

  try {
    // Initialize and update submodules
    execSync('git submodule init', { cwd, stdio: 'pipe' });
    execSync('git submodule update --remote', { cwd, stdio: 'pipe' });

    // Validate the setup
    const agpPath = path.join(cwd, '.agp');
    await validateAgpSetup(agpPath);
    logger.success('Submodule content pulled successfully!');
  } catch (error) {
    throw new Error(`Failed to pull submodule content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function setupAgpDirectoryAgain(agpPath: string): Promise<void> {
  // This function recreates the .agp directory structure after a failed submodule setup
  const fs = await import('fs-extra');
  const path = await import('path');

  await fs.ensureDir(agpPath);
  await fs.ensureDir(path.join(agpPath, 'architecture'));
  await fs.ensureDir(path.join(agpPath, 'patterns'));
  await fs.ensureDir(path.join(agpPath, 'project'));

  // Re-download template files if needed
  // For now, just recreate basic structure
}
