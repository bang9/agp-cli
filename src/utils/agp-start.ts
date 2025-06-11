import * as fs from 'fs-extra';
import * as path from 'path';
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

export async function startAgpSession(): Promise<void> {
  const cwd = process.cwd();
  const agpPath = path.join(cwd, '.agp');
  const configPath = path.join(agpPath, '.config.json');

  logger.startGroup('Starting AGP Session');

  // Check if AGP is initialized
  if (!(await fs.pathExists(agpPath))) {
    throw new Error('AGP not initialized. Run "agp init" first.');
  }

  if (!(await fs.pathExists(configPath))) {
    throw new Error('AGP config not found. Run "agp init" to reinitialize.');
  }

  // Read existing config
  let config: AgpConfig;
  try {
    const configContent = await fs.readFile(configPath, 'utf8');
    config = JSON.parse(configContent);
  } catch (error) {
    throw new Error('Failed to read AGP config. Please run "agp init" to reinitialize.');
  }

  // Get or prompt for user name
  let userName = config.session.user;
  
  if (!userName || userName.trim() === '') {
    // Use readline for simpler input
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    userName = await new Promise<string>((resolve) => {
      rl.question('Enter your name: ', (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });

    if (!userName) {
      throw new Error('Name is required');
    }
  }

  // Create user session directory if it doesn't exist
  const userSessionDir = path.join(agpPath, 'sessions', userName);
  await fs.ensureDir(userSessionDir);

  // Create or load user session file
  const sessionFilePath = path.join(userSessionDir, 'index.md');
  const isNewUser = !(await fs.pathExists(sessionFilePath));

  if (isNewUser) {
    logger.info(`Welcome ${userName}! Creating your first session.`);
    await createNewSessionFile(sessionFilePath, userName);
  } else {
    logger.info(`Welcome back, ${userName}!`);
    await loadExistingSession(sessionFilePath);
  }

  // Update config with current user and session
  config.session.user = userName;
  config.session.current = `.agp/sessions/${userName}/index.md`;
  
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));

  logger.endGroup('Session started successfully!');
  logger.success(`Session file: .agp/sessions/${userName}/index.md`);

  // Show session overview
  await showSessionOverview(sessionFilePath);
}

async function createNewSessionFile(sessionFilePath: string, userName: string): Promise<void> {
  const sessionContent = `# ${userName} - Current Session

## Active Files
(No active files yet)

## In Progress
- [ ] Welcome to AGP! Start by exploring the project structure

## Blocked
(No blocked tasks)

## Next Up
- [ ] Read .agp/architecture/overview.md to understand project structure
- [ ] Review .agp/patterns/overview.md for implementation patterns

## Decisions Made
- ${new Date().toISOString().split('T')[0]} ${new Date().toTimeString().split(' ')[0]}: Started using AGP for project management

## Notes & Context
- First session created
- Ready to begin development work with AI assistance
`;

  await fs.writeFile(sessionFilePath, sessionContent);
  logger.success('New session file created');
}

async function loadExistingSession(sessionFilePath: string): Promise<void> {
  // Just validate that the file exists and is readable
  try {
    await fs.readFile(sessionFilePath, 'utf8');
    logger.success('Previous session loaded');
  } catch (error) {
    throw new Error('Failed to load existing session file');
  }
}

async function showSessionOverview(sessionFilePath: string): Promise<void> {
  try {
    const sessionContent = await fs.readFile(sessionFilePath, 'utf8');
    
    // Extract in-progress tasks
    const inProgressMatch = sessionContent.match(/## In Progress\n([\s\S]*?)(?=\n## |$)/);
    if (inProgressMatch && inProgressMatch[1]) {
      const tasks = inProgressMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('- [ ]'))
        .map(task => task.replace('- [ ]', '').trim())
        .filter(task => task.length > 0);

      if (tasks.length > 0) {
        logger.info('Current Tasks:');
        tasks.forEach(task => {
          logger.step(task);
        });
      }
    }

    // Extract active files
    const activeFilesMatch = sessionContent.match(/## Active Files\n([\s\S]*?)(?=\n## |$)/);
    if (activeFilesMatch && activeFilesMatch[1]) {
      const files = activeFilesMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('- ') && !line.includes('(No active files'))
        .map(line => line.replace(/^- /, '').trim())
        .filter(file => file.length > 0);

      if (files.length > 0) {
        logger.info('Active Files:');
        files.forEach(file => {
          logger.step(file);
        });
      }
    }

    logger.info('You can now start working! AI will automatically track your progress.');
    
  } catch (error) {
    // Don't throw, just skip the overview
    logger.debug('Could not show session overview');
  }
}