#!/usr/bin/env bash

# SessionStart hook for gh-please project
# Provides additional context about GitHub-related skills

cat <<'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "GitHub 관련 작업은 using-github-please-extension skill을 사용하세요. This skill (v0.18.0+) provides GitHub workflow automation with gh-please CLI extension - access all 100+ gh CLI commands with TOON/JSON format conversion, manage issues with types/sub-issues/dependencies, PR review workflows, worktree-based development, and LLM-friendly output formats (TOON: 58.9% token reduction)."
  }
}
EOF
