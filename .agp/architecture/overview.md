# Architecture Directory Overview

This directory contains high-level project architecture and organizational knowledge.

## Directory Purpose
- **Project Architecture**: Overall system design and structure
- **Feature Organization**: How different features are organized within the codebase
- **Global Standards**: Project-wide conventions and guidelines

## Architecture Files

### Core Architecture
- `architecture-overview.md` - Overall project structure and key architectural decisions
- `feature-domains.md` - Feature areas and their file locations within the project

### Specific Domains
(Files created as needed based on project complexity)

### Standards & Conventions  
- `naming-conventions.md` - File, component, and variable naming standards
- `data-flow.md` - How data flows through the application

## Usage Guidelines

### When to Read
- **Before starting new features**: Read relevant architecture files to understand where to place new code
- **When refactoring**: Check existing architectural decisions before making changes
- **When onboarding**: Review core architecture files to understand project organization

### When to Update
- **New feature domains**: Add to feature-domains.md and create domain-specific architecture files if needed
- **Architectural changes**: Update overview files when making significant structural changes
- **New conventions**: Document new standards in appropriate files

### File Naming Convention
- Use kebab-case for file names
- End with `.md` extension
- Use descriptive names that clearly indicate the content scope

## Maintenance Notes
- Keep this overview updated when adding new files to the architecture directory
- Link related files in the patterns directory when architectural patterns are involved
- Archive or remove obsolete files to maintain clarity