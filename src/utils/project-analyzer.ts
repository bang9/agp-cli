import * as fs from 'fs-extra';
import * as path from 'path';
import { ProjectInfo } from '../types';
import chalk from 'chalk';

interface SourceFile {
  path: string;
  relativePath: string;
  type: 'component' | 'hook' | 'util' | 'api' | 'page' | 'test' | 'config' | 'other';
  language: 'typescript' | 'javascript' | 'jsx' | 'tsx' | 'json' | 'other';
}

export async function analyzeProject(projectPath: string, projectInfo: ProjectInfo): Promise<void> {
  const agpPath = path.join(projectPath, '.agp');
  
  console.log(chalk.gray('🔍 Analyzing source files...'));
  
  // Find all source files
  const sourceFiles = await findSourceFiles(projectPath);
  console.log(chalk.gray(`📄 Found ${sourceFiles.length} source files`));
  
  // Generate architecture documentation
  await generateArchitectureFiles(agpPath, projectInfo, sourceFiles);
  
  // Generate pattern documentation
  await generatePatternFiles(agpPath, projectInfo, sourceFiles);
  
  // Generate initial knowledge files for existing source files
  console.log(chalk.gray('📝 Generating initial knowledge files...'));
  for (const file of sourceFiles.slice(0, 10)) { // Limit to first 10 files for demo
    await generateSourceFileKnowledge(agpPath, file);
  }
  
  if (sourceFiles.length > 10) {
    console.log(chalk.gray(`   ... and ${sourceFiles.length - 10} more files (knowledge files can be generated as needed)`));
  }
}

async function findSourceFiles(projectPath: string): Promise<SourceFile[]> {
  const sourceFiles: SourceFile[] = [];
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '.vue', '.py', '.go', '.rs'];
  const excludeDirs = ['node_modules', 'dist', 'build', '.git', '.agp', 'coverage'];
  
  async function scanDirectory(dirPath: string): Promise<void> {
    try {
      const items = await fs.readdir(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory() && !excludeDirs.includes(item)) {
          await scanDirectory(fullPath);
        } else if (stat.isFile()) {
          const ext = path.extname(item);
          if (extensions.includes(ext)) {
            const relativePath = path.relative(projectPath, fullPath);
            sourceFiles.push({
              path: fullPath,
              relativePath,
              type: determineFileType(relativePath),
              language: determineLanguage(ext),
            });
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  await scanDirectory(projectPath);
  return sourceFiles;
}

function determineFileType(filePath: string): SourceFile['type'] {
  const segments = filePath.toLowerCase().split('/');
  const fileName = path.basename(filePath, path.extname(filePath)).toLowerCase();
  
  if (segments.includes('components') || segments.includes('component')) return 'component';
  if (segments.includes('hooks') || segments.includes('hook') || fileName.startsWith('use')) return 'hook';
  if (segments.includes('utils') || segments.includes('utilities') || segments.includes('lib')) return 'util';
  if (segments.includes('api') || segments.includes('services')) return 'api';
  if (segments.includes('pages') || segments.includes('views') || segments.includes('screens')) return 'page';
  if (fileName.includes('test') || fileName.includes('spec') || segments.includes('__tests__')) return 'test';
  if (fileName.includes('config') || fileName === 'index') return 'config';
  
  return 'other';
}

function determineLanguage(extension: string): SourceFile['language'] {
  switch (extension) {
    case '.ts': return 'typescript';
    case '.tsx': return 'tsx';
    case '.js': return 'javascript';
    case '.jsx': return 'jsx';
    case '.json': return 'json';
    default: return 'other';
  }
}

async function generateArchitectureFiles(agpPath: string, projectInfo: ProjectInfo, sourceFiles: SourceFile[]): Promise<void> {
  const architecturePath = path.join(agpPath, 'architecture');
  
  // Generate feature domains based on directory structure
  const domains = extractFeatureDomains(sourceFiles);
  const featureDomainsContent = generateFeatureDomainsContent(domains, projectInfo);
  
  await fs.writeFile(path.join(architecturePath, 'feature-domains.md'), featureDomainsContent);
  
  // Generate project overview
  const projectOverviewContent = generateProjectOverviewContent(projectInfo, sourceFiles);
  await fs.writeFile(path.join(architecturePath, 'project-overview.md'), projectOverviewContent);
  
  console.log(chalk.gray('  📋 Architecture documentation generated'));
}

async function generatePatternFiles(agpPath: string, projectInfo: ProjectInfo, sourceFiles: SourceFile[]): Promise<void> {
  const patternsPath = path.join(agpPath, 'patterns');
  
  // Generate component patterns if this is a frontend project
  if (['react', 'nextjs', 'vue'].includes(projectInfo.type)) {
    const componentPatternContent = generateComponentPatternContent(sourceFiles);
    await fs.writeFile(path.join(patternsPath, 'component-patterns.md'), componentPatternContent);
  }
  
  // Generate API patterns if API files are found
  const apiFiles = sourceFiles.filter(f => f.type === 'api');
  if (apiFiles.length > 0) {
    const apiPatternContent = generateApiPatternContent(apiFiles);
    await fs.writeFile(path.join(patternsPath, 'api-patterns.md'), apiPatternContent);
  }
  
  console.log(chalk.gray('  🎨 Pattern documentation generated'));
}

function extractFeatureDomains(sourceFiles: SourceFile[]): Record<string, string[]> {
  const domains: Record<string, string[]> = {};
  
  sourceFiles.forEach(file => {
    const segments = file.relativePath.split('/');
    if (segments.length > 2) {
      const domain = segments[1]; // e.g., src/auth/... -> auth
      if (domain) {
        if (!domains[domain]) domains[domain] = [];
        domains[domain]!.push(file.relativePath);
      }
    }
  });
  
  return domains;
}

function generateFeatureDomainsContent(domains: Record<string, string[]>, projectInfo: ProjectInfo): string {
  return `# Feature Domains

This document maps the feature domains in this ${projectInfo.type} project.

${Object.keys(domains).map(domain => {
  const domainFiles = domains[domain] || [];
  const firstFile = domainFiles[0];
  const knowledgePath = firstFile ? firstFile.split('/').slice(0, -1).join('/') : domain;
  
  return `
## ${domain.charAt(0).toUpperCase() + domain.slice(1)}
- **Files**: ${domainFiles.slice(0, 3).join(', ')}${domainFiles.length > 3 ? ` and ${domainFiles.length - 3} more` : ''}
- **Knowledge**: .agp/project/${knowledgePath}/
`;
}).join('')}

## Adding New Features
When adding new features, follow the existing domain structure and create corresponding knowledge files in .agp/project/.
`;
}

function generateProjectOverviewContent(projectInfo: ProjectInfo, sourceFiles: SourceFile[]): string {
  const fileTypes = sourceFiles.reduce((acc, file) => {
    acc[file.type] = (acc[file.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return `# Project Overview

## Project Type
- **Framework**: ${projectInfo.framework || projectInfo.type}
- **Build Tool**: ${projectInfo.buildTool || 'Not detected'}
- **Package Manager**: ${projectInfo.hasPackageJson ? 'Detected' : 'None'}

## File Structure
${Object.entries(fileTypes).map(([type, count]) => `- **${type}**: ${count} files`).join('\n')}

## Architecture Notes
This is a ${projectInfo.type} project with ${sourceFiles.length} source files organized into a standard directory structure.

## Key Directories
${Array.from(new Set(sourceFiles.map(f => f.relativePath.split('/')[1]).filter(Boolean))).map(dir => `- \`${dir}/\` - Contains ${sourceFiles.filter(f => f.relativePath.includes(dir || '')).length} files`).join('\n')}
`;
}

function generateComponentPatternContent(sourceFiles: SourceFile[]): string {
  const componentFiles = sourceFiles.filter(f => f.type === 'component');
  
  return `# Component Patterns

This document describes the component patterns used in this project.

## Component Structure
- **Total Components**: ${componentFiles.length}
- **File Extension**: ${componentFiles[0]?.language || 'tsx'}

## Naming Convention
Components follow these patterns:
${componentFiles.slice(0, 5).map(f => `- \`${path.basename(f.relativePath)}\``).join('\n')}

## Directory Organization
Components are organized in: \`${componentFiles.length > 0 ? componentFiles[0]!.relativePath.split('/').slice(0, -1).join('/') : 'src/components'}\`

## Best Practices
- Use functional components with hooks
- Follow the established naming convention
- Keep components focused and single-purpose
- Document component props and usage in AGP knowledge files
`;
}

function generateApiPatternContent(apiFiles: SourceFile[]): string {
  return `# API Patterns

This document describes the API patterns used in this project.

## API Structure
- **Total API Files**: ${apiFiles.length}
- **Location**: \`${apiFiles.length > 0 ? apiFiles[0]!.relativePath.split('/').slice(0, -1).join('/') : 'src/api'}\`

## Files
${apiFiles.map(f => `- \`${f.relativePath}\``).join('\n')}

## Best Practices
- Keep API logic separate from UI components
- Use consistent error handling
- Document API endpoints and responses
- Follow RESTful conventions where applicable
`;
}

async function generateSourceFileKnowledge(agpPath: string, file: SourceFile): Promise<void> {
  const knowledgePath = path.join(agpPath, 'project', `${file.relativePath}.md`);
  const knowledgeDir = path.dirname(knowledgePath);
  
  await fs.ensureDir(knowledgeDir);
  
  const content = `# ${path.basename(file.relativePath)}

## Purpose
- ${file.type.charAt(0).toUpperCase() + file.type.slice(1)} file in ${file.language}
- Auto-generated knowledge file - update with specific implementation details

## Dependencies
- **Input**: (Files this depends on)
- **Output**: (Files that depend on this)
- **External**: (Third-party libraries)

## Context
- Located in \`${path.dirname(file.relativePath)}\`
- Type: ${file.type}
- Language: ${file.language}

## Gotchas
- (Add specific gotchas after implementation)

## Related
- **Patterns**: .agp/patterns/${file.type}-patterns.md
- **Architecture**: .agp/architecture/feature-domains.md
- **Similar**: (Add links to similar files)
`;

  await fs.writeFile(knowledgePath, content);
}