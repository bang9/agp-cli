export interface AgpInitOptions {
  force: boolean;
  templateUrl?: string;
}

export interface AgpPushOptions {
  message?: string;
}

export interface AgpLinkOptions {
  repositoryUrl: string;
  force: boolean;
}

export interface AgpConnectOptions {
  tool: string;
  configPath?: string;
}

export interface ProjectInfo {
  type: 'react' | 'nextjs' | 'vue' | 'express' | 'nestjs' | 'unknown';
  hasPackageJson: boolean;
  hasGitRepo: boolean;
  framework?: string | undefined;
  buildTool?: string | undefined;
}

export interface AgpConfig {
  version: string;
  templateUrl: string;
  lastSync: string;
  projectType: ProjectInfo['type'];
}