import * as fs from 'fs-extra';
import * as path from 'path';
import fetch from 'node-fetch';
import * as yauzl from 'yauzl';
import { pipeline } from 'stream';
import { promisify } from 'util';

const pipelineAsync = promisify(pipeline);

export async function downloadTemplate(templateUrl: string, targetPath: string): Promise<void> {
  // Ensure target directory doesn't exist
  if (await fs.pathExists(targetPath)) {
    await fs.remove(targetPath);
  }

  try {
    // Convert git URL to ZIP download URL
    const zipUrl = convertGitUrlToZip(templateUrl);

    // Create target directory
    await fs.ensureDir(targetPath);

    // Download ZIP file
    const tempZipPath = path.join(targetPath, 'template.zip');
    await downloadZipFile(zipUrl, tempZipPath);

    // Extract ZIP file
    await extractZipFile(tempZipPath, targetPath);

    // Clean up
    await fs.remove(tempZipPath);

    // Remove template-specific files that shouldn't be in user projects
    const filesToRemove = ['.github', 'README.md', 'LICENSE'];
    for (const file of filesToRemove) {
      const filePath = path.join(targetPath, file);
      if (await fs.pathExists(filePath)) {
        await fs.remove(filePath);
      }
    }
  } catch (error) {
    throw new Error(`Failed to download template: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function convertGitUrlToZip(gitUrl: string): string {
  // Convert various git URL formats to GitHub ZIP download URL
  let repoUrl = gitUrl;

  // Remove .git suffix if present
  if (repoUrl.endsWith('.git')) {
    repoUrl = repoUrl.slice(0, -4);
  }

  // Convert SSH URL to HTTPS
  if (repoUrl.startsWith('git@github.com:')) {
    repoUrl = repoUrl.replace('git@github.com:', 'https://github.com/');
  }

  // Ensure it's a GitHub URL
  if (!repoUrl.includes('github.com')) {
    throw new Error('Only GitHub repositories are supported');
  }

  // Convert to ZIP download URL
  return `${repoUrl}/archive/refs/heads/main.zip`;
}

async function downloadZipFile(zipUrl: string, outputPath: string): Promise<void> {
  const response = await fetch(zipUrl);

  if (!response.ok) {
    throw new Error(`Failed to download template: ${response.status} ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error('No response body received');
  }

  const fileStream = fs.createWriteStream(outputPath);
  await pipelineAsync(response.body, fileStream);
}

async function extractZipFile(zipPath: string, extractPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
      if (err || !zipfile) {
        reject(err || new Error('Failed to open ZIP file'));
        return;
      }

      let pendingEntries = 0;
      let completed = false;

      const complete = () => {
        if (!completed && pendingEntries === 0) {
          completed = true;
          resolve();
        }
      };

      zipfile.readEntry();

      zipfile.on('entry', (entry) => {
        // Skip the root directory (e.g., "agp-template-main/")
        const relativePath = entry.fileName.split('/').slice(1).join('/');

        if (!relativePath) {
          zipfile.readEntry();
          return;
        }

        const fullPath = path.join(extractPath, relativePath);

        if (/\/$/.test(entry.fileName)) {
          // Directory entry
          fs.ensureDir(fullPath)
            .then(() => zipfile.readEntry())
            .catch(reject);
        } else {
          // File entry
          pendingEntries++;

          zipfile.openReadStream(entry, (err, readStream) => {
            if (err || !readStream) {
              reject(err || new Error('Failed to open read stream'));
              return;
            }

            // Ensure parent directory exists
            fs.ensureDir(path.dirname(fullPath))
              .then(() => {
                const writeStream = fs.createWriteStream(fullPath);

                writeStream.on('close', () => {
                  pendingEntries--;
                  complete();
                  zipfile.readEntry();
                });

                writeStream.on('error', reject);
                readStream.pipe(writeStream);
              })
              .catch(reject);
          });
        }
      });

      zipfile.on('end', complete);
      zipfile.on('error', reject);
    });
  });
}
