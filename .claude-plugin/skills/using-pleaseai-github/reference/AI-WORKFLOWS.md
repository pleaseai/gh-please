# AI Workflows

Detailed guide to PleaseAI automation workflows for issue management and code review.

## Overview

PleaseAI provides five AI-powered workflows that automate common development tasks:

1. **triage** - Automatically categorize and label issues
2. **investigate** - Deep analysis of bugs and issues
3. **fix** - Automated code fixes with tests
4. **review** - Comprehensive code review
5. **apply** - Apply AI suggestions to PRs

All workflows are triggered via GitHub issue/PR comments using the `/please` command or directly through `gh please ai` commands.

## Trigger Mechanism

### Via Comment (GitHub UI)

Post a comment on any issue or PR:

```
/please triage
/please investigate
/please fix
/please review
/please apply
```

PleaseAI bot monitors for these commands and executes the requested workflow.

**Example workflow:**
1. User reports bug in issue #123
2. Maintainer comments: `/please triage`
3. PleaseAI analyzes issue, adds labels (`bug`, `priority:high`)
4. Maintainer comments: `/please investigate`
5. PleaseAI investigates, adds detailed analysis to issue
6. Maintainer comments: `/please fix`
7. PleaseAI creates PR #456 with fix

### Via CLI (Local)

Execute workflows directly from your terminal:

```bash
# Trigger triage on issue #123
gh please ai triage 123

# Trigger review on PR #456
gh please ai review 456
```

CLI commands create the `/please` comment automatically.

## Individual Workflows

### triage

**Purpose:** Auto-categorize issues and assign metadata

**When to use:**
- New issue reports need classification
- Bulk issue organization
- Automated intake processes

**What it does:**
1. Analyzes issue title and body
2. Determines issue type (bug, feature, question, etc.)
3. Adds appropriate labels
4. Sets priority (if applicable)
5. Assigns to appropriate team/milestone (if configured)

**Command:**
```bash
# Current repo
gh please ai triage 123

# Different repo
gh please ai triage 123 --repo owner/repo
```

**Example output:**
```
🤖 Triggering PleaseAI triage for issue #123...
✓ Created comment: /please triage
   View: https://github.com/owner/repo/issues/123
```

**Configuration (.please/config.yml):**
```yaml
issue_workflow:
  triage:
    auto: true              # Auto-triage new issues
    manual: true            # Allow manual triggers
    update_issue_type: true # Update issue type label
```

**Real-world example:**

**Issue #123: "App crashes when clicking submit button"**

Before triage:
- Labels: none
- Assignee: none
- Milestone: none

After `gh please ai triage 123`:
- Labels: `bug`, `priority:high`, `area:frontend`
- Assignee: @frontend-team
- Milestone: `v1.2.0`
- Comment added with triage summary

### investigate

**Purpose:** Deep analysis of bugs and issues

**When to use:**
- Bug reports need root cause analysis
- Issues lack reproduction steps
- Need to trace code paths

**What it does:**
1. Analyzes stack traces and error messages
2. Reviews related code
3. Identifies potential root causes
4. Suggests reproduction steps
5. Recommends fix approaches

**Command:**
```bash
gh please ai investigate 123
```

**Configuration:**
```yaml
issue_workflow:
  investigate:
    enabled: true
    org_members_only: true      # Restrict to org members
    auto_on_bug_label: false    # Auto-investigate when 'bug' label added
```

**Real-world example:**

**Issue #123: "Database connection timeout"**

User report:
```
I get an error when trying to save. The app hangs for 30 seconds then crashes.
```

After `gh please ai investigate 123`:

PleaseAI adds comment with:
```markdown
## Investigation Results

### Root Cause Analysis
- Database connection pool exhausted (max 10 connections)
- Connection leak in `UserService.updateProfile()` (src/services/user.ts:45)
- Connections not properly closed in error paths

### Evidence
- Stack trace shows timeout at connection.query()
- 10 active connections when issue occurs
- No connection.release() in catch block

### Reproduction Steps
1. Create 10 concurrent user profile updates
2. Trigger validation error in one request
3. Observe connection pool exhaustion
4. Next request times out after 30s

### Recommended Fix
1. Add try-finally block to ensure connection.release()
2. Implement connection pool monitoring
3. Add timeout for individual queries (5s)

See: src/services/user.ts:45-67
```

### fix

**Purpose:** Automated code fixes with tests

**When to use:**
- Issues have clear fix approaches
- Bugs with known solutions
- Standardizable fixes (linting, formatting)

**What it does:**
1. Analyzes issue and investigation results
2. Generates code fix
3. Creates unit tests
4. Runs tests locally (if configured)
5. Creates PR with fix

**Command:**
```bash
gh please ai fix 123
```

**Configuration:**
```yaml
issue_workflow:
  fix:
    enabled: true
    org_members_only: true
    require_investigation: false  # Require investigation first
    auto_create_pr: true          # Create PR automatically
    auto_run_tests: true          # Run tests before PR
```

**Real-world example:**

After investigating issue #123 (database connection leak):

```bash
gh please ai fix 123
```

PleaseAI:
1. Fixes `src/services/user.ts`:
   ```typescript
   async updateProfile(userId: string, data: ProfileData) {
     const connection = await pool.getConnection()
     try {
       const result = await connection.query(
         'UPDATE users SET ... WHERE id = ?',
         [data, userId]
       )
       return result
     } finally {
       connection.release()  // ✅ Always release
     }
   }
   ```

2. Adds test `test/services/user.test.ts`:
   ```typescript
   test('should release connection on error', async () => {
     await expect(
       updateProfile('invalid', {})
     ).rejects.toThrow()

     const poolStats = await pool.getStats()
     expect(poolStats.activeConnections).toBe(0)
   })
   ```

3. Creates PR #456:
   - Title: "fix: Release database connections in error paths"
   - Links to issue #123
   - Includes test results

### review

**Purpose:** Comprehensive code review

**When to use:**
- PRs need review but reviewers are unavailable
- Want automated security/quality checks
- Supplement human review

**What it does:**
1. Analyzes all changed files
2. Checks for:
   - Security vulnerabilities
   - Code quality issues
   - Performance problems
   - Best practice violations
3. Adds review comments
4. Suggests improvements

**Command:**
```bash
gh please ai review 456
```

**Configuration:**
```yaml
code_review:
  disable: false
  comment_severity_threshold: MEDIUM  # Only show MEDIUM+ issues
  max_review_comments: -1             # Unlimited (-1)
  pull_request_opened:
    code_review: true                 # Auto-review new PRs
    include_drafts: true              # Include draft PRs
```

**Severity levels:**
- `LOW`: Style suggestions, minor improvements
- `MEDIUM`: Potential bugs, maintainability issues
- `HIGH`: Security vulnerabilities, critical bugs

**Real-world example:**

PR #456 changes authentication logic:

```bash
gh please ai review 456
```

PleaseAI adds review comments:

**File: src/auth/login.ts:23**
```typescript
// ❌ High severity
const password = req.body.password
const hash = md5(password)  // Insecure hashing
```
**Comment:**
> 🔴 **HIGH**: Using MD5 for password hashing is insecure. Use bcrypt or argon2 instead.
>
> ```typescript
> const hash = await bcrypt.hash(password, 10)
> ```

**File: src/auth/session.ts:45**
```typescript
// ⚠️ Medium severity
const token = Math.random().toString(36)  // Predictable tokens
```
**Comment:**
> 🟡 **MEDIUM**: Using Math.random() for security tokens is predictable. Use crypto.randomBytes().
>
> ```typescript
> const token = crypto.randomBytes(32).toString('hex')
> ```

### apply

**Purpose:** Apply AI-suggested changes to PR

**When to use:**
- Review comments include code suggestions
- Want to auto-apply safe fixes
- Batch apply multiple suggestions

**What it does:**
1. Scans review comments for code suggestions
2. Applies suggestions to PR branch
3. Commits changes
4. Notifies reviewers

**Command:**
```bash
gh please ai apply 456
```

**Real-world example:**

After `gh please ai review 456` added suggestions:

```bash
gh please ai apply 456
```

PleaseAI:
1. Applies bcrypt fix from review comment
2. Applies crypto.randomBytes fix
3. Creates commit: "fix: Apply PleaseAI security suggestions"
4. Pushes to PR branch
5. Resolves review threads automatically

## Workflow Combinations

### Sequential Workflows

Chain workflows for complete automation:

```bash
# 1. Triage incoming bug
gh please ai triage 123

# 2. Investigate root cause
gh please ai investigate 123

# 3. Generate fix
gh please ai fix 123
# Creates PR #456

# 4. Review the fix
gh please ai review 456

# 5. Apply any suggestions
gh please ai apply 456
```

**Automation tip:** Configure auto-triggers in `.please/config.yml`:

```yaml
issue_workflow:
  triage:
    auto: true  # Auto-triage new issues
  investigate:
    auto_on_bug_label: true  # Auto-investigate bugs
  fix:
    require_investigation: true  # Only fix investigated issues
    auto_create_pr: true

code_review:
  pull_request_opened:
    code_review: true  # Auto-review new PRs
```

With this config:
1. User opens issue → Auto-triaged, labeled as `bug`
2. `bug` label triggers → Auto-investigation
3. Maintainer comments `/please fix` → PR created
4. PR opened → Auto-reviewed

### Parallel Workflows

Review multiple PRs concurrently:

```bash
# Terminal 1
gh please ai review 450

# Terminal 2
gh please ai review 451

# Terminal 3
gh please ai review 452
```

Or use a loop:
```bash
for pr in 450 451 452; do
  gh please ai review $pr &
done
wait
```

### Cross-Repository Workflows

Manage related issues across repos:

```bash
# Triage in main repo
gh please ai triage 100

# Fix requires changes in multiple repos
gh please ai fix 100 --repo org/backend
gh please ai fix 100 --repo org/frontend
```

## Best Practices

### Triage
- ✅ Use for initial issue intake
- ✅ Configure `auto: true` for public repos
- ✅ Review auto-triage accuracy periodically
- ❌ Don't triage issues that need human judgment (features, design decisions)

### Investigate
- ✅ Use for complex bugs
- ✅ Provide stack traces and error logs in issue
- ✅ Review investigation before fixing
- ❌ Don't skip investigation for security issues

### Fix
- ✅ Review generated code before merging
- ✅ Ensure tests are comprehensive
- ✅ Use `require_investigation: true` for safety
- ❌ Don't auto-merge fixes without review

### Review
- ✅ Treat as first-pass review (complement human review)
- ✅ Set `comment_severity_threshold: MEDIUM` to reduce noise
- ✅ Address HIGH severity issues immediately
- ❌ Don't rely solely on AI review for security-critical PRs

### Apply
- ✅ Review suggested changes before applying
- ✅ Use for safe, mechanical fixes
- ✅ Test after applying
- ❌ Don't blindly apply all suggestions

## Language Support

All workflows support bilingual output (Korean/English) based on system language:

```bash
# Korean environment
LANG=ko_KR.UTF-8 gh please ai triage 123
# Output: 🤖 이슈 #123에 대한 PleaseAI 분류 트리거 중...
# PleaseAI comments will be in Korean

# English environment
LANG=en_US.UTF-8 gh please ai triage 123
# Output: 🤖 Triggering PleaseAI triage for issue #123...
# PleaseAI comments will be in English
```

Language detection (in order):
1. `LANG` environment variable
2. `LANGUAGE` environment variable
3. `LC_ALL` environment variable

Supported languages:
- `ko` (Korean)
- `en` (English - default)

## Complete Example: Bug Fix Workflow

**Scenario:** User reports "App crashes on startup"

**Step 1: Triage**
```bash
gh please ai triage 123
```

Result:
- Labels: `bug`, `priority:critical`, `area:core`
- Milestone: `Next Release`

**Step 2: Investigate**
```bash
gh please ai investigate 123
```

Result (comment added to issue):
```markdown
## Investigation

### Root Cause
NullPointerException in `App.init()` when config file missing

### Stack Trace Analysis
- Error at: src/app.ts:12
- Cause: config.database accessed before null check

### Reproduction
1. Delete .config/app.yml
2. Run: npm start
3. Observe crash

### Fix Approach
Add null check and default config fallback
```

**Step 3: Generate Fix**
```bash
gh please ai fix 123
```

Result:
- PR #456 created
- Files changed: `src/app.ts`, `test/app.test.ts`
- Tests passing

**Step 4: Review Fix**
```bash
gh please ai review 456
```

Result:
- 2 comments added (MEDIUM severity)
- Suggests adding error logging

**Step 5: Apply Suggestions**
```bash
gh please ai apply 456
```

Result:
- Logging added
- Commit pushed
- Ready for human review

**Total time:** ~5 minutes (vs hours of manual work)

## Troubleshooting

**"workflow not triggered"**
- Check `.please/config.yml` for disabled workflows
- Verify org permissions (if `org_members_only: true`)
- Check GitHub App installation

**"investigation incomplete"**
- Ensure issue has enough context (error messages, logs)
- Add reproduction steps manually if missing
- Check PleaseAI service status

**"fix failed tests"**
- Review generated code manually
- Check test configuration
- Ensure dependencies are installed

**"review too verbose"**
- Increase `comment_severity_threshold` to `HIGH`
- Set `max_review_comments` limit
- Configure ignore patterns for vendor code

**"apply conflicts"**
- PR branch has diverged from suggestions
- Manually resolve conflicts
- Re-run review after resolving

---

**Last Updated:** 2025-10-19
**Related:** [ISSUE-MANAGEMENT.md](./ISSUE-MANAGEMENT.md), [PR-REVIEWS.md](./PR-REVIEWS.md)
