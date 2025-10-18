import type { Language, SeverityLevel } from '../config/schema'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import * as clack from '@clack/prompts'
import { Command } from 'commander'
import { DEFAULT_CONFIG } from '../config/schema'
import { detectSystemLanguage, getMessages } from '../lib/i18n'

interface InitConfig {
  language: Language
  commentSeverityThreshold: SeverityLevel
  maxReviewComments: number
  autoReview: boolean
  includeDrafts: boolean
  enableIssueWorkflow: boolean
  autoTriage: boolean
  enableCodeWorkspace: boolean
}

/**
 * Generate YAML content from configuration
 */
function generateConfigYaml(config: InitConfig): string {
  return `# GitHub Please Configuration
# This file configures the behavior of gh-please commands

# Code review configuration
code_review:
  # Set to true to disable all code review features
  disable: false

  # Minimum severity level for review comments (LOW, MEDIUM, HIGH)
  comment_severity_threshold: ${config.commentSeverityThreshold}

  # Maximum number of review comments (-1 for unlimited)
  max_review_comments: ${config.maxReviewComments}

  # Pull request opened event behavior
  pull_request_opened:
    # Show help message when PR is opened
    help: false

    # Generate PR summary
    summary: true

    # Automatically perform code review
    code_review: ${config.autoReview}

    # Include draft PRs in automatic reviews
    include_drafts: ${config.includeDrafts}

# Issue workflow configuration (triage → investigate → fix)
issue_workflow:
  # Set to true to disable all issue workflow features
  disable: ${!config.enableIssueWorkflow}

  # Triage configuration
  triage:
    # Automatically triage new issues
    auto: ${config.autoTriage}

    # Allow manual triage via commands
    manual: true

    # Update issue type labels during triage
    update_issue_type: true

  # Investigation configuration
  investigate:
    # Enable investigation workflow
    enabled: true

    # Restrict investigation to organization members only
    org_members_only: true

    # Automatically investigate when 'bug' label is added
    auto_on_bug_label: false

  # Fix configuration
  fix:
    # Enable fix workflow
    enabled: true

    # Restrict fixes to organization members only
    org_members_only: true

    # Require investigation before allowing fix
    require_investigation: false

    # Automatically create PR after implementing fix
    auto_create_pr: true

    # Automatically run tests after implementing fix
    auto_run_tests: true

# Code workspace configuration
code_workspace:
  # Enable code workspace features
  enabled: ${config.enableCodeWorkspace}

# File patterns to ignore (glob patterns)
ignore_patterns: []

# Language for bot responses (ko, en)
language: ${config.language}
`
}

export function createInitCommand(): Command {
  const command = new Command('init')

  command
    .description('Initialize .please/config.yml with interactive configuration')
    .option('-f, --force', 'Overwrite existing config file')
    .option('-y, --yes', 'Skip prompts and use default configuration')
    .action(async (options: { force?: boolean, yes?: boolean }) => {
      try {
        const configDir = '.please'
        const configPath = join(configDir, 'config.yml')

        // Check if config already exists
        if (existsSync(configPath) && !options.force) {
          const systemLang = detectSystemLanguage()
          const msg = getMessages(systemLang)
          console.error(msg.errorExists)
          console.error(msg.useForce)
          process.exit(1)
        }

        let config: InitConfig

        if (options.yes) {
          // Use default configuration
          config = {
            language: detectSystemLanguage(),
            commentSeverityThreshold: DEFAULT_CONFIG.code_review.comment_severity_threshold,
            maxReviewComments: DEFAULT_CONFIG.code_review.max_review_comments,
            autoReview: DEFAULT_CONFIG.code_review.pull_request_opened.code_review,
            includeDrafts: DEFAULT_CONFIG.code_review.pull_request_opened.include_drafts,
            enableIssueWorkflow: !DEFAULT_CONFIG.issue_workflow.disable,
            autoTriage: DEFAULT_CONFIG.issue_workflow.triage.auto,
            enableCodeWorkspace: DEFAULT_CONFIG.code_workspace.enabled,
          }

          // Create .please directory if it doesn't exist
          if (!existsSync(configDir)) {
            mkdirSync(configDir, { recursive: true })
          }

          // Generate and write config file
          const configContent = generateConfigYaml(config)
          writeFileSync(configPath, configContent, 'utf-8')

          const msg = getMessages(config.language)
          console.log(msg.created)
        }
        else {
          // Interactive configuration
          const systemLang = detectSystemLanguage()

          clack.intro(getMessages(systemLang).intro)

          const language = await clack.select({
            message: getMessages(systemLang).selectLanguage,
            options: [
              { value: 'ko' as Language, label: getMessages(systemLang).languageKo },
              { value: 'en' as Language, label: getMessages(systemLang).languageEn },
            ],
            initialValue: systemLang,
          }) as Language

          if (clack.isCancel(language)) {
            clack.cancel(getMessages(systemLang).cancelled)
            process.exit(0)
          }

          const msg = getMessages(language)

          const severity = await clack.select({
            message: msg.configureSeverity,
            options: [
              { value: 'LOW' as SeverityLevel, label: msg.severityLow },
              { value: 'MEDIUM' as SeverityLevel, label: msg.severityMedium },
              { value: 'HIGH' as SeverityLevel, label: msg.severityHigh },
            ],
            initialValue: 'MEDIUM' as SeverityLevel,
          }) as SeverityLevel

          if (clack.isCancel(severity)) {
            clack.cancel(msg.cancelled)
            process.exit(0)
          }

          const maxComments = await clack.text({
            message: msg.configureMaxComments,
            placeholder: msg.maxCommentsPlaceholder,
            initialValue: '-1',
            validate: (value) => {
              const num = Number.parseInt(value)
              if (Number.isNaN(num))
                return 'Please enter a valid number'
              if (num < -1)
                return 'Value must be -1 or greater'
            },
          })

          if (clack.isCancel(maxComments)) {
            clack.cancel(msg.cancelled)
            process.exit(0)
          }

          const autoReview = await clack.confirm({
            message: msg.enableAutoReview,
            initialValue: true,
          })

          if (clack.isCancel(autoReview)) {
            clack.cancel(msg.cancelled)
            process.exit(0)
          }

          const includeDrafts = await clack.confirm({
            message: msg.enableDraftReview,
            initialValue: true,
          })

          if (clack.isCancel(includeDrafts)) {
            clack.cancel(msg.cancelled)
            process.exit(0)
          }

          const enableIssueWorkflow = await clack.confirm({
            message: msg.enableIssueWorkflow,
            initialValue: true,
          })

          if (clack.isCancel(enableIssueWorkflow)) {
            clack.cancel(msg.cancelled)
            process.exit(0)
          }

          const autoTriage = await clack.confirm({
            message: msg.enableAutoTriage,
            initialValue: true,
          })

          if (clack.isCancel(autoTriage)) {
            clack.cancel(msg.cancelled)
            process.exit(0)
          }

          const enableCodeWorkspace = await clack.confirm({
            message: msg.enableCodeWorkspace,
            initialValue: true,
          })

          if (clack.isCancel(enableCodeWorkspace)) {
            clack.cancel(msg.cancelled)
            process.exit(0)
          }

          config = {
            language,
            commentSeverityThreshold: severity,
            maxReviewComments: Number.parseInt(maxComments),
            autoReview,
            includeDrafts,
            enableIssueWorkflow,
            autoTriage,
            enableCodeWorkspace,
          }

          const spinner = clack.spinner()
          spinner.start(msg.creating)

          // Create .please directory if it doesn't exist
          if (!existsSync(configDir)) {
            mkdirSync(configDir, { recursive: true })
          }

          // Generate and write config file
          const configContent = generateConfigYaml(config)
          writeFileSync(configPath, configContent, 'utf-8')

          spinner.stop(msg.created)
          clack.outro(msg.setupComplete)
        }
      }
      catch (error) {
        if (error instanceof Error) {
          console.error(`❌ Error: ${error.message}`)
        }
        else {
          console.error('❌ An unexpected error occurred')
        }
        process.exit(1)
      }
    })

  return command
}
