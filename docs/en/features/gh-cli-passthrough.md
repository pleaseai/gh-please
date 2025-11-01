# gh CLI Passthrough

gh-please automatically supports **all** GitHub CLI commands through passthrough, even if they're not explicitly registered as gh-please commands.

## Overview

When you run a command that isn't recognized by gh-please (like `issue`, `pr`, or `plugin`), it automatically forwards the command to the native `gh` CLI. This means you get:

- ✅ **Complete gh CLI coverage** - Access all 100+ gh commands through gh-please
- ✅ **Automatic updates** - New gh CLI features work immediately
- ✅ **TOON format support** - Convert any gh output to TOON format
- ✅ **Zero learning curve** - Use familiar gh commands

## Basic Usage

### Default Behavior

By default, passthrough commands preserve gh CLI's original output format (human-readable tables):

```bash
# View repository information (outputs formatted table)
gh please repo view

# List workflow runs (outputs colored table)
gh please workflow list

# View release information (outputs formatted details)
gh please release view v1.0.0
```

**Output**: Same as running `gh <command>` directly - formatted tables, colors, and progress indicators.

## Structured Output Formats

### TOON Format

Convert gh CLI output to TOON format (tab-delimited, optimized for LLMs):

```bash
# List issues in TOON format
gh please issue list --format toon

# List pull requests in TOON format
gh please pr list --format toon --state open

# View repository details in TOON format
gh please repo view --format toon
```

**Example Output**:
```
number  title            state   author
123     Add TOON support OPEN    monalisa
124     Fix bug          CLOSED  octocat
```

### JSON Format

Get machine-readable JSON output:

```bash
# List issues as JSON
gh please issue list --format json

# List PRs with specific fields as JSON
gh please pr list --state open --json number,title,author
```

**Example Output**:
```json
[
  {
    "number": 123,
    "title": "Add TOON support",
    "state": "OPEN",
    "author": {
      "login": "monalisa"
    }
  }
]
```

### JMESPath Query Support (Phase 1.5)

Filter and transform output using JMESPath queries with the `--query` flag:

```bash
# Filter draft releases
gh please release list --query '[?isDraft]'

# Get only the latest release
gh please release list --query '[?isLatest]'

# Filter open issues
gh please issue list --query "[?state=='OPEN']"

# Extract specific fields
gh please release view v1.0.0 --query 'tagName'

# Complex transformations
gh please issue list --query '[?state==`OPEN`].{number:number,title:title}'
```

**Example Output** (filtering draft releases):
```
[0	]:
```
_Empty array because no draft releases exist_

**Example Output** (latest release):
```
[1	]{createdAt	isDraft	isLatest	isPrerelease	name	publishedAt	tagName}:
  "2025-11-01T10:39:16Z"	false	true	false	"github: v0.25.0"	"2025-11-01T10:39:26Z"	github-v0.25.0
```

**Common Query Patterns**:

```bash
# Filter by boolean field
--query '[?isDraft]'                    # Draft releases
--query '[?!isDraft]'                   # Non-draft releases

# Filter by string comparison
--query "[?state=='OPEN']"              # Open issues/PRs
--query "[?author.login=='octocat']"    # By author

# Extract single field
--query 'tagName'                       # Get tag name from release
--query 'items[0].number'               # Get first item number

# Project specific fields
--query '[].{id:number,title:title}'    # Create custom object structure
--query '[?state==`OPEN`].[number,title]'  # Array of arrays

# Combine filters
--query '[?isDraft && isPrerelease]'    # Draft AND prerelease
--query '[?isDraft || isPrerelease]'    # Draft OR prerelease
```

**JMESPath Resources**:
- [JMESPath Tutorial](https://jmespath.org/tutorial.html)
- [JMESPath Specification](https://jmespath.org/specification.html)
- [JMESPath Examples](https://jmespath.org/examples.html)

## Command Priority

gh-please's registered commands take priority over passthrough:

```bash
# Uses gh-please implementation (enhanced with sub-issues, TOON default)
gh please issue sub-issue list 123

# Uses gh-please implementation (review reply, thread resolution)
gh please pr review reply 456 -b "Great work!"

# Uses passthrough (not a registered gh-please command)
gh please repo view
gh please workflow list
```

**Registered commands**:
- `issue` - Issue management with sub-issues and dependencies
- `pr` - Pull request management with review features
- `plugin` - Plugin management system

**All other commands**: Automatically passthrough to gh CLI

## Format Conversion Details

### How It Works

When you use `--format toon` or `--format json`:

1. gh-please adds `--json` flag to the gh command
2. gh CLI returns structured JSON data
3. gh-please converts JSON to the requested format (TOON or JSON)
4. Output is displayed in the chosen format

### Supported Commands

Format conversion works with any gh command that supports the `--json` flag. Most gh commands support it, including:

- ✅ `issue list`, `issue view`
- ✅ `pr list`, `pr view`, `pr checks`
- ✅ `repo list`, `repo view`
- ✅ `workflow list`, `workflow view`
- ✅ `release list`, `release view`
- ✅ Many more...

### Unsupported Commands

Some gh commands don't support `--json`:

```bash
# These commands don't support --json
gh please auth status --format toon  # Error: flag not supported
gh please repo clone owner/repo --format toon  # Error: flag not supported
```

**Error Message**:
```
❌ Error: This command does not support structured output.
Try running without --format flag: gh please <command>
```

## Examples

### Repository Operations

```bash
# View current repository (formatted table)
gh please repo view

# View repository in TOON format
gh please repo view --format toon

# List your repositories
gh please repo list --limit 10

# List repositories in TOON format
gh please repo list --limit 10 --format toon
```

### Workflow Operations

```bash
# List workflow runs
gh please workflow list

# List workflow runs in TOON format
gh please workflow list --format toon

# View specific workflow run
gh please workflow view 12345

# View workflow run in JSON format
gh please workflow view 12345 --format json
```

### Release Operations

```bash
# List releases
gh please release list

# List releases in TOON format
gh please release list --format toon

# Filter draft releases with JMESPath
gh please release list --query '[?isDraft]'

# Get only the latest release
gh please release list --query '[?isLatest]'

# View specific release
gh please release view v1.0.0

# View release and extract tag name
gh please release view v1.0.0 --query 'tagName'

# View release in TOON format
gh please release view v1.0.0 --format toon

# Create release (no format conversion needed)
gh please release create v1.0.0 --title "v1.0.0"
```

### Check Runs

```bash
# View PR checks
gh please pr checks 123

# View PR checks in TOON format
gh please pr checks 123 --format toon
```

## Error Handling

### Unknown Commands

If you provide an invalid command, gh CLI's error message is displayed:

```bash
gh please invalid-command
```

**Output**:
```
unknown command "invalid-command" for "gh"
```

### Format Conversion Errors

If format conversion fails, you'll see a helpful error message:

```bash
# Command doesn't support --json
gh please auth status --format toon
```

**Output**:
```
❌ Error: This command does not support structured output.
Try running without --format flag: gh please auth status
```

### JSON Parse Errors

If gh CLI returns invalid JSON:

```bash
gh please some-command --format toon
```

**Output**:
```
❌ Error: Failed to parse JSON output from gh CLI.
Please report this issue with the command you ran.
```

## Limitations

1. **--json Support Required**: Format conversion only works with commands that support `--json` flag
2. **Plugin Commands**: Commands added by plugins are not passthrough (they're registered commands)
3. **Exit Codes**: gh CLI exit codes are preserved (non-zero exits will stop execution)
4. **Interactive Commands**: Interactive commands (like `gh auth login`) work but cannot be converted to TOON/JSON

## Tips

### When to Use Passthrough

✅ **Use passthrough when**:
- You need gh CLI features not implemented in gh-please
- You want TOON format for automation/LLM integration
- You prefer a single command prefix (`gh please` for everything)

❌ **Use native gh when**:
- You need interactive features (auth, prompts)
- Performance is critical (passthrough adds ~10ms overhead)
- You prefer shorter commands (`gh` vs `gh please`)

### Combining with jq

You can pipe TOON or JSON output to other tools:

```bash
# Get open PRs and filter with jq
gh please pr list --state open --format json | jq '.[].number'

# Get issues and process with scripts
gh please issue list --format toon | awk -F'\t' '{print $1}'
```

### Automation Scripts

Passthrough is perfect for automation:

```bash
#!/bin/bash
# Get all open issues in TOON format for processing
issues=$(gh please issue list --state open --format toon)

# Parse TOON output (tab-delimited)
echo "$issues" | while IFS=$'\t' read -r number title state; do
  echo "Processing issue #$number: $title"
done
```

## See Also

- [GitHub CLI Manual](https://cli.github.com/manual/) - Complete gh CLI documentation
- [Output Formatting](https://cli.github.com/manual/gh_help_formatting) - gh CLI format options
- [TOON Format ADR](../../docs-dev/adr/0006-toon-output-format.md) - TOON format specification and benefits
- [JSON Output ADR](../../docs-dev/adr/0003-json-output-implementation.md) - JSON output implementation details
