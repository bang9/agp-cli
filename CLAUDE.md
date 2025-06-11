# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AGP (Agentic Programming Project) is a CLI tool that creates a standardized, context-rich development environment for AI programming assistants. It manages an isolated `.agp` directory as a Git submodule to ensure consistent agentic behavior across platforms and sessions.

The tool provides a unified structure for:
- Prompts and programming rules
- Documentation and context fragments  
- AI reasoning and code generation with minimal user friction

## Current State

This is an early-stage project with only basic repository structure in place. No build system, package manager, or source code has been implemented yet.

## Development Notes

- The `.agp` directory will be managed as a Git submodule
- Focus on creating a CLI that can work across different AI platforms (ChatGPT, Claude, Cursor)
- Architecture should prioritize context management and standardization