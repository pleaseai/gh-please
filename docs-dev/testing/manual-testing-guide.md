# Manual Testing Guide

This guide provides step-by-step instructions for manually testing all `gh please` commands in a real GitHub environment.

## Prerequisites

- GitHub CLI (`gh`) installed and authenticated
- This extension installed: `gh extension install .`
- A test GitHub repository with issues and PRs
- **Recommended**: Create a dedicated test repository to avoid polluting production data

## Setup Test Environment

### 1. Create Test Repository

```bash
# Option A: Create new test repo
gh repo create gh-please-test --public --clone

# Option B: Use existing repo
cd your-test-repo
```

### 2. Create Test Issues

```bash
# Create parent issue for sub-issue testing
gh issue create --title "Parent Issue for Sub-issue Test" --body "This is a parent issue"

# Create child issue for linking
gh issue create --title "Child Issue to Link" --body "This will be linked as sub-issue"

# Create blocking issue for dependency testing
gh issue create --title "Blocking Issue" --body "This blocks other issues"

# Create blocked issue
gh issue create --title "Blocked Issue" --body "This is blocked by another issue"

# Note the issue numbers (e.g., #1, #2, #3, #4)
```

### 3. Create Test PR

```bash
# Create a test branch and PR
git checkout -b test-pr-branch
echo "test" > test.txt
git add test.txt
git commit -m "test: add test file"
git push -u origin test-pr-branch
gh pr create --title "Test PR" --body "For testing review commands"

# Add a review comment to the PR
# 1. Go to the PR on GitHub
# 2. Add a line comment on any file
# 3. Note the comment ID (you can get it from the API)
```

## Test Cases

### AI Commands

#### 1. Test `gh please ai triage`

**Purpose**: Trigger PleaseAI triage automation on an issue

```bash
# Test with valid issue
gh please ai triage 1

# Expected output:
# 🤖 Triggering PleaseAI triage for issue #1...
# ✅ Triage request posted to issue #1
#    View: https://github.com/owner/repo/issues/1

# Verify:
# - Check issue #1 has a comment: "/please triage"
# - No errors displayed
```

**Test invalid input**:

```bash
# Non-existent issue
gh please ai triage 99999
# Expected: Error message about issue not found

# Invalid issue number
gh please ai triage abc
# Expected: Validation error
```

#### 2. Test `gh please ai investigate`

```bash
gh please ai investigate 2

# Expected output:
# 🤖 Triggering PleaseAI investigation for issue #2...
# ✅ Investigation request posted to issue #2
#    View: https://github.com/owner/repo/issues/2

# Verify:
# - Check issue #2 has a comment: "/please investigate"
```

#### 3. Test `gh please ai fix`

```bash
gh please ai fix 3

# Expected output:
# 🤖 Triggering PleaseAI fix for issue #3...
# ✅ Fix request posted to issue #3
#    View: https://github.com/owner/repo/issues/3

# Verify:
# - Check issue #3 has a comment: "/please fix"
```

#### 4. Test `gh please ai review`

```bash
gh please ai review 1

# Expected output:
# 🤖 Triggering PleaseAI code review for PR #1...
# ✅ Review request posted to PR #1
#    View: https://github.com/owner/repo/pull/1

# Verify:
# - Check PR #1 has a comment: "/please review"
```

#### 5. Test `gh please ai apply`

```bash
gh please ai apply 1

# Expected output:
# 🤖 Triggering PleaseAI apply suggestions for PR #1...
# ✅ Apply request posted to PR #1
#    View: https://github.com/owner/repo/pull/1

# Verify:
# - Check PR #1 has a comment: "/please apply"
```

---

### Issue Commands - Sub-issue

#### 6. Test `gh please issue sub-issue create`

```bash
# Create new sub-issue under parent issue #1
gh please issue sub-issue create 1 --title "New Sub-issue" --body "This is a sub-issue"

# Expected output:
# 🔍 Getting parent issue #1...
# 📝 Creating sub-issue...
# ✅ Sub-issue #5 created!
#    View: https://github.com/owner/repo/issues/5

# Verify on GitHub:
# - Issue #5 exists with title "New Sub-issue"
# - Issue #5 is linked to issue #1 as a sub-issue
# - Parent issue #1 shows #5 in sub-issues section
```

**Test without body**:

```bash
gh please issue sub-issue create 1 --title "Sub-issue without body"

# Expected: Should create successfully without body field
```

**Test invalid parent**:

```bash
gh please issue sub-issue create 99999 --title "Test"

# Expected: Error about parent issue not found
```

#### 7. Test `gh please issue sub-issue add`

```bash
# Link existing issue #2 as sub-issue of #1
gh please issue sub-issue add 1 2

# Expected output:
# 🔍 Getting parent issue #1...
# 🔍 Getting child issue #2...
# 🔗 Adding #2 as sub-issue of #1...
# ✅ Issue #2 linked as sub-issue of #1

# Verify:
# - Issue #2 appears in sub-issues list of #1
```

**Test self-linking**:

```bash
gh please issue sub-issue add 1 1

# Expected: Error about cannot link issue to itself
```

#### 8. Test `gh please issue sub-issue remove`

```bash
# Remove sub-issue link
gh please issue sub-issue remove 1 2

# Expected output:
# 🔍 Getting parent issue #1...
# 🔍 Getting child issue #2...
# 🔗 Removing sub-issue link...
# ✅ Issue #2 unlinked from #1

# Verify:
# - Issue #2 no longer appears in #1's sub-issues
```

#### 9. Test `gh please issue sub-issue list`

```bash
# List all sub-issues of parent #1
gh please issue sub-issue list 1

# Expected output:
# 📋 Sub-issues of #1:
#
# #5 New Sub-issue [OPEN]
#
# Total: 1 sub-issue

# Verify:
# - Shows all linked sub-issues
# - Shows issue state (OPEN/CLOSED)
```

**Test issue with no sub-issues**:

```bash
gh please issue sub-issue list 4

# Expected output:
# 📋 Sub-issues of #4:
# (No sub-issues)
```

---

### Issue Commands - Dependency

#### 10. Test `gh please issue dependency add`

```bash
# Make issue #4 blocked by issue #3
gh please issue dependency add 4 --blocked-by 3

# Expected output:
# 🔍 Getting issue #4...
# 🔍 Getting blocking issue #3...
# 🔗 Adding dependency...
# ✅ Issue #4 is now blocked by #3

# Verify:
# - Issue #4 shows #3 as a blocker
# - Dependency relationship visible on GitHub
```

**Test multiple blockers**:

```bash
gh please issue dependency add 4 --blocked-by 1
gh please issue dependency add 4 --blocked-by 2

# Expected: Issue #4 should have multiple blockers
```

#### 11. Test `gh please issue dependency remove`

```bash
# Remove dependency
gh please issue dependency remove 4 3

# Expected output:
# 🔍 Getting issue #4...
# 🔍 Getting blocking issue #3...
# 🔗 Removing dependency...
# ✅ Issue #4 is no longer blocked by #3

# Verify:
# - Dependency removed from issue #4
```

#### 12. Test `gh please issue dependency list`

```bash
# List all dependencies
gh please issue dependency list 4

# Expected output:
# 🚫 Dependencies blocking #4:
#
# #1 Blocking Issue [OPEN]
# #2 Another Blocker [OPEN]
#
# Total: 2 blockers

# Verify:
# - Shows all blocking issues
# - Shows correct state
```

**Test issue with no dependencies**:

```bash
gh please issue dependency list 1

# Expected output:
# 🚫 Dependencies blocking #1:
# (No blocking issues)
```

---

### PR Commands

#### 13. Test `gh please pr review-reply`

**Note**: You need to get a review comment ID first

```bash
# Get comment ID (replace with actual value)
COMMENT_ID=123456789

# Reply to review comment
gh please pr review-reply $COMMENT_ID -b "Thanks for the review!"

# Expected output:
# 📝 Fetching review comment #123456789...
# ✅ Reply posted successfully!
#    View: https://github.com/owner/repo/pull/1#discussion_r123456789

# Verify on GitHub:
# - Comment appears as a reply to the original review comment
# - Reply text is correct
```

**Test without body**:

```bash
gh please pr review-reply $COMMENT_ID

# Expected: Error about missing required --body option
```

#### 14. Test `gh please pr resolve`

**Resolve specific thread**:

```bash
# Get thread ID from PR
THREAD_ID=abc123

gh please pr resolve 1 --thread $THREAD_ID

# Expected output:
# 🔍 Resolving review thread...
# ✅ Thread resolved successfully!

# Verify:
# - Thread marked as resolved on GitHub
```

**Resolve all threads**:

```bash
gh please pr resolve 1 --all

# Expected output:
# 🔍 Finding all unresolved threads for PR #1...
# 🔄 Resolving 3 threads...
# ✅ All threads resolved successfully!

# Verify:
# - All threads in PR #1 are resolved
```

**Test without options**:

```bash
gh please pr resolve 1

# Expected: Error about requiring either --thread or --all
```

---

### Configuration Command

#### 15. Test `gh please init`

```bash
# Initialize config
gh please init

# Expected output:
# 📝 Creating .please/config.yml...
# ✅ Configuration file created!

# Verify:
# - File .please/config.yml exists
# - Contains valid YAML structure
# - Has default configuration values
```

**Test overwrite protection**:

```bash
# Run again
gh please init

# Expected: Prompt or warning about existing file
```

---

### Deprecated Commands

#### 16. Test deprecated `review-reply`

```bash
gh please review-reply $COMMENT_ID -b "Test"

# Expected output:
# ⚠️  Warning: 'gh please review-reply' is deprecated.
#    Please use 'gh please pr review-reply' instead.
#
# (Then executes the command normally)

# Verify:
# - Shows deprecation warning
# - Still works correctly
# - Reply posted successfully
```

---

## Error Testing

### Test Network Errors

```bash
# Turn off internet connection or use invalid token
gh please ai triage 1

# Expected: Clear error message about network/auth failure
```

### Test Invalid Arguments

```bash
# Missing required arguments
gh please issue sub-issue create

# Invalid number format
gh please ai triage "not-a-number"

# Invalid options
gh please pr resolve 1
# (without --thread or --all)
```

### Test Permission Errors

```bash
# Try on a repo where you don't have write access
# (Use a public repo you don't own)
gh please ai triage 1

# Expected: Clear error about permissions
```

---

## Performance Testing

### Test with Large Numbers

```bash
# Create issue with large number
gh please ai triage 9999

# List sub-issues of issue with many sub-issues
# (Create 10+ sub-issues first)
gh please issue sub-issue list 1

# Expected: Should handle gracefully, not timeout
```

---

## Checklist

Use this checklist to track manual testing progress:

- [ ] AI Commands
  - [ ] `ai triage` - valid issue
  - [ ] `ai investigate` - valid issue
  - [ ] `ai fix` - valid issue
  - [ ] `ai review` - valid PR
  - [ ] `ai apply` - valid PR
  - [ ] Error handling for invalid inputs

- [ ] Issue Sub-issue Commands
  - [ ] `issue sub-issue create` - with body
  - [ ] `issue sub-issue create` - without body
  - [ ] `issue sub-issue add` - link existing
  - [ ] `issue sub-issue remove` - unlink
  - [ ] `issue sub-issue list` - with sub-issues
  - [ ] `issue sub-issue list` - empty list

- [ ] Issue Dependency Commands
  - [ ] `issue dependency add` - single blocker
  - [ ] `issue dependency add` - multiple blockers
  - [ ] `issue dependency remove`
  - [ ] `issue dependency list` - with dependencies
  - [ ] `issue dependency list` - empty list

- [ ] PR Commands
  - [ ] `pr review-reply` - valid comment
  - [ ] `pr resolve --thread` - specific thread
  - [ ] `pr resolve --all` - all threads

- [ ] Configuration
  - [ ] `init` - first time
  - [ ] `init` - file exists

- [ ] Deprecated Commands
  - [ ] `review-reply` - shows warning

- [ ] Error Cases
  - [ ] Invalid issue numbers
  - [ ] Non-existent issues/PRs
  - [ ] Missing required options
  - [ ] Network errors
  - [ ] Permission errors

---

## Tips for Efficient Testing

1. **Use a dedicated test repository** - Don't pollute production repos
2. **Script the setup** - Use `scripts/manual-test.sh` to create test issues
3. **Document issue numbers** - Keep track of which issue is for what test
4. **Test in batches** - Group related commands together
5. **Clean up after** - Close or delete test issues when done
6. **Take screenshots** - Document UI changes for verification
7. **Test edge cases** - Try boundary values and unusual inputs

---

## Reporting Issues

If you find any issues during manual testing:

1. Note the exact command used
2. Capture the full output (including errors)
3. Document expected vs actual behavior
4. Check if issue is reproducible
5. Create GitHub issue with reproduction steps

---

## Next Steps

After completing manual testing:

1. Run automated test suite: `bun test`
2. Check test coverage: `bun test --coverage`
3. Run CLI integration tests: `bun test:integration`
4. Run E2E tests (if configured): `bun test:e2e`
