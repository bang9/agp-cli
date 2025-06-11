# 🤖 AGP (Agentic Programming Project)

> **A standardized knowledge management system for AI-assisted development**

AGP creates a persistent, context-rich development environment that works seamlessly across any AI programming assistant (ChatGPT, Claude, Cursor, etc.). By managing project knowledge through an isolated `.agp` directory as a Git submodule, AGP ensures consistent agentic behavior regardless of platform or session.

## ✨ Key Features

- **🧠 Persistent AI Memory**: Knowledge accumulates over time, enabling any AI to pick up work instantly
- **👥 Multi-User Collaboration**: Session management prevents file conflicts when multiple users work with AI
- **🔄 Session Continuity**: Resume work seamlessly across conversations and platforms
- **📚 Auto-Generated Documentation**: AI creates and maintains comprehensive project knowledge
- **🎯 Context-Aware**: AI understands project structure, patterns, and conventions automatically

## 🚀 Quick Start

### Installation

```bash
npm install -g agp-cli
```

### Initialize a Project

```bash
# Initialize AGP in your project
agp init

# Start your session
agp start
```

### Your First Session

Once initialized, any AI assistant can:
1. Read your project structure from `.agp/architecture/`
2. Understand implementation patterns from `.agp/patterns/`
3. Review session history from `.agp/sessions/`
4. Continue work without losing context

## 📋 Commands

| Command | Description |
|---------|-------------|
| `agp init` | Initialize AGP in your project with template setup |
| `agp start` | Start or resume your development session |
| `agp push` | Push session progress and knowledge to remote repository |
| `agp connect <tool>` | Configure AGP for AI tools (claude, cursor, chatgpt) |

## 🏗️ How It Works

AGP creates a `.agp` directory structure that serves as persistent AI memory:

```
.agp/
├── instructions.md    # AI workflows and system rules
├── .config.json       # Local session configuration
├── architecture/      # Project structure and design decisions
├── patterns/          # Reusable implementation patterns
├── project/           # File-specific knowledge and context
└── sessions/          # User session tracking and history
```

### The Magic

1. **Knowledge Accumulation**: Every file modification generates corresponding knowledge in `.agp/project/`
2. **Pattern Recognition**: Common solutions are extracted to `.agp/patterns/` for reuse
3. **Session Tracking**: Multiple users can work safely without conflicts
4. **Context Preservation**: AI understands project history and conventions

## 🔧 Configuration

AGP uses a `.config.json` file (local-only) to track current session:

```json
{
  "session": {
    "user": "alice",
    "current": ".agp/sessions/alice/index.md"
  }
}
```

## 🤝 Multi-User Workflow

AGP prevents collaboration conflicts through session management:

1. Each user has their own session directory
2. Active file locks prevent simultaneous edits
3. Session history enables seamless handoffs
4. Knowledge accumulates for the entire team

## 🎯 Perfect For

- **AI-First Development**: When you primarily work with AI assistants
- **Knowledge-Heavy Projects**: Complex codebases requiring context retention
- **Team Collaboration**: Multiple developers working with AI tools
- **Long-Term Projects**: Maintaining context across months or years
- **Context Switching**: Jumping between different features or areas

## 📖 Documentation

- [Getting Started Guide](docs/getting-started.md)
- [Architecture Overview](docs/architecture.md)
- [Session Management](docs/sessions.md)
- [Best Practices](docs/best-practices.md)

## 🤖 AI Integration

AGP works with any AI that can read files:

- **Claude Code**: Full integration with file reading capabilities
- **ChatGPT**: Upload `.agp` files for context
- **Cursor**: Built-in file understanding
- **GitHub Copilot**: Enhanced with project knowledge
- **Any AI Tool**: That supports file-based context

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙋‍♂️ Support

- [Issues](https://github.com/bang9/agp-cli/issues)
- [Discussions](https://github.com/bang9/agp-cli/discussions)
- [Documentation](https://agp-cli.dev)

---

**Made with ❤️ for the AI development community**
