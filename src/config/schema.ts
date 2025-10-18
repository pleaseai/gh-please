import { z } from 'zod'

/**
 * Severity levels for review comments
 */
export const SeverityLevel = z.enum(['LOW', 'MEDIUM', 'HIGH'])
export type SeverityLevel = z.infer<typeof SeverityLevel>

/**
 * Language options for bot responses
 */
export const Language = z.enum(['ko', 'en'])
export type Language = z.infer<typeof Language>

/**
 * Pull request opened event configuration
 */
export const PullRequestOpenedConfigSchema = z.object({
  help: z.boolean().default(false),
  summary: z.boolean().default(true),
  code_review: z.boolean().default(true),
  include_drafts: z.boolean().default(true),
})
export type PullRequestOpenedConfig = z.infer<typeof PullRequestOpenedConfigSchema>

/**
 * Code review configuration
 */
export const CodeReviewConfigSchema = z.object({
  disable: z.boolean().default(false),
  comment_severity_threshold: SeverityLevel.default('MEDIUM'),
  max_review_comments: z.number().default(-1),
  pull_request_opened: PullRequestOpenedConfigSchema.optional().default({
    help: false,
    summary: true,
    code_review: true,
    include_drafts: true,
  }),
})
export type CodeReviewConfig = z.infer<typeof CodeReviewConfigSchema>

/**
 * Issue workflow configuration (triage → investigate → fix)
 */
export const IssueWorkflowConfigSchema = z.object({
  disable: z.boolean().default(false),

  triage: z.object({
    auto: z.boolean().default(true),
    manual: z.boolean().default(true),
    update_issue_type: z.boolean().default(true),
  }).default({ auto: true, manual: true, update_issue_type: true }),

  investigate: z.object({
    enabled: z.boolean().default(true),
    org_members_only: z.boolean().default(true),
    auto_on_bug_label: z.boolean().default(false),
  }).default({
    enabled: true,
    org_members_only: true,
    auto_on_bug_label: false,
  }),

  fix: z.object({
    enabled: z.boolean().default(true),
    org_members_only: z.boolean().default(true),
    require_investigation: z.boolean().default(false),
    auto_create_pr: z.boolean().default(true),
    auto_run_tests: z.boolean().default(true),
  }).default({
    enabled: true,
    org_members_only: true,
    require_investigation: false,
    auto_create_pr: true,
    auto_run_tests: true,
  }),
})
export type IssueWorkflowConfig = z.infer<typeof IssueWorkflowConfigSchema>

/**
 * Code workspace configuration
 */
export const CodeWorkspaceConfigSchema = z.object({
  enabled: z.boolean().default(true),
})
export type CodeWorkspaceConfig = z.infer<typeof CodeWorkspaceConfigSchema>

/**
 * Main configuration schema
 */
export const ConfigSchema = z.object({
  code_review: CodeReviewConfigSchema.optional().default({
    disable: false,
    comment_severity_threshold: 'MEDIUM',
    max_review_comments: -1,
    pull_request_opened: {
      help: false,
      summary: true,
      code_review: true,
      include_drafts: true,
    },
  }),
  issue_workflow: IssueWorkflowConfigSchema.optional().default({
    disable: false,
    triage: { auto: true, manual: true, update_issue_type: true },
    investigate: { enabled: true, org_members_only: true, auto_on_bug_label: false },
    fix: {
      enabled: true,
      org_members_only: true,
      require_investigation: false,
      auto_create_pr: true,
      auto_run_tests: true,
    },
  }),
  code_workspace: CodeWorkspaceConfigSchema.optional().default({
    enabled: true,
  }),
  ignore_patterns: z.array(z.string()).default([]),
  language: Language.default('ko'),
})
export type Config = z.infer<typeof ConfigSchema>

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Config = {
  code_review: {
    disable: false,
    comment_severity_threshold: 'MEDIUM',
    max_review_comments: -1,
    pull_request_opened: {
      help: false,
      summary: true,
      code_review: true,
      include_drafts: true,
    },
  },
  issue_workflow: {
    disable: false,
    triage: { auto: true, manual: true, update_issue_type: true },
    investigate: { enabled: true, org_members_only: true, auto_on_bug_label: false },
    fix: {
      enabled: true,
      org_members_only: true,
      require_investigation: false,
      auto_create_pr: true,
      auto_run_tests: true,
    },
  },
  code_workspace: {
    enabled: true,
  },
  ignore_patterns: [],
  language: 'ko',
}
