# PR Reviews

Comprehensive guide to managing pull request reviews with the `gh-please` extension.

## Overview

The `gh-please` extension provides two main PR review capabilities:

1. **review-reply**: Respond to review comments
2. **resolve**: Resolve review discussion threads

These commands complement GitHub's web UI and provide CLI-based review workflows.

## review-reply Command

### Purpose

Reply to pull request review comments programmatically from the command line.

### When to Use

**✅ Good use cases:**
- Respond to multiple review comments quickly
- Scripted or automated responses
- CLI-centric workflows
- Batch processing feedback

**❌ Not suitable for:**
- Complex discussions (use GitHub UI)
- Nested replies (API limitation)
- Inline code suggestions

### Syntax

```bash
gh please pr review-reply <comment-id> --body <text> [--repo owner/repo]
gh please pr review-reply <comment-id> -b <text> [--repo owner/repo]

# From stdin
echo "text" | gh please pr review-reply <comment-id> [--repo owner/repo]
```

### Finding Comment IDs

**Method 1: GitHub Web UI**

1. Navigate to PR review comment
2. Check URL: `https://github.com/owner/repo/pull/123#discussion_r987654`
3. Use number after `discussion_r`: `987654`

**Example:**
```
URL: https://github.com/pleaseai/gh-please/pull/456#discussion_r1234567890
Comment ID: 1234567890
```

**Method 2: gh CLI (JSON output)**

```bash
# View PR with comments
gh pr view 456 --json comments

# Extract comment IDs
gh api /repos/OWNER/REPO/pulls/456/comments | jq '.[] | {id, body}'
```

**Output:**
```json
{
  "id": 1234567890,
  "body": "This could be optimized"
}
{
  "id": 1234567891,
  "body": "Add error handling here"
}
```

**Method 3: gh API (detailed)**

```bash
gh api /repos/OWNER/REPO/pulls/456/comments \
  --jq '.[] | "\(.id): \(.path):\(.line) - \(.body | split("\n")[0])"'
```

**Output:**
```
1234567890: src/app.ts:45 - This could be optimized
1234567891: src/auth.ts:23 - Add error handling here
```

### Basic Usage

**Simple reply:**
```bash
gh please pr review-reply 1234567890 -b "Fixed in commit abc123"
```

**Multi-line reply:**
```bash
gh please pr review-reply 1234567890 --body "$(cat <<'EOF'
Good catch! I've addressed this by:

1. Adding input validation
2. Including error handling
3. Adding unit tests

Let me know if you have other concerns.
EOF
)"
```

**From stdin:**
```bash
echo "Thanks for the review!" | gh please pr review-reply 1234567890
```

**With template:**
```bash
# review-reply-template.txt
Thank you for the feedback!

I've updated the implementation as suggested:
- Added error handling
- Included tests
- Updated documentation

Please re-review when ready.

# Use template
gh please pr review-reply 1234567890 --body "$(cat review-reply-template.txt)"
```

### Cross-repository Usage

```bash
# Reply to comment in different repo
gh please pr review-reply 1234567890 -b "Fixed" --repo owner/repo
gh please pr review-reply 1234567890 -b "Fixed" -R owner/repo  # Short form
```

### API Limitation: Top-level Comments Only

**Important:** The GitHub API endpoint only supports replies to **top-level review comments**, not nested replies.

**Endpoint used:**
```
POST /repos/{owner}/{repo}/pulls/{pull_number}/comments/{comment_id}/replies
```

**What works:**
```
PR #456
└── Review Comment #1 (top-level)
    └── ✅ Your reply (via gh please pr review-reply 1)
```

**What doesn't work:**
```
PR #456
└── Review Comment #1 (top-level)
    └── Reply #2 (nested)
        └── ❌ Your reply (API doesn't support)
```

**Error message if you try:**
```bash
gh please pr review-reply 2 -b "Reply to reply"
# Error: API error: Comment 2 is not a top-level review comment
```

**Workaround:**
- Use GitHub web UI for nested replies
- Reply to the original top-level comment instead

### Real-world Examples

**Example 1: Security Concern**

Review comment:
> "Using MD5 for password hashing is insecure"

Reply:
```bash
gh please pr review-reply 111 --body "$(cat <<'EOF'
You're absolutely right. I've updated to use bcrypt:

\`\`\`typescript
const hash = await bcrypt.hash(password, 10)
\`\`\`

Changes in commit `a1b2c3d`. Tests updated accordingly.
EOF
)"
```

**Example 2: Performance Feedback**

Review comment:
> "This N+1 query will be slow with many users"

Reply:
```bash
gh please pr review-reply 222 --body "$(cat <<'EOF'
Good catch! Fixed with eager loading:

Before:
\`\`\`typescript
for (const user of users) {
  user.posts = await getPosts(user.id)  // N+1
}
\`\`\`

After:
\`\`\`typescript
const users = await User.findAll({
  include: [Post]  // Single query with JOIN
})
\`\`\`

Benchmark: 500ms → 50ms for 100 users.
EOF
)"
```

**Example 3: Batch Replies**

```bash
# Address multiple comments
COMMENTS=(111 222 333 444)
for id in "${COMMENTS[@]}"; do
  gh please pr review-reply $id -b "Fixed in latest commit, please re-review"
done
```

## resolve Command

### Purpose

Resolve review discussion threads programmatically.

### When to Use

**✅ Good use cases:**
- Mark conversations as resolved after addressing feedback
- Bulk resolve after comprehensive updates
- Automated workflows
- CLI-centric review processes

**❌ Not suitable for:**
- Unresolved discussions (keep open for visibility)
- Controversial feedback (discuss first)

### Syntax

```bash
# Resolve specific thread
gh please pr resolve <pr-number> --thread <thread-id> [--repo owner/repo]

# Resolve all threads
gh please pr resolve <pr-number> --all [--repo owner/repo]
```

### Finding Thread IDs

**Method 1: List all threads**

```bash
# Get thread IDs for PR #456
gh api graphql -f query='
  query($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $number) {
        reviewThreads(first: 50) {
          nodes {
            id
            isResolved
            comments(first: 1) {
              nodes {
                body
              }
            }
          }
        }
      }
    }
  }
' -F owner=OWNER -F repo=REPO -F number=456
```

**Method 2: Using extension (internal)**

Extension automatically fetches thread IDs when using `--all`.

### Basic Usage

**Resolve all threads:**
```bash
gh please pr resolve 456 --all
```

**Output:**
```
🔍 Fetching review threads for PR #456...
✓ Found 3 unresolved threads
✓ Resolving 3 threads...
✓ All threads resolved successfully

View: https://github.com/owner/repo/pull/456
```

**Resolve specific thread:**
```bash
gh please pr resolve 456 --thread MDEyOlB1bGxSZXF1ZXN0UmV2aWV3VGhyZWFk...
```

**Output:**
```
✓ Resolved thread MDEyOl...
   View: https://github.com/owner/repo/pull/456
```

### Cross-repository Usage

```bash
# Resolve threads in different repo
gh please pr resolve 456 --all --repo owner/repo
gh please pr resolve 456 --all -R owner/repo  # Short form
```

### When to Resolve vs Keep Open

**✅ Resolve when:**
- Feedback addressed in latest commits
- Reviewer confirms satisfaction
- Discussion concluded with agreement
- Non-blocking suggestions implemented

**⚠️ Keep open when:**
- Feedback not yet addressed
- Waiting for reviewer confirmation
- Controversial or ongoing discussion
- Requires further clarification

**Example decision tree:**
```
Review comment: "Add error handling"
├── Addressed? Yes
│   └── Reviewer confirmed? Yes
│       └── ✅ RESOLVE
└── Addressed? No
    └── ⚠️ KEEP OPEN (reply with plan)
```

### Real-world Examples

**Example 1: After Comprehensive Update**

```bash
# 1. Address all review feedback
git add .
git commit -m "fix: Address PR review feedback"
git push

# 2. Resolve all threads
gh please pr resolve 456 --all

# 3. Request re-review
gh pr ready 456
gh pr comment 456 --body "All feedback addressed, ready for re-review"
```

**Example 2: Selective Resolution**

```bash
# Get thread IDs
THREADS=$(gh api graphql -f query='...' | jq -r '.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false) | .id')

# Resolve only specific threads (e.g., first two)
echo "$THREADS" | head -n 2 | while read thread_id; do
  gh please pr resolve 456 --thread "$thread_id"
done

# Leave remaining threads open for discussion
```

**Example 3: Automated Workflow**

```bash
#!/bin/bash
# auto-resolve-after-push.sh

PR_NUMBER=$1

# 1. Ensure latest changes pushed
git push

# 2. Wait for CI to pass
gh pr checks $PR_NUMBER --watch

# 3. Resolve all threads if CI passes
if gh pr checks $PR_NUMBER | grep -q "All checks have passed"; then
  gh please pr resolve $PR_NUMBER --all
  echo "✓ All threads resolved, CI passed"
else
  echo "⚠️ CI failed, keeping threads open"
fi
```

## Review Best Practices

### Effective Review Responses

**✅ Good responses:**

Acknowledge and explain:
```
Good catch! I've refactored this to use...

Updated in commit abc123.
```

Provide context:
```
This approach was chosen because...

However, I can change to X if you prefer. Let me know!
```

Be specific:
```
Fixed by:
1. Adding validation (src/auth.ts:45)
2. Including tests (test/auth.test.ts:23)
3. Updating docs (README.md:67)
```

**❌ Poor responses:**

Too brief:
```
Fixed
```

Defensive:
```
This is fine as-is, no changes needed
```

Unclear:
```
I'll look into this later
```

### Managing Multiple Reviewers

**Scenario:** PR has 3 reviewers with conflicting feedback

**Strategy 1: Reply individually**
```bash
# Reviewer A wants approach X
gh please pr review-reply 111 -b "Implemented X as suggested"

# Reviewer B wants approach Y (conflicts with X)
gh please pr review-reply 222 -b "I went with X (per Reviewer A) because... Does this work for you?"

# Reviewer C: minor nits
gh please pr review-reply 333 -b "Fixed all nits, thanks!"
```

**Strategy 2: Summary comment + resolve all**
```bash
# Post summary explaining decisions
gh pr comment 456 --body "$(cat <<'EOF'
## Review Response Summary

Addressed all feedback:

**Reviewer A (@alice):** Implemented approach X ✅
**Reviewer B (@bob):** Went with X over Y because... ✅
**Reviewer C (@charlie):** Fixed all nits ✅

All changes in commits a1b2c3d..d4e5f6g.
Ready for re-review!
EOF
)"

# Resolve all threads
gh please pr resolve 456 --all
```

### Handling Conflicting Feedback

**Pattern: Acknowledge, explain, propose**

```bash
gh pr comment 456 --body "$(cat <<'EOF'
## Conflicting Feedback

@reviewer1 suggested approach A (async/await)
@reviewer2 suggested approach B (promises)

I've implemented approach A because:
1. More readable for this use case
2. Easier error handling
3. Consistent with rest of codebase

@reviewer2 - Does this work for you? Happy to discuss alternatives.
EOF
)"
```

### Review Etiquette

**DO:**
- ✅ Thank reviewers for their time
- ✅ Explain your reasoning
- ✅ Ask clarifying questions
- ✅ Resolve threads promptly after addressing
- ✅ Request re-review when ready

**DON'T:**
- ❌ Argue or be defensive
- ❌ Ignore feedback silently
- ❌ Resolve threads without addressing
- ❌ Leave stale comments unresolved
- ❌ Push without responding

**Example tone:**
```bash
# ✅ Good
gh please pr review-reply 111 -b "Great point! I've updated to use..."

# ❌ Bad
gh please pr review-reply 111 -b "This is wrong, my approach is better"
```

## Practical Workflows

### Workflow 1: Incremental Response

Address feedback incrementally as you work:

```bash
# 1. Address first comment
git commit -m "fix: Add error handling (addresses PR comment #111)"
gh please pr review-reply 111 -b "Added error handling, see commit abc123"

# 2. Address second comment
git commit -m "test: Add edge case tests (addresses PR comment #222)"
gh please pr review-reply 222 -b "Added tests, see commit def456"

# 3. Continue for remaining comments...

# 4. Push all changes
git push

# 5. Resolve all threads
gh please pr resolve 456 --all
```

### Workflow 2: Batch Response

Address all feedback, then respond to all comments:

```bash
# 1. Address all feedback
git commit -m "fix: Address all PR review feedback"
git push

# 2. Reply to each comment
COMMENTS=(111 222 333 444)
MESSAGE="Addressed in latest commit abc123"

for id in "${COMMENTS[@]}"; do
  gh please pr review-reply $id -b "$MESSAGE"
done

# 3. Resolve all threads
gh please pr resolve 456 --all

# 4. Request re-review
gh pr comment 456 -b "All feedback addressed, ready for re-review @reviewers"
```

### Workflow 3: Automated CI Integration

Resolve threads only if CI passes:

```bash
#!/bin/bash
# review-response-workflow.sh

PR=$1

# 1. Address feedback
echo "Addressing review feedback..."
# ... make changes ...
git commit -am "fix: Address review feedback"
git push

# 2. Wait for CI
echo "Waiting for CI..."
gh pr checks $PR --watch

# 3. Respond based on CI result
if gh pr checks $PR --jq '.[] | select(.conclusion != "success")' | grep -q .; then
  echo "⚠️ CI failed, not resolving threads"
  gh pr comment $PR -b "CI failing, will address before resolving threads"
else
  echo "✅ CI passed, resolving threads"
  gh please pr resolve $PR --all
  gh pr comment $PR -b "All feedback addressed, CI passing, ready for re-review"
fi
```

## Troubleshooting

**"Comment not found"**
- Verify comment ID: `gh api /repos/OWNER/REPO/pulls/PR/comments`
- Check permissions (repo access)
- Ensure comment is on correct PR

**"Cannot reply to nested comment"**
- API limitation: only top-level comments supported
- Use GitHub web UI for nested replies
- Or reply to the original top-level comment

**"Thread not resolved"**
- Check thread ID is correct
- Verify PR is in correct state (not merged/closed)
- Ensure you have write permissions

**"--all resolves wrong threads"**
- Extension resolves ALL unresolved threads
- Use `--thread` for selective resolution
- Review threads before bulk resolution

**"Reply appears on wrong PR"**
- Comment ID might belong to different PR
- Verify with: `gh api /repos/OWNER/REPO/pulls/comments/COMMENT_ID`

## Tips and Tricks

### Template Responses

Create templates for common responses:

```bash
# ~/.gh-please/templates/review-thanks.txt
Thank you for the thorough review!

I've addressed all your feedback:
- <list changes here>

Please re-review when you have time.

# Use template
gh please pr review-reply 111 --body "$(cat ~/.gh-please/templates/review-thanks.txt)"
```

### Keyboard Shortcuts (via aliases)

```bash
# Add to ~/.bashrc or ~/.zshrc
alias prreply='gh please pr review-reply'
alias prresolve='gh please pr resolve'

# Usage
prreply 111 -b "Fixed"
prresolve 456 --all
```

### Batch Operations with jq

```bash
# Get all unresolved comment IDs
gh api /repos/OWNER/REPO/pulls/456/comments \
  | jq -r '.[] | select(.in_reply_to_id == null) | .id' \
  | while read id; do
      gh please pr review-reply $id -b "Addressed in latest commit"
    done
```

### Integration with Git Hooks

```bash
# .git/hooks/post-push
#!/bin/bash
# Auto-respond to reviews after push

BRANCH=$(git rev-parse --abbrev-ref HEAD)
PR=$(gh pr view $BRANCH --json number -q '.number' 2>/dev/null)

if [ -n "$PR" ]; then
  echo "Found PR #$PR for branch $BRANCH"
  read -p "Resolve all review threads? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    gh please pr resolve $PR --all
  fi
fi
```

---

**Last Updated:** 2025-10-19
**Related:** [AI-WORKFLOWS.md](./AI-WORKFLOWS.md), [ISSUE-MANAGEMENT.md](./ISSUE-MANAGEMENT.md)
