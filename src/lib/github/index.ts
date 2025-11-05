/**
 * GitHub GraphQL API layer
 * Barrel export for all GitHub GraphQL operations
 */

// Core utilities
export {
  executeGraphQL,
  getIssueNodeId,
  getPrNodeId,
  getRepositoryNodeId,
} from './graphql-core'

// Issue hierarchy (sub-issues and dependencies)
export {
  addBlockedBy,
  addSubIssue,
  listBlockedBy,
  listSubIssues,
  removeBlockedBy,
  removeSubIssue,
} from './issue-hierarchy'

// Issue management (types and creation)
export {
  createIssueWithType,
  listIssueTypes,
  updateIssueType,
} from './issue-management'

// Metadata operations
export {
  getAssigneeNodeIds,
  getLabelNodeIds,
  getMilestoneNodeId,
  getProjectNodeIds,
} from './metadata-operations'

// Review operations
export {
  createReviewCommentReply,
  getThreadIdFromComment,
  listReviewThreads,
  resolveReviewThread,
  updateIssueCommentByNodeId,
  updateReviewCommentByNodeId,
} from './review-operations'
