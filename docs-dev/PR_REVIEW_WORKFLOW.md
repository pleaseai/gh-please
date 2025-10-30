# PR Review Workflow

After code review feedback is received on a PR, follow this workflow to respond to comments and manage threads.

## 1. Identify Review Comments

Get all review comments on a PR to understand feedback:

```bash
# View PR with review comments
gh pr view <pr-number>

# Get detailed comment information
gh api repos/{owner}/{repo}/pulls/<pr-number>/comments
```

## 2. Apply Code Review Feedback

Address all findings from the code review:

```bash
# Make necessary changes to files based on review feedback
# Example: Fix type definitions, update documentation, refactor code

# Run quality checks before responding
bun run type-check
bun test
bun run lint:fix
```

## 3. Respond to Review Comments

Use `gh please pr review reply` to respond to each review comment with acknowledgment and commit reference:

```bash
# Reply to a single review comment
gh please pr review reply <comment-id> -b "Thanks for catching this! Fixed in <commit-hash>"

# Example with actual comment ID
gh please pr review reply 2442802556 -b "Fixed PluginType definition mismatch in commit 75dcaac"
```

**Response Best Practices:**
- Include the commit hash that addresses the feedback
- Keep responses brief and professional
- Confirm understanding of the issue
- Reference the fix location when applicable
- For multiple related comments, batch similar responses

## 4. Resolve Review Threads

After addressing feedback and responding, resolve review threads:

```bash
# List all review threads to get Node IDs
gh please pr review thread list <pr-number>

# List only unresolved threads
gh please pr review thread list <pr-number> --unresolved-only

# Resolve all threads on a PR (recommended after addressing all feedback)
gh please pr review thread resolve <pr-number> --all

# Resolve a specific thread (use Node ID from list command)
gh please pr review thread resolve <pr-number> --thread <thread-node-id>
```

## Example Workflow

```bash
# 1. Apply feedback to files
# (edit files based on review comments)

# 2. Commit the changes
git add .
git commit -m "fix: address code review feedback from PR #23"
git push

# 3. Respond to comments (assuming comment IDs: 2442802556, 2442802557, ...)
gh please pr review reply 2442802556 -b "Fixed in 75dcaac"
gh please pr review reply 2442802557 -b "Updated in 75dcaac"
gh please pr review reply 2442802560 -b "Implemented in 75dcaac"

# 4. Resolve all threads
gh please pr review thread resolve 23 --all
```

## 5. Push Changes and Update PR

After responding and resolving threads, the PR is ready for merge:

```bash
# Verify all changes are pushed
git log -1 --oneline
git status

# PR is now ready for merge with all feedback addressed and threads resolved
```

## Complete Workflow Summary

```
┌─────────────────────────────────────┐
│ 1. Receive Code Review Feedback     │
│    Review comments on PR            │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 2. Apply Feedback                   │
│    Edit files, run checks, commit   │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 3. Respond to Comments              │
│    gh please pr review reply        │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 4. Resolve Threads                  │
│    gh please pr review thread       │
│    resolve --all                    │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 5. PR Ready for Merge               │
│    All feedback addressed           │
└─────────────────────────────────────┘
```

## Related Commands

For additional PR management:

```bash
# List all PRs with review comments
gh pr list --search "review-requested:@me"

# View specific PR details
gh pr view <pr-number> --json reviews,comments

# Check PR review status
gh pr checks <pr-number>
```
