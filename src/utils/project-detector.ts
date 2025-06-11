import * as fs from 'fs-extra';
import * as path from 'path';
import { ProjectInfo } from '../types';

export async function detectProjectType(projectPath: string): Promise<ProjectInfo> {
  const packageJsonPath = path.join(projectPath, 'package.json');
  const hasPackageJson = await fs.pathExists(packageJsonPath);
  const hasGitRepo = await fs.pathExists(path.join(projectPath, '.git'));

  let projectType: ProjectInfo['type'] = 'unknown';
  let framework: string | undefined;
  let buildTool: string | undefined;

  if (hasPackageJson) {
    try {
      const packageJson = await fs.readJson(packageJsonPath);
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

      // Detect framework
      if (deps['next']) {
        projectType = 'nextjs';
        framework = 'Next.js';
      } else if (deps['react']) {
        projectType = 'react';
        framework = 'React';
      } else if (deps['vue']) {
        projectType = 'vue';
        framework = 'Vue';
      } else if (deps['@nestjs/core']) {
        projectType = 'nestjs';
        framework = 'NestJS';
      } else if (deps['express']) {
        projectType = 'express';
        framework = 'Express';
      }

      // Detect build tool
      if (deps['vite']) {
        buildTool = 'Vite';
      } else if (deps['webpack']) {
        buildTool = 'Webpack';
      } else if (deps['parcel']) {
        buildTool = 'Parcel';
      }
    } catch (error) {
      // Invalid package.json, treat as unknown
    }
  }

  return {
    type: projectType,
    hasPackageJson,
    hasGitRepo,
    framework,
    buildTool,
  };
}