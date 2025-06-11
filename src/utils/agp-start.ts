import * as fs from 'fs-extra';
import * as path from 'path';

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
      output: process.stdout,
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
    await createNewSessionFile(sessionFilePath, userName);
  } else {
    await loadExistingSession(sessionFilePath);
  }

  // Update config with current user and session
  config.session.user = userName;
  config.session.current = `.agp/sessions/${userName}/index.md`;

  await fs.writeFile(configPath, JSON.stringify(config, null, 2));

  // Success handled by spinner
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
}

async function loadExistingSession(sessionFilePath: string): Promise<void> {
  // Just validate that the file exists and is readable
  try {
    await fs.readFile(sessionFilePath, 'utf8');
  } catch (error) {
    throw new Error('Failed to load existing session file');
  }
}

