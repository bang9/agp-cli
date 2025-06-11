import * as fs from 'fs-extra';
import * as path from 'path';
import { ProjectInfo } from '../types';
import { Logger } from './logger';

interface SourceFile {
  path: string;
  relativePath: string;
  type: 'source' | 'test' | 'config' | 'docs' | 'build' | 'other';
  language: string;
}

export async function analyzeProject(projectPath: string, projectInfo: ProjectInfo): Promise<void> {
  const agpPath = path.join(projectPath, '.agp');
  const logger = new Logger();

  logger.info('🔍 Analyzing source files...');

  // Find all source files
  const sourceFiles = await findSourceFiles(projectPath);
  logger.info(`📄 Found ${sourceFiles.length} source files`);

  // Generate architecture documentation
  await generateArchitectureFiles(agpPath, projectInfo, sourceFiles, logger);

  // Generate pattern documentation
  await generatePatternFiles(agpPath, projectInfo, sourceFiles, logger);

  // Generate initial knowledge files for existing source files
  logger.info('📝 Generating initial knowledge files...');
  for (const file of sourceFiles.slice(0, 10)) {
    // Limit to first 10 files for demo
    await generateSourceFileKnowledge(agpPath, file);
  }

  if (sourceFiles.length > 10) {
    logger.info(`   ... and ${sourceFiles.length - 10} more files (knowledge files can be generated as needed)`);
  }
}

async function findSourceFiles(projectPath: string): Promise<SourceFile[]> {
  const sourceFiles: SourceFile[] = [];
  const extensions = [
    // JavaScript/TypeScript
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.mjs',
    '.cjs',
    // Web
    '.vue',
    '.svelte',
    '.html',
    '.css',
    '.scss',
    '.sass',
    '.less',
    // Backend languages
    '.py',
    '.go',
    '.rs',
    '.java',
    '.kt',
    '.scala',
    '.rb',
    '.php',
    '.cs',
    '.fs',
    '.vb',
    // Systems programming
    '.c',
    '.cpp',
    '.cc',
    '.cxx',
    '.h',
    '.hpp',
    '.hxx',
    // Functional
    '.hs',
    '.elm',
    '.clj',
    '.cljs',
    '.ml',
    '.mli',
    // Data/Config
    '.sql',
    '.json',
    '.yaml',
    '.yml',
    '.toml',
    '.xml',
    // Mobile
    '.swift',
    '.dart',
    '.m',
    '.mm',
    // Shell/Scripts
    '.sh',
    '.bash',
    '.zsh',
    '.ps1',
    '.py',
    '.pl',
    // Other
    '.r',
    '.jl',
    '.nim',
    '.zig',
    '.odin',
  ];
  const excludeDirs = [
    'node_modules',
    'dist',
    'build',
    '.git',
    '.agp',
    'coverage',
    'target',
    'bin',
    'obj',
    '__pycache__',
    '.venv',
    'venv',
    'vendor',
    '.idea',
    '.vscode',
    'tmp',
    'temp',
  ];

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
  const ext = path.extname(filePath).toLowerCase();

  // Test files
  if (
    fileName.includes('test') ||
    fileName.includes('spec') ||
    segments.includes('__tests__') ||
    segments.includes('tests') ||
    segments.includes('test') ||
    segments.includes('spec')
  )
    return 'test';

  // Config files
  if (
    fileName.includes('config') ||
    fileName === 'index' ||
    ['.json', '.yaml', '.yml', '.toml', '.xml'].includes(ext) ||
    segments.includes('config') ||
    segments.includes('configuration')
  )
    return 'config';

  // Documentation
  if (
    ['.md', '.rst', '.txt'].includes(ext) ||
    segments.includes('docs') ||
    segments.includes('doc') ||
    segments.includes('documentation')
  )
    return 'docs';

  // Build/deployment related
  if (
    segments.includes('build') ||
    segments.includes('scripts') ||
    segments.includes('deploy') ||
    segments.includes('ci') ||
    fileName.includes('docker') ||
    fileName.includes('make')
  )
    return 'build';

  // Everything else is source code
  return 'source';
}

function determineLanguage(extension: string): string {
  const langMap: Record<string, string> = {
    // JavaScript/TypeScript
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.mjs': 'javascript',
    '.cjs': 'javascript',
    // Web
    '.vue': 'vue',
    '.svelte': 'svelte',
    '.html': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.sass': 'sass',
    '.less': 'less',
    // Backend
    '.py': 'python',
    '.go': 'go',
    '.rs': 'rust',
    '.java': 'java',
    '.kt': 'kotlin',
    '.scala': 'scala',
    '.rb': 'ruby',
    '.php': 'php',
    '.cs': 'csharp',
    '.fs': 'fsharp',
    '.vb': 'vbnet',
    // Systems
    '.c': 'c',
    '.cpp': 'cpp',
    '.cc': 'cpp',
    '.cxx': 'cpp',
    '.h': 'c',
    '.hpp': 'cpp',
    '.hxx': 'cpp',
    // Functional
    '.hs': 'haskell',
    '.elm': 'elm',
    '.clj': 'clojure',
    '.cljs': 'clojurescript',
    '.ml': 'ocaml',
    '.mli': 'ocaml',
    // Data/Config
    '.json': 'json',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.toml': 'toml',
    '.xml': 'xml',
    '.sql': 'sql',
    // Mobile
    '.swift': 'swift',
    '.dart': 'dart',
    '.m': 'objectivec',
    '.mm': 'objectivec',
    // Shell/Scripts
    '.sh': 'shell',
    '.bash': 'bash',
    '.zsh': 'zsh',
    '.ps1': 'powershell',
    '.pl': 'perl',
    // Other
    '.r': 'r',
    '.jl': 'julia',
    '.nim': 'nim',
    '.zig': 'zig',
    '.odin': 'odin',
  };

  return langMap[extension.toLowerCase()] || 'other';
}

async function generateArchitectureFiles(
  agpPath: string,
  projectInfo: ProjectInfo,
  sourceFiles: SourceFile[],
  logger: Logger,
): Promise<void> {
  const architecturePath = path.join(agpPath, 'architecture');

  // Generate feature domains based on directory structure
  const domains = extractFeatureDomains(sourceFiles);
  const featureDomainsContent = generateFeatureDomainsContent(domains, projectInfo);

  await fs.writeFile(path.join(architecturePath, 'feature-domains.md'), featureDomainsContent);

  // Generate project overview
  const projectOverviewContent = generateProjectOverviewContent(projectInfo, sourceFiles);
  await fs.writeFile(path.join(architecturePath, 'project-overview.md'), projectOverviewContent);

  logger.info('  📋 Architecture documentation generated');
}

async function generatePatternFiles(
  agpPath: string,
  projectInfo: ProjectInfo,
  sourceFiles: SourceFile[],
  logger: Logger,
): Promise<void> {
  const patternsPath = path.join(agpPath, 'patterns');

  // Generate code organization patterns based on detected directory structure
  const sourceCodeFiles = sourceFiles.filter((f) => f.type === 'source');
  if (sourceCodeFiles.length > 0) {
    const codePatternContent = generateCodeOrganizationPatternContent(sourceCodeFiles, projectInfo);
    await fs.writeFile(path.join(patternsPath, 'code-organization-patterns.md'), codePatternContent);
  }

  // Generate testing patterns if test files are found
  const testFiles = sourceFiles.filter((f) => f.type === 'test');
  if (testFiles.length > 0) {
    const testPatternContent = generateTestPatternContent(testFiles);
    await fs.writeFile(path.join(patternsPath, 'testing-patterns.md'), testPatternContent);
  }

  logger.info('  🎨 Pattern documentation generated');
}

function extractFeatureDomains(sourceFiles: SourceFile[]): Record<string, string[]> {
  const domains: Record<string, string[]> = {};

  sourceFiles.forEach((file) => {
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

${Object.keys(domains)
  .map((domain) => {
    const domainFiles = domains[domain] || [];
    const firstFile = domainFiles[0];
    const knowledgePath = firstFile ? firstFile.split('/').slice(0, -1).join('/') : domain;

    return `
## ${domain.charAt(0).toUpperCase() + domain.slice(1)}
- **Files**: ${domainFiles.slice(0, 3).join(', ')}${domainFiles.length > 3 ? ` and ${domainFiles.length - 3} more` : ''}
- **Knowledge**: .agp/project/${knowledgePath}/
`;
  })
  .join('')}

## Adding New Features
When adding new features, follow the existing domain structure and create corresponding knowledge files in .agp/project/.
`;
}

function generateProjectOverviewContent(projectInfo: ProjectInfo, sourceFiles: SourceFile[]): string {
  const fileTypes = sourceFiles.reduce(
    (acc, file) => {
      acc[file.type] = (acc[file.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return `# Project Overview

## Project Type
- **Framework**: ${projectInfo.framework || projectInfo.type}
- **Build Tool**: ${projectInfo.buildTool || 'Not detected'}
- **Package Manager**: ${projectInfo.hasPackageJson ? 'Detected' : 'None'}

## File Structure
${Object.entries(fileTypes)
  .map(([type, count]) => `- **${type}**: ${count} files`)
  .join('\n')}

## Architecture Notes
This is a ${projectInfo.type} project with ${sourceFiles.length} source files organized into a standard directory structure.

## Key Directories
${Array.from(new Set(sourceFiles.map((f) => f.relativePath.split('/')[1]).filter(Boolean)))
  .map(
    (dir) => `- \`${dir}/\` - Contains ${sourceFiles.filter((f) => f.relativePath.includes(dir || '')).length} files`,
  )
  .join('\n')}
`;
}

function generateCodeOrganizationPatternContent(sourceFiles: SourceFile[], projectInfo: ProjectInfo): string {
  const languages = [...new Set(sourceFiles.map((f) => f.language))];
  const directories = [...new Set(sourceFiles.map((f) => f.relativePath.split('/')[1]).filter(Boolean))];

  return `# Code Organization Patterns

This document describes the code organization patterns used in this ${projectInfo.type} project.

## Languages Used
${languages.map((lang) => `- **${lang}**: ${sourceFiles.filter((f) => f.language === lang).length} files`).join('\n')}

## Directory Structure
${directories.map((dir) => `- **${dir}/**: ${sourceFiles.filter((f) => f.relativePath.includes(dir || '')).length} files`).join('\n')}

## File Naming Patterns
Common file naming patterns found:
${sourceFiles
  .slice(0, 10)
  .map((f) => `- \`${path.basename(f.relativePath)}\` (${f.language})`)
  .join('\n')}

## Best Practices
- Follow the established directory structure
- Use consistent naming conventions across similar files
- Keep related functionality grouped in the same directories
- Document module purposes and dependencies in AGP knowledge files
`;
}

function generateTestPatternContent(testFiles: SourceFile[]): string {
  const testDirs = [...new Set(testFiles.map((f) => f.relativePath.split('/').slice(0, -1).join('/')))];
  const testLanguages = [...new Set(testFiles.map((f) => f.language))];

  return `# Testing Patterns

This document describes the testing patterns used in this project.

## Test Structure
- **Total Test Files**: ${testFiles.length}
- **Languages**: ${testLanguages.join(', ')}

## Test Locations
${testDirs.map((dir) => `- \`${dir}/\``).join('\n')}

## Test Files
${testFiles
  .slice(0, 10)
  .map((f) => `- \`${f.relativePath}\` (${f.language})`)
  .join('\n')}

## Best Practices
- Keep tests close to the code they test
- Use consistent naming conventions for test files
- Follow the established test directory structure
- Document test scenarios and coverage expectations
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
