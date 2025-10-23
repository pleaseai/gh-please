/**
 * Library utilities export barrel
 * Exports commonly used utilities for plugin consumption
 */

// GitHub API utilities
export {
  createIssueComment,
  createPrComment,
  getRepoInfo,
  parseRepoString,
} from './github-api'

// Internationalization utilities
export {
  detectSystemLanguage,
  getCommentMessages,
  getIssueMessages,
  getPrMessages,
} from './i18n'

// Re-export i18n types
export type {
  CommentMessages,
  IssueMessages,
  PrMessages,
} from './i18n'
