# Issue Development Workflow

The `gh please issue develop` command streamlines the process of starting work on an issue. It extends the native `gh issue develop` command with an optional worktree mode.

## Three Modes

### 1. Default Mode (Branch Only) - **Recommended for LLM workflows**

Creates a branch linked to the issue without checking it out. Non-interactive and LLM-friendly.

```bash
# Basic usage - creates branch only (passes through to gh issue develop)
gh please issue develop 123

# With base branch
gh please issue develop 123 --base main

# With custom branch name
gh please issue develop 123 --name my-custom-branch

# From outside git repo
gh please issue develop 123 --repo owner/repo
```

**Benefits:**
- ✅ Non-interactive (no prompts)
- ✅ LLM-friendly
- ✅ Fast execution
- ✅ Standard gh CLI behavior

### 2. Checkout Mode

Creates a branch and checks it out in the current repository.

```bash
# Create branch and checkout (passes through to gh issue develop --checkout)
gh please issue develop 123 --checkout

# This mode requires being in a git repository
# Useful when you want to immediately start working in your existing repo
```

**Benefits:**
- ✅ Non-interactive (no prompts)
- ✅ LLM-friendly
- ✅ Immediate access to code
- ✅ Standard gh CLI behavior with --checkout

### 3. Worktree Mode (gh-please Extension)

Creates an isolated worktree workspace for the issue. This is a gh-please extension that adds worktree support to the native gh CLI.

```bash
# Create isolated workspace in ~/.please/worktrees/{repo}/{branch}
gh please issue develop 123 --worktree

# With base branch
gh please issue develop 123 --worktree --base main

# With custom branch name
gh please issue develop 123 --worktree --name my-custom-branch

# From outside git repo
gh please issue develop 123 --worktree --repo owner/repo

# Output shows command to navigate to worktree
# cd ~/.please/worktrees/gh-please/feat-123-awesome-feature
```

**Interactive prompts (worktree mode only):**
- If bare repo doesn't exist: Asks permission to clone
- If linked branches exist: Offers to use existing or create new branch

**Benefits:**
- ✅ Isolated workspace per issue
- ✅ Multiple issues in parallel
- ✅ Efficient disk usage (shared git objects)
- ⚠️ Interactive (not ideal for LLM workflows)

## Using Aliases

```bash
# 'dev' is an alias for 'develop'
gh please issue dev 123              # Branch only (default)
gh please issue dev 123 --checkout   # Branch + checkout
gh please issue dev 123 --worktree   # Isolated worktree
```

## Cleanup Worktrees

```bash
# Interactive selection of prunable worktrees to remove
gh please issue cleanup

# Remove all prunable worktrees without prompt
gh please issue cleanup --all

# Cleanup from outside repo
gh please issue cleanup --repo owner/repo
```

## Architecture & Implementation

The develop command supports three modes:

### Default & Checkout Modes (Passthrough)
- **`gh issue develop`**: Passes through to native GitHub CLI
- **Branch creation**: Handled by gh CLI
- **No custom logic**: Pure passthrough to gh command

### Worktree Mode (gh-please Extension)
- **Bare repository**: Clone at `~/.please/repositories/{owner}/{repo}.git`
- **Git worktrees**: Isolated workspaces at `~/.please/worktrees/{repo}/{branch}`
- **Interactive prompts**: Bare repo clone confirmation, branch selection
- **Automatic fallback**: Uses existing bare repo if available

## Key Features

1. **LLM-Friendly Default**: Non-interactive branch creation (default mode)
2. **Native gh CLI Compatible**: Passthrough for default and checkout modes
3. **Optional Worktree Support**: Isolated workspaces via `--worktree` flag
4. **Works Everywhere**: Can be used inside or outside a git repo via `--repo` flag
5. **Efficient Disk Usage**: Worktree mode shares git objects (saves disk space)
6. **Interactive Cleanup**: Manage prunable worktrees interactively or in batch mode
7. **Bilingual Support**: Full Korean/English support for all messages

## Standard Issue Workflow

Follow this standardized workflow for all feature development and bug fixes:

### 1. Create Issue Branch

Create a new branch linked to a GitHub issue using the gh CLI:

```bash
gh issue develop <issue-number>
```

This command:

- Creates a branch automatically named after the issue (e.g., `issue-<number>`)
- Links the branch to the issue in GitHub
- Helps track work in progress

### 2. Checkout Branch

Switch to the newly created branch:

```bash
git checkout <branch-name>
# or if using gh workflow:
gh issue develop <issue-number>  # automatically checks out
```

### 3. Follow TDD Cycle

Implement changes following Test-Driven Development (see `docs-dev/TDD.md`):

1. **Red**: Write a failing test that defines the desired behavior
2. **Green**: Implement the minimum code needed to make the test pass
3. **Refactor**: Improve code structure while keeping tests passing
4. **Commit**: Use small, focused commits following conventional commits (see `docs-dev/commit-convention.md`)

Key commands:

```bash
# Run tests continuously
bun test --watch

# Run all tests before committing
bun test

# Type check before committing
bun run type-check
```

### 4. Commit, Push, and Create PR

Once your implementation is complete and all tests pass:

```bash
# Stage your changes
git add .

# Create a commit following conventional commit format
git commit -m "feat: brief description of the feature"

# Push to remote
git push -u origin <branch-name>

# Create a pull request
gh pr create --title "Title" --body "Description"
```

Or use the convenient slash command:

```bash
/github:commit-push-pr
```

### Workflow Summary

```
┌─────────────────────────────────────┐
│ 1. Create issue branch              │
│    gh issue develop <issue-number>  │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 2. Checkout branch                  │
│    git checkout <branch-name>       │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 3. Follow TDD cycle                 │
│    Red → Green → Refactor → Commit  │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 4. Commit, Push, and Create PR      │
│    git commit → git push → gh pr    │
└─────────────────────────────────────┘
```
