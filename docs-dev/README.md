# Development Documentation

Internal development documentation for gh-please project.

## 📁 Structure

```
docs-dev/
├── adr/                      # Architecture Decision Records
│   ├── 001-command-structure.md
│   ├── 0001-pr-review-command-structure.md
│   └── 0002-llm-friendly-output-formats.md
├── github/                   # GitHub-specific docs
├── issues/                   # Issue analysis and decisions
│   ├── issue-4-graphql-vs-rest.md
│   ├── issue-4-final-decision.md
│   └── issue-4-implementation.md
├── plan/                     # Planning documents
│   └── command-expansion.md
├── roadmap/                  # Roadmap and future plans
├── testing/                  # Testing documentation
│   ├── testing-overview.md
│   ├── SUMMARY.md
│   └── manual-testing-guide.md
├── AVAILABLE_PLUGINS.md      # Plugin catalog
├── CI-CD.md                  # CI/CD setup
├── commit-convention.md      # Commit message convention
├── GH_CLI_PASSTHROUGH.md     # gh CLI passthrough
├── GITHUB_ID_SYSTEMS.md      # GitHub ID systems guide
├── ISSUE_WORKFLOW.md         # Issue development workflow
├── MIGRATION_v0.3.md         # Migration guide
├── PLUGIN_DEVELOPMENT.md     # Plugin development guide
├── plugin.md                 # Plugin system docs
├── PREMIUM_PLUGIN_INSTALLATION.md  # Premium plugin setup
├── PR_REVIEW_WORKFLOW.md     # PR review workflow
├── RELEASE.md                # Release process
├── STANDARDS.md              # Coding standards
├── TDD.md                    # TDD workflow
└── TESTING.md                # Testing guidelines
```

## 📚 Key Documents

### Development Standards
- **[STANDARDS.md](./STANDARDS.md)** - Coding standards and mandatory rules
- **[TDD.md](./TDD.md)** - Test-Driven Development workflow
- **[TESTING.md](./TESTING.md)** - Testing guidelines and best practices
- **[commit-convention.md](./commit-convention.md)** - Conventional Commits

### Workflows & Guides
- **[ISSUE_WORKFLOW.md](./ISSUE_WORKFLOW.md)** - Issue development workflow
- **[PR_REVIEW_WORKFLOW.md](./PR_REVIEW_WORKFLOW.md)** - PR review workflow
- **[GITHUB_ID_SYSTEMS.md](./GITHUB_ID_SYSTEMS.md)** - GitHub ID systems guide
- **[GH_CLI_PASSTHROUGH.md](./GH_CLI_PASSTHROUGH.md)** - gh CLI passthrough implementation

### Architecture
- **[adr/](./adr/)** - Architecture Decision Records
  - Command structure decisions
  - PR review command refactoring
  - LLM-friendly output formats

### Plugin System
- **[PLUGIN_DEVELOPMENT.md](./PLUGIN_DEVELOPMENT.md)** - How to create plugins
- **[AVAILABLE_PLUGINS.md](./AVAILABLE_PLUGINS.md)** - Available plugins catalog
- **[plugin.md](./plugin.md)** - Plugin system architecture
- **[PREMIUM_PLUGIN_INSTALLATION.md](./PREMIUM_PLUGIN_INSTALLATION.md)** - Premium plugin setup

### Release & Deployment
- **[RELEASE.md](./RELEASE.md)** - Release process and checklist
- **[CI-CD.md](./CI-CD.md)** - CI/CD pipeline configuration
- **[MIGRATION_v0.3.md](./MIGRATION_v0.3.md)** - v0.3.0 migration guide

### Testing
- **[testing/](./testing/)** - Testing documentation
  - Testing overview
  - Manual testing guide
  - Test summary

### Planning
- **[plan/](./plan/)** - Planning documents
- **[roadmap/](./roadmap/)** - Roadmap and future plans
- **[issues/](./issues/)** - Issue analysis and technical decisions

## 🔄 Relationship to User Documentation

This directory (`docs-dev/`) contains **internal development documentation**.

For **user-facing documentation**, see:
- **[../docs/](../docs/)** - Docus-based documentation site (English + Korean)
- Deployed at: (TBD - after deployment)

## 📝 Document Guidelines

### When to Add Here (docs-dev/)
- Architecture decisions (ADRs)
- Development workflows and processes
- Internal technical discussions
- Release procedures
- CI/CD configuration
- Plugin development internals

### When to Add to User Docs (docs/)
- Feature guides and tutorials
- Command reference
- Usage examples
- Quick start guides
- API limitations and workarounds
- Migration guides for users

## 🔗 Related

- [Main README](../README.md) - Project overview
- [User Documentation](../docs/) - User-facing docs site
- [CLAUDE.md](../CLAUDE.md) - Claude Code guidance
