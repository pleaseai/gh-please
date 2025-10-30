# Issue Development Workflow

The `gh please issue develop` command streamlines the process of starting work on an issue with automatic worktree creation for isolated development.

## Default Mode (Worktree)

```bash
# Basic usage - creates isolated workspace in ~/.please/worktrees/{repo}/{branch}
gh please issue develop 123

# With base branch
gh please issue develop 123 --base main

# With custom branch name
gh please issue develop 123 --name my-custom-branch

# From outside git repo
gh please issue develop 123 --repo owner/repo

# Output shows command to navigate to worktree
# cd ~/.please/worktrees/gh-please/feat-123-awesome-feature

# If bare repo doesn't exist, interactive prompt will ask to clone
# Clone happens automatically to ~/.please/repositories/{owner}/{repo}.git
```

## Checkout Mode

```bash
# Checkout branch in current repo instead of creating worktree
gh please issue develop 123 --checkout

# This mode requires being in a git repository
# Useful when you want to work in your existing repo instead of a separate worktree
```

## Using Aliases

```bash
# 'dev' is an alias for 'develop'
gh please issue dev 123          # Creates worktree (default)
gh please issue dev 123 --checkout  # Checkout branch instead
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

The develop workflow uses:
- **`gh issue develop`**: GitHub CLI command for branch management
- **Bare repository**: Clone at `~/.please/repositories/{owner}/{repo}.git` for efficient multi-worktree setup
- **Git worktrees**: Isolated workspaces at `~/.please/worktrees/{repo}/{branch}`
- **Automatic fallback**: If bare repo exists locally, uses it; otherwise, prompts to clone

## Key Features

1. **Works Everywhere**: Can be used inside or outside a git repo via `--repo` flag
2. **Automatic Bare Clone**: First worktree creation automatically clones repo as bare (once only)
3. **Efficient Disk Usage**: Multiple worktrees share objects, saving disk space
4. **Interactive Cleanup**: Manage prunable worktrees interactively or in batch mode
5. **Bilingual Support**: Full Korean/English support for all messages

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
