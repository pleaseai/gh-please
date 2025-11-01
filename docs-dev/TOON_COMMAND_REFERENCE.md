# TOON Command Reference

Complete reference of all GitHub CLI commands with TOON format examples and field mappings.

## Table of Contents

- [Core Commands](#core-commands)
  - [issue](#issue)
  - [pr](#pr)
  - [repo](#repo)
  - [release](#release)
  - [gist](#gist)
  - [org](#org)
  - [project](#project)
  - [codespace](#codespace)
- [GitHub Actions Commands](#github-actions-commands)
  - [workflow](#workflow)
  - [run](#run)
  - [cache](#cache)
- [Additional Commands](#additional-commands)
  - [api](#api)
  - [search](#search)
  - [label](#label)
  - [secret](#secret)
  - [variable](#variable)

---

## Core Commands

### issue

Manage GitHub issues.

#### issue list

List issues in a repository.

**Usage:**
```bash
gh please issue list [flags]
```

**Common Flags:**
- `-s, --state <string>`: Filter by state (open|closed|all)
- `-a, --assignee <string>`: Filter by assignee
- `-A, --author <string>`: Filter by author
- `-l, --label <strings>`: Filter by labels
- `-L, --limit <int>`: Maximum number to fetch

**TOON Output:**
```
number	title	state	author.login	labels	assignees	milestone.title	updatedAt
123	Fix authentication bug	OPEN	monalisa	bug,p1	alice,bob	v1.0	2024-01-15T10:30:00Z
124	Add dark mode	CLOSED	octocat	feature	charlie		2024-01-14T15:20:00Z
125	Update documentation	OPEN	hubot	docs		v1.1	2024-01-13T09:15:00Z
```

**Field Mapping:**
- `number`: Issue number
- `title`: Issue title
- `state`: OPEN | CLOSED
- `author.login`: Issue creator username
- `labels`: Comma-separated label names
- `assignees`: Comma-separated assignee usernames
- `milestone.title`: Milestone title (empty if none)
- `updatedAt`: Last update timestamp (ISO 8601)

**JMESPath Examples:**
```bash
# Only open issues
gh please issue list --query "[?state=='OPEN']"

# Issues assigned to me
gh please issue list --query "[?contains(assignees, 'alice')]"

# P1 bugs
gh please issue list --query "[?contains(labels, 'bug') && contains(labels, 'p1')]"
```

#### issue view

View details of a specific issue.

**Usage:**
```bash
gh please issue view <number> [flags]
```

**TOON Output:**
```
number	title	state	author.login	body	labels	assignees	milestone.title	createdAt	updatedAt	url
123	Fix authentication bug	OPEN	monalisa	Detailed description of the bug...	bug,p1	alice,bob	v1.0	2024-01-10T09:00:00Z	2024-01-15T10:30:00Z	https://github.com/owner/repo/issues/123
```

**Field Mapping** (21 fields available):
- All fields from `issue list`
- `body`: Issue description (full text)
- `comments`: Number of comments
- `createdAt`: Creation timestamp
- `closedAt`: Close timestamp (if closed)
- `url`: Issue URL

**Available Fields:**
```
assignees, author, body, closed, closedAt, closedByPullRequestsReferences,
comments, createdAt, id, isPinned, labels, milestone, number, projectCards,
projectItems, reactionGroups, state, stateReason, title, updatedAt, url
```

#### issue create

Create a new issue.

**Usage:**
```bash
gh please issue create [flags]
```

**Common Flags:**
- `-t, --title <string>`: Issue title (required)
- `-b, --body <string>`: Issue body
- `-a, --assignee <strings>`: Assignees
- `-l, --label <strings>`: Labels
- `-m, --milestone <string>`: Milestone

**TOON Output:**
```
number	title	url
126	New feature request	https://github.com/owner/repo/issues/126
```

#### Other issue commands

| Command | Description | TOON Support |
|---------|-------------|--------------|
| `issue close <number>` | Close an issue | ✅ Yes |
| `issue reopen <number>` | Reopen an issue | ✅ Yes |
| `issue edit <number>` | Edit issue details | ✅ Yes |
| `issue comment <number>` | Add comment to issue | ✅ Yes |
| `issue delete <number>` | Delete an issue | ✅ Yes |
| `issue lock <number>` | Lock issue conversation | ✅ Yes |
| `issue unlock <number>` | Unlock issue conversation | ✅ Yes |
| `issue pin <number>` | Pin an issue | ✅ Yes |
| `issue unpin <number>` | Unpin an issue | ✅ Yes |
| `issue transfer <number>` | Transfer issue to another repo | ✅ Yes |
| `issue status` | Show status of your issues | ✅ Yes |

---

### pr

Manage pull requests.

#### pr list

List pull requests in a repository.

**Usage:**
```bash
gh please pr list [flags]
```

**Common Flags:**
- `-s, --state <string>`: Filter by state (open|closed|merged|all)
- `-a, --assignee <string>`: Filter by assignee
- `-A, --author <string>`: Filter by author
- `-B, --base <string>`: Filter by base branch
- `-H, --head <string>`: Filter by head branch
- `-l, --label <strings>`: Filter by labels
- `-L, --limit <int>`: Maximum number to fetch

**TOON Output:**
```
number	title	state	author.login	headRefName	baseRefName	isDraft	labels	reviewDecision	updatedAt
456	Add authentication	OPEN	monalisa	feat-auth	main	false	feature	APPROVED	2024-01-15T14:20:00Z
457	Fix typo	MERGED	octocat	fix-typo	main	false	docs		2024-01-14T10:30:00Z
458	WIP: Refactor API	OPEN	hubot	refactor-api	main	true	refactor	REVIEW_REQUIRED	2024-01-13T16:45:00Z
```

**Field Mapping:**
- `number`: PR number
- `title`: PR title
- `state`: OPEN | CLOSED | MERGED
- `author.login`: PR creator username
- `headRefName`: Source branch name
- `baseRefName`: Target branch name
- `isDraft`: Draft status (true/false)
- `labels`: Comma-separated label names
- `reviewDecision`: APPROVED | CHANGES_REQUESTED | REVIEW_REQUIRED | (empty)
- `updatedAt`: Last update timestamp

**JMESPath Examples:**
```bash
# Only approved PRs
gh please pr list --query "[?reviewDecision=='APPROVED']"

# Draft PRs
gh please pr list --query "[?isDraft==\`true\`]"

# PRs targeting main branch
gh please pr list --query "[?baseRefName=='main']"

# PRs by author excluding drafts
gh please pr list --query "[?author.login=='monalisa' && isDraft==\`false\`]"
```

#### pr view

View details of a specific pull request.

**Usage:**
```bash
gh please pr view <number> [flags]
```

**TOON Output:**
```
number	title	state	author.login	headRefName	baseRefName	isDraft	additions	deletions	changedFiles	commits	reviewDecision	mergeable	url
456	Add authentication	OPEN	monalisa	feat-auth	main	false	234	56	8	5	APPROVED	MERGEABLE	https://github.com/owner/repo/pull/456
```

**Available Fields** (46 fields):
```
additions, assignees, author, autoMergeRequest, baseRefName, baseRefOid, body,
changedFiles, closed, closedAt, closingIssuesReferences, comments, commits,
createdAt, deletions, files, fullDatabaseId, headRefName, headRefOid,
headRepository, headRepositoryOwner, id, isCrossRepository, isDraft, labels,
latestReviews, maintainerCanModify, mergeCommit, mergeStateStatus, mergeable,
mergedAt, mergedBy, milestone, number, potentialMergeCommit, projectCards,
projectItems, reactionGroups, reviewDecision, reviewRequests, reviews, state,
statusCheckRollup, title, updatedAt, url
```

#### pr checks

View CI/CD check status for a pull request.

**Usage:**
```bash
gh please pr checks <number> [flags]
```

**TOON Output:**
```
name	status	conclusion	startedAt	completedAt	detailsUrl
Build	COMPLETED	SUCCESS	2024-01-15T10:00:00Z	2024-01-15T10:05:00Z	https://github.com/owner/repo/actions/runs/12345
Test	COMPLETED	SUCCESS	2024-01-15T10:00:00Z	2024-01-15T10:08:00Z	https://github.com/owner/repo/actions/runs/12346
Lint	IN_PROGRESS	null	2024-01-15T10:00:00Z	null	https://github.com/owner/repo/actions/runs/12347
```

**Field Mapping:**
- `name`: Check name
- `status`: QUEUED | IN_PROGRESS | COMPLETED
- `conclusion`: SUCCESS | FAILURE | CANCELLED | SKIPPED | null
- `startedAt`: Start timestamp
- `completedAt`: Completion timestamp (null if not completed)
- `detailsUrl`: URL to check details

#### Other pr commands

| Command | Description | TOON Support |
|---------|-------------|--------------|
| `pr create` | Create a pull request | ✅ Yes |
| `pr checkout <number>` | Check out a PR locally | ❌ No (action command) |
| `pr close <number>` | Close a pull request | ✅ Yes |
| `pr reopen <number>` | Reopen a pull request | ✅ Yes |
| `pr merge <number>` | Merge a pull request | ✅ Yes |
| `pr ready <number>` | Mark draft PR as ready | ✅ Yes |
| `pr diff <number>` | View PR diff | ❌ No (diff output) |
| `pr edit <number>` | Edit PR details | ✅ Yes |
| `pr review <number>` | Add review to PR | ✅ Yes |
| `pr comment <number>` | Add comment to PR | ✅ Yes |
| `pr lock <number>` | Lock PR conversation | ✅ Yes |
| `pr unlock <number>` | Unlock PR conversation | ✅ Yes |
| `pr status` | Show status of your PRs | ✅ Yes |

---

### repo

Manage repositories.

#### repo list

List repositories for a user or organization.

**Usage:**
```bash
gh please repo list [owner] [flags]
```

**Common Flags:**
- `-L, --limit <int>`: Maximum number to fetch
- `--archived`: Include archived repos
- `--fork`: Include forks
- `--source`: Include source repos only
- `--language <string>`: Filter by language

**TOON Output:**
```
nameWithOwner	description	visibility	primaryLanguage.name	stargazerCount	forkCount	updatedAt	url
owner/repo1	My awesome project	PUBLIC	TypeScript	245	34	2024-01-15T08:30:00Z	https://github.com/owner/repo1
owner/repo2	Utility library	PRIVATE	JavaScript	12	3	2024-01-14T16:20:00Z	https://github.com/owner/repo2
owner/repo3	Documentation site	PUBLIC	Markdown	89	15	2024-01-13T11:45:00Z	https://github.com/owner/repo3
```

**Field Mapping:**
- `nameWithOwner`: Full repo name (owner/repo)
- `description`: Repo description
- `visibility`: PUBLIC | PRIVATE | INTERNAL
- `primaryLanguage.name`: Primary programming language
- `stargazerCount`: Star count
- `forkCount`: Fork count
- `updatedAt`: Last update timestamp
- `url`: Repository URL

**JMESPath Examples:**
```bash
# Only TypeScript repos
gh please repo list --query "[?primaryLanguage.name=='TypeScript']"

# Repos with >100 stars
gh please repo list --query "[?stargazerCount > \`100\`]"

# Recently updated repos (last 7 days)
gh please repo list --query "[?updatedAt > '2024-01-08']"
```

#### repo view

View details of a repository.

**Usage:**
```bash
gh please repo view [<owner/repo>] [flags]
```

**TOON Output:**
```
nameWithOwner	description	visibility	primaryLanguage.name	stargazerCount	forkCount	isArchived	isFork	hasIssuesEnabled	hasWikiEnabled	createdAt	pushedAt	url
owner/repo	My project	PUBLIC	TypeScript	245	34	false	false	true	true	2023-06-15T10:00:00Z	2024-01-15T08:30:00Z	https://github.com/owner/repo
```

**Available Fields** (67 fields):
```
archivedAt, assignableUsers, codeOfConduct, contactLinks, createdAt,
defaultBranchRef, deleteBranchOnMerge, description, diskUsage, forkCount,
fundingLinks, hasDiscussionsEnabled, hasIssuesEnabled, hasProjectsEnabled,
hasWikiEnabled, homepageUrl, id, isArchived, isBlankIssuesEnabled, isEmpty,
isFork, isInOrganization, isMirror, isPrivate, isSecurityPolicyEnabled,
isTemplate, isUserConfigurationRepository, issueTemplates, issues, labels,
languages, latestRelease, licenseInfo, mentionableUsers, mergeCommitAllowed,
milestones, mirrorUrl, name, nameWithOwner, openGraphImageUrl, owner, parent,
primaryLanguage, projects, projectsV2, pullRequestTemplates, pullRequests,
pushedAt, rebaseMergeAllowed, repositoryTopics, securityPolicyUrl,
squashMergeAllowed, sshUrl, stargazerCount, templateRepository, updatedAt, url,
usesCustomOpenGraphImage, viewerCanAdminister, viewerDefaultCommitEmail,
viewerDefaultMergeMethod, viewerHasStarred, viewerPermission,
viewerPossibleCommitEmails, viewerSubscription, visibility, watchers
```

#### Other repo commands

| Command | Description | TOON Support |
|---------|-------------|--------------|
| `repo create <name>` | Create a new repository | ✅ Yes |
| `repo fork [<repo>]` | Fork a repository | ✅ Yes |
| `repo clone <repo>` | Clone a repository | ❌ No (action command) |
| `repo delete <repo>` | Delete a repository | ✅ Yes |
| `repo archive <repo>` | Archive a repository | ✅ Yes |
| `repo unarchive <repo>` | Unarchive a repository | ✅ Yes |
| `repo edit [<repo>]` | Edit repository settings | ✅ Yes |
| `repo rename <new-name>` | Rename repository | ✅ Yes |
| `repo sync [<repo>]` | Sync forked repository | ✅ Yes |

---

### release

Manage releases.

#### release list

List releases in a repository.

**Usage:**
```bash
gh please release list [flags]
```

**Common Flags:**
- `-L, --limit <int>`: Maximum number to fetch
- `--exclude-drafts`: Exclude draft releases
- `--exclude-pre-releases`: Exclude pre-releases

**TOON Output:**
```
tagName	name	isLatest	isDraft	isPrerelease	publishedAt	author.login	url
v1.2.0	Version 1.2.0	true	false	false	2024-01-15T10:00:00Z	monalisa	https://github.com/owner/repo/releases/tag/v1.2.0
v1.1.0	Version 1.1.0	false	false	false	2024-01-08T14:30:00Z	octocat	https://github.com/owner/repo/releases/tag/v1.1.0
v1.0.0	Version 1.0.0	false	false	false	2023-12-20T09:00:00Z	hubot	https://github.com/owner/repo/releases/tag/v1.0.0
```

**Field Mapping:**
- `tagName`: Git tag name
- `name`: Release name/title
- `isLatest`: Latest release flag (true/false)
- `isDraft`: Draft status (true/false)
- `isPrerelease`: Pre-release status (true/false)
- `publishedAt`: Publication timestamp
- `author.login`: Release creator username
- `url`: Release URL

**JMESPath Examples:**
```bash
# Only stable releases (no drafts, no pre-releases)
gh please release list --query "[?isDraft==\`false\` && isPrerelease==\`false\`]"

# Latest release
gh please release list --query "[?isLatest==\`true\`] | [0]"

# Releases in 2024
gh please release list --query "[?starts_with(publishedAt, '2024')]"
```

#### release view

View details of a specific release.

**Usage:**
```bash
gh please release view [<tag>] [flags]
```

**TOON Output:**
```
tagName	name	isLatest	isDraft	isPrerelease	body	publishedAt	author.login	assets	url
v1.2.0	Version 1.2.0	true	false	false	Release notes...	2024-01-15T10:00:00Z	monalisa	app-v1.2.0.zip,app-v1.2.0.tar.gz	https://github.com/owner/repo/releases/tag/v1.2.0
```

**Available Fields** (18 fields):
```
apiUrl, assets, author, body, createdAt, databaseId, id, isDraft, isImmutable,
isPrerelease, name, publishedAt, tagName, tarballUrl, targetCommitish, uploadUrl,
url, zipballUrl
```

#### Other release commands

| Command | Description | TOON Support |
|---------|-------------|--------------|
| `release create <tag>` | Create a new release | ✅ Yes |
| `release delete <tag>` | Delete a release | ✅ Yes |
| `release edit <tag>` | Edit release details | ✅ Yes |
| `release upload <tag> <files...>` | Upload assets to release | ✅ Yes |
| `release download <tag>` | Download release assets | ❌ No (action command) |
| `release delete-asset <tag> <asset>` | Delete release asset | ✅ Yes |

---

### gist

Manage gists.

#### gist list

List your gists.

**Usage:**
```bash
gh please gist list [flags]
```

**Common Flags:**
- `-L, --limit <int>`: Maximum number to fetch
- `--public`: Show only public gists
- `--secret`: Show only secret gists

**TOON Output:**
```
id	description	public	files	updatedAt	url
abc123def456	Quick script for data processing	true	process.py	2024-01-15T09:30:00Z	https://gist.github.com/abc123def456
xyz789uvw012	Config file template	false	config.yaml	2024-01-14T16:20:00Z	https://gist.github.com/xyz789uvw012
```

**Field Mapping:**
- `id`: Gist ID
- `description`: Gist description
- `public`: Public status (true/false)
- `files`: Comma-separated file names
- `updatedAt`: Last update timestamp
- `url`: Gist URL

#### Other gist commands

| Command | Description | TOON Support |
|---------|-------------|--------------|
| `gist create <files...>` | Create a new gist | ✅ Yes |
| `gist view <id>` | View gist content | ✅ Yes |
| `gist edit <id>` | Edit a gist | ✅ Yes |
| `gist delete <id>` | Delete a gist | ✅ Yes |
| `gist clone <id>` | Clone a gist | ❌ No (action command) |

---

### org

Manage organizations.

#### org list

List organizations for a user.

**Usage:**
```bash
gh please org list [flags]
```

**TOON Output:**
```
login	name	description	url
github	GitHub	How people build software	https://github.com/github
nodejs	Node.js	Node.js JavaScript runtime	https://github.com/nodejs
```

---

### project

Manage GitHub Projects.

#### project list

List projects in a repository or organization.

**Usage:**
```bash
gh please project list [flags]
```

**TOON Output:**
```
number	title	state	url
1	Website redesign	OPEN	https://github.com/users/owner/projects/1
2	Bug tracking	OPEN	https://github.com/users/owner/projects/2
3	Q4 2023 goals	CLOSED	https://github.com/users/owner/projects/3
```

---

### codespace

Manage codespaces.

#### codespace list

List codespaces.

**Usage:**
```bash
gh please codespace list [flags]
```

**TOON Output:**
```
name	repository	branch	state	createdAt	url
monalisa-shiny-space	owner/repo	main	AVAILABLE	2024-01-15T08:00:00Z	https://github.com/codespaces/abc123
octocat-happy-tree	owner/repo2	dev	SHUTDOWN	2024-01-10T14:30:00Z	https://github.com/codespaces/xyz789
```

---

## GitHub Actions Commands

### workflow

Manage GitHub Actions workflows.

#### workflow list

List workflows in a repository.

**Usage:**
```bash
gh please workflow list [flags]
```

**TOON Output:**
```
id	name	path	state	url
12345	CI	.github/workflows/ci.yml	active	https://github.com/owner/repo/actions/workflows/ci.yml
67890	Release	.github/workflows/release.yml	active	https://github.com/owner/repo/actions/workflows/release.yml
```

**Field Mapping:**
- `id`: Workflow ID
- `name`: Workflow name
- `path`: Workflow file path
- `state`: active | disabled_manually | disabled_inactivity
- `url`: Workflow URL

#### workflow view

View details of a workflow.

**Usage:**
```bash
gh please workflow view <workflow> [flags]
```

---

### run

Manage workflow runs.

#### run list

List workflow runs.

**Usage:**
```bash
gh please run list [flags]
```

**Common Flags:**
- `-w, --workflow <string>`: Filter by workflow
- `-b, --branch <string>`: Filter by branch
- `-s, --status <string>`: Filter by status
- `-L, --limit <int>`: Maximum number to fetch

**TOON Output:**
```
databaseId	name	status	conclusion	headBranch	event	createdAt	url
123456	CI	completed	success	main	push	2024-01-15T10:00:00Z	https://github.com/owner/repo/actions/runs/123456
123457	CI	in_progress	null	feat-auth	pull_request	2024-01-15T10:05:00Z	https://github.com/owner/repo/actions/runs/123457
123458	CI	completed	failure	fix-bug	push	2024-01-15T09:30:00Z	https://github.com/owner/repo/actions/runs/123458
```

**Field Mapping:**
- `databaseId`: Run ID
- `name`: Workflow name
- `status`: queued | in_progress | completed
- `conclusion`: success | failure | cancelled | skipped | null
- `headBranch`: Branch name
- `event`: Trigger event (push, pull_request, etc.)
- `createdAt`: Start timestamp
- `url`: Run URL

**JMESPath Examples:**
```bash
# Failed runs
gh please run list --query "[?conclusion=='failure']"

# Runs on main branch
gh please run list --query "[?headBranch=='main']"

# Recent runs (last 24 hours)
gh please run list --query "[?createdAt > '2024-01-14T10:00:00Z']"
```

#### run view

View details of a workflow run.

**Usage:**
```bash
gh please run view <run-id> [flags]
```

---

### cache

Manage GitHub Actions caches.

#### cache list

List action caches.

**Usage:**
```bash
gh please cache list [flags]
```

**TOON Output:**
```
id	key	sizeInBytes	createdAt	lastAccessedAt	ref
1	node-modules-abc123	52428800	2024-01-15T08:00:00Z	2024-01-15T10:30:00Z	refs/heads/main
2	build-xyz789	104857600	2024-01-14T14:20:00Z	2024-01-15T09:15:00Z	refs/heads/dev
```

---

## Additional Commands

### api

Make authenticated GitHub API requests.

**Usage:**
```bash
gh please api <endpoint> [flags]
```

**TOON Output:**
Depends on API endpoint response. Automatically converted from JSON to TOON.

**Example:**
```bash
# Get user info
gh please api /user

# TOON Output:
login	name	email	company	location	bio	public_repos	followers
monalisa	Mona Lisa	mona@github.com	GitHub	San Francisco	Developer Advocate	42	1234
```

---

### search

Search GitHub.

#### search repos

Search repositories.

**Usage:**
```bash
gh please search repos <query> [flags]
```

**TOON Output:**
```
fullName	description	stargazerCount	language	updatedAt	url
owner/repo1	Awesome project	1234	TypeScript	2024-01-15	https://github.com/owner/repo1
owner/repo2	Utility lib	567	JavaScript	2024-01-14	https://github.com/owner/repo2
```

#### search issues

Search issues and pull requests.

**Usage:**
```bash
gh please search issues <query> [flags]
```

#### search prs

Search pull requests.

**Usage:**
```bash
gh please search prs <query> [flags]
```

---

### label

Manage labels.

#### label list

List labels in a repository.

**Usage:**
```bash
gh please label list [flags]
```

**TOON Output:**
```
name	description	color
bug	Something isn't working	d73a4a
enhancement	New feature or request	a2eeef
documentation	Improvements to documentation	0075ca
```

---

### secret

Manage GitHub secrets.

#### secret list

List secrets.

**Usage:**
```bash
gh please secret list [flags]
```

**TOON Output:**
```
name	updatedAt
DATABASE_URL	2024-01-15T10:00:00Z
API_KEY	2024-01-14T15:30:00Z
```

---

### variable

Manage GitHub Actions variables.

#### variable list

List variables.

**Usage:**
```bash
gh please variable list [flags]
```

**TOON Output:**
```
name	value	updatedAt
NODE_VERSION	18.x	2024-01-15T09:00:00Z
ENVIRONMENT	production	2024-01-10T14:20:00Z
```

---

## Command Support Matrix

### TOON Format Support

| Command Group | List Commands | View Commands | Action Commands | Total |
|---------------|---------------|---------------|----------------|-------|
| issue | ✅ Full | ✅ Full | ✅ Full | 12/12 |
| pr | ✅ Full | ✅ Full | ⚠️ Partial | 14/16 |
| repo | ✅ Full | ✅ Full | ⚠️ Partial | 8/13 |
| release | ✅ Full | ✅ Full | ⚠️ Partial | 6/8 |
| workflow | ✅ Full | ✅ Full | ✅ Full | 5/5 |
| run | ✅ Full | ✅ Full | ⚠️ Partial | 5/7 |
| cache | ✅ Full | N/A | ✅ Full | 2/2 |
| gist | ✅ Full | ✅ Full | ⚠️ Partial | 4/6 |
| search | ✅ Full | N/A | N/A | 3/3 |
| label | ✅ Full | N/A | ✅ Full | 4/4 |
| secret | ✅ Full | N/A | ✅ Full | 3/3 |
| variable | ✅ Full | N/A | ✅ Full | 3/3 |

**Legend:**
- ✅ Full: All subcommands support TOON format
- ⚠️ Partial: Some subcommands don't support TOON (action commands like clone, checkout)
- ❌ None: No TOON support (commands without --json support)

### JMESPath Query Support

All commands that support TOON format also support JMESPath queries via `--query` flag.

**Universal patterns:**
- Filtering: `[?field=='value']`
- Field selection: `[].{key: field}`
- Sorting: `sort_by([], &field)`
- Aggregation: `length([])`

See [JMESPATH_PATTERNS.md](./JMESPATH_PATTERNS.md) for comprehensive examples.

---

## Related Documentation

- [TOON_JMESPATH_MIGRATION.md](./TOON_JMESPATH_MIGRATION.md) - Migration plan and roadmap
- [JMESPATH_PATTERNS.md](./JMESPATH_PATTERNS.md) - Query patterns and examples
- [GH_CLI_PASSTHROUGH.md](./GH_CLI_PASSTHROUGH.md) - Passthrough implementation
- [ADR 0006](./adr/0006-toon-format.md) - TOON format design
