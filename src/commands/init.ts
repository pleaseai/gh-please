import { Command } from "commander";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { DEFAULT_CONFIG } from "../config/schema";

/**
 * Generate YAML content from the default configuration
 */
function generateConfigYaml(): string {
  return `# GitHub Please Configuration
# This file configures the behavior of gh-please commands

# Code review configuration
code_review:
  # Set to true to disable all code review features
  disable: ${DEFAULT_CONFIG.code_review.disable}

  # Minimum severity level for review comments (LOW, MEDIUM, HIGH)
  comment_severity_threshold: ${DEFAULT_CONFIG.code_review.comment_severity_threshold}

  # Maximum number of review comments (-1 for unlimited)
  max_review_comments: ${DEFAULT_CONFIG.code_review.max_review_comments}

  # Pull request opened event behavior
  pull_request_opened:
    # Show help message when PR is opened
    help: ${DEFAULT_CONFIG.code_review.pull_request_opened.help}

    # Generate PR summary
    summary: ${DEFAULT_CONFIG.code_review.pull_request_opened.summary}

    # Automatically perform code review
    code_review: ${DEFAULT_CONFIG.code_review.pull_request_opened.code_review}

    # Include draft PRs in automatic reviews
    include_drafts: ${DEFAULT_CONFIG.code_review.pull_request_opened.include_drafts}

# Issue workflow configuration (triage → investigate → fix)
issue_workflow:
  # Set to true to disable all issue workflow features
  disable: ${DEFAULT_CONFIG.issue_workflow.disable}

  # Triage configuration
  triage:
    # Automatically triage new issues
    auto: ${DEFAULT_CONFIG.issue_workflow.triage.auto}

    # Allow manual triage via commands
    manual: ${DEFAULT_CONFIG.issue_workflow.triage.manual}

    # Update issue type labels during triage
    update_issue_type: ${DEFAULT_CONFIG.issue_workflow.triage.update_issue_type}

  # Investigation configuration
  investigate:
    # Enable investigation workflow
    enabled: ${DEFAULT_CONFIG.issue_workflow.investigate.enabled}

    # Restrict investigation to organization members only
    org_members_only: ${DEFAULT_CONFIG.issue_workflow.investigate.org_members_only}

    # Automatically investigate when 'bug' label is added
    auto_on_bug_label: ${DEFAULT_CONFIG.issue_workflow.investigate.auto_on_bug_label}

  # Fix configuration
  fix:
    # Enable fix workflow
    enabled: ${DEFAULT_CONFIG.issue_workflow.fix.enabled}

    # Restrict fixes to organization members only
    org_members_only: ${DEFAULT_CONFIG.issue_workflow.fix.org_members_only}

    # Require investigation before allowing fix
    require_investigation: ${DEFAULT_CONFIG.issue_workflow.fix.require_investigation}

    # Automatically create PR after implementing fix
    auto_create_pr: ${DEFAULT_CONFIG.issue_workflow.fix.auto_create_pr}

    # Automatically run tests after implementing fix
    auto_run_tests: ${DEFAULT_CONFIG.issue_workflow.fix.auto_run_tests}

# Code workspace configuration
code_workspace:
  # Enable code workspace features
  enabled: ${DEFAULT_CONFIG.code_workspace.enabled}

# File patterns to ignore (glob patterns)
ignore_patterns: []

# Language for bot responses (ko, en)
language: ${DEFAULT_CONFIG.language}
`;
}

export function createInitCommand(): Command {
  const command = new Command("init");

  command
    .description("Initialize .please/config.yml with default configuration")
    .option("-f, --force", "Overwrite existing config file")
    .action(async (options: { force?: boolean }) => {
      try {
        const configDir = ".please";
        const configPath = join(configDir, "config.yml");

        // Check if config already exists
        if (existsSync(configPath) && !options.force) {
          console.error(`❌ Error: ${configPath} already exists`);
          console.error("   Use --force to overwrite the existing file");
          process.exit(1);
        }

        // Create .please directory if it doesn't exist
        if (!existsSync(configDir)) {
          console.log(`📁 Creating ${configDir} directory...`);
          mkdirSync(configDir, { recursive: true });
        }

        // Generate and write config file
        console.log(`📝 Generating ${configPath}...`);
        const configContent = generateConfigYaml();
        writeFileSync(configPath, configContent, "utf-8");

        console.log(`✅ Configuration file created successfully!`);
        console.log(`   File: ${configPath}`);
        console.log(`   Edit this file to customize gh-please behavior`);
      } catch (error) {
        if (error instanceof Error) {
          console.error(`❌ Error: ${error.message}`);
        } else {
          console.error("❌ An unexpected error occurred");
        }
        process.exit(1);
      }
    });

  return command;
}
