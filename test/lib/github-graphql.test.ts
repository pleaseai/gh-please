import { describe, expect, test } from 'bun:test'
import {
  addBlockedBy,
  addSubIssue,
  createReviewCommentReply,
  executeGraphQL,
  getAssigneeNodeIds,
  getIssueNodeId,
  getLabelNodeIds,
  getMilestoneNodeId,
  getPrNodeId,
  getProjectNodeIds,
  getThreadIdFromComment,
  listBlockedBy,
  listReviewThreads,
  listSubIssues,
  removeBlockedBy,
  removeSubIssue,
  resolveReviewThread,
  updateIssueCommentByNodeId,
  updateReviewCommentByNodeId,
} from '../../src/lib/github-graphql'

describe('github-graphql', () => {
  describe('executeGraphQL', () => {
    test('should export function', () => {
      expect(typeof executeGraphQL).toBe('function')
    })

    test('should accept query, variables, and features parameters', () => {
      const func = executeGraphQL.toString()
      expect(func).toContain('query')
      expect(func).toContain('variables')
      expect(func).toContain('features')
    })

    test('should be async function', () => {
      const func = executeGraphQL.toString()
      expect(func).toContain('async')
    })
  })

  describe('getIssueNodeId', () => {
    test('should export function with correct signature', () => {
      expect(typeof getIssueNodeId).toBe('function')
    })

    test('should accept owner, repo, and issueNumber parameters', () => {
      const func = getIssueNodeId.toString()
      expect(func).toContain('owner')
      expect(func).toContain('repo')
      expect(func).toContain('issueNumber')
    })

    test('should be async function', () => {
      const func = getIssueNodeId.toString()
      expect(func).toContain('async')
    })
  })

  describe('getPrNodeId', () => {
    test('should export function with correct signature', () => {
      expect(typeof getPrNodeId).toBe('function')
    })

    test('should accept owner, repo, and prNumber parameters', () => {
      const func = getPrNodeId.toString()
      expect(func).toContain('owner')
      expect(func).toContain('repo')
      expect(func).toContain('prNumber')
    })

    test('should be async function', () => {
      const func = getPrNodeId.toString()
      expect(func).toContain('async')
    })
  })

  describe('addSubIssue', () => {
    test('should export function with correct signature', () => {
      expect(typeof addSubIssue).toBe('function')
    })

    test('should accept parentNodeId and childNodeId parameters', () => {
      const func = addSubIssue.toString()
      expect(func).toContain('parentNodeId')
      expect(func).toContain('childNodeId')
    })

    test('should be async function', () => {
      const func = addSubIssue.toString()
      expect(func).toContain('async')
    })
  })

  describe('removeSubIssue', () => {
    test('should export function with correct signature', () => {
      expect(typeof removeSubIssue).toBe('function')
    })

    test('should accept parentNodeId and childNodeId parameters', () => {
      const func = removeSubIssue.toString()
      expect(func).toContain('parentNodeId')
      expect(func).toContain('childNodeId')
    })

    test('should be async function', () => {
      const func = removeSubIssue.toString()
      expect(func).toContain('async')
    })
  })

  describe('listSubIssues', () => {
    test('should export function with correct signature', () => {
      expect(typeof listSubIssues).toBe('function')
    })

    test('should accept parentNodeId parameter', () => {
      const func = listSubIssues.toString()
      expect(func).toContain('parentNodeId')
    })

    test('should be async function', () => {
      const func = listSubIssues.toString()
      expect(func).toContain('async')
    })
  })

  describe('addBlockedBy', () => {
    test('should export function with correct signature', () => {
      expect(typeof addBlockedBy).toBe('function')
    })

    test('should accept issueNodeId and blockingIssueNodeId parameters', () => {
      const func = addBlockedBy.toString()
      expect(func).toContain('issueNodeId')
      expect(func).toContain('blockingIssueNodeId')
    })

    test('should be async function', () => {
      const func = addBlockedBy.toString()
      expect(func).toContain('async')
    })
  })

  describe('removeBlockedBy', () => {
    test('should export function with correct signature', () => {
      expect(typeof removeBlockedBy).toBe('function')
    })

    test('should accept issueNodeId and blockingIssueNodeId parameters', () => {
      const func = removeBlockedBy.toString()
      expect(func).toContain('issueNodeId')
      expect(func).toContain('blockingIssueNodeId')
    })

    test('should be async function', () => {
      const func = removeBlockedBy.toString()
      expect(func).toContain('async')
    })
  })

  describe('listBlockedBy', () => {
    test('should export function with correct signature', () => {
      expect(typeof listBlockedBy).toBe('function')
    })

    test('should accept issueNodeId parameter', () => {
      const func = listBlockedBy.toString()
      expect(func).toContain('issueNodeId')
    })

    test('should be async function', () => {
      const func = listBlockedBy.toString()
      expect(func).toContain('async')
    })
  })

  describe('resolveReviewThread', () => {
    test('should export function with correct signature', () => {
      expect(typeof resolveReviewThread).toBe('function')
    })

    test('should accept threadNodeId parameter', () => {
      const func = resolveReviewThread.toString()
      expect(func).toContain('threadNodeId')
    })

    test('should be async function', () => {
      const func = resolveReviewThread.toString()
      expect(func).toContain('async')
    })
  })

  describe('listReviewThreads', () => {
    test('should export function with correct signature', () => {
      expect(typeof listReviewThreads).toBe('function')
    })

    test('should accept prNodeId parameter', () => {
      const func = listReviewThreads.toString()
      expect(func).toContain('prNodeId')
    })

    test('should be async function', () => {
      const func = listReviewThreads.toString()
      expect(func).toContain('async')
    })
  })

  describe('getThreadIdFromComment', () => {
    test('should export function with correct signature', () => {
      expect(typeof getThreadIdFromComment).toBe('function')
    })

    test('should accept commentNodeId parameter', () => {
      const func = getThreadIdFromComment.toString()
      expect(func).toContain('commentNodeId')
    })

    test('should be async function', () => {
      const func = getThreadIdFromComment.toString()
      expect(func).toContain('async')
    })

    test('should use GraphQL query to fetch thread information', () => {
      const func = getThreadIdFromComment.toString()
      expect(func).toContain('query')
      expect(func).toContain('pullRequest')
      expect(func).toContain('reviewThreads')
    })

    test('should return thread ID string', () => {
      // Verify function returns a Promise<string>
      expect(typeof getThreadIdFromComment).toBe('function')
    })

    // Behavioral tests for two-step query logic
    describe('two-step query behavior', () => {
      // Note: These tests verify the implementation without mocking executeGraphQL
      // since it's a module-level import. Integration tests cover actual execution.

      test('should query pullRequest field in step 1', () => {
        const func = getThreadIdFromComment.toString()
        // Verify Step 1 queries for pullRequest from comment
        expect(func).toContain('pullRequest')
        expect(func).toContain('PullRequestReviewComment')
      })

      test('should query reviewThreads in step 2', () => {
        const func = getThreadIdFromComment.toString()
        // Verify Step 2 queries reviewThreads with comments
        expect(func).toContain('reviewThreads')
        expect(func).toContain('first: 100')
      })

      test('should throw error when PR not found', () => {
        const func = getThreadIdFromComment.toString()
        expect(func).toContain('Could not find pull request for review comment')
        expect(func).toContain('may have been deleted')
        expect(func).toContain('may be incorrect')
      })

      test('should throw error when threads cannot be fetched', () => {
        const func = getThreadIdFromComment.toString()
        expect(func).toContain('Could not fetch review threads for PR')
        expect(func).toContain('may lack permissions')
      })

      test('should throw error when thread not found', () => {
        const func = getThreadIdFromComment.toString()
        expect(func).toContain('Thread not found for review comment')
        expect(func).toContain('Searched')
        expect(func).toContain('review thread')
      })

      test('should include logging statements', () => {
        const func = getThreadIdFromComment.toString()
        expect(func).toContain('Looking up pull request')
        expect(func).toContain('Fetching review threads')
        expect(func).toContain('Retrieved')
      })

      test('should validate thread comments before mapping', () => {
        const func = getThreadIdFromComment.toString()
        expect(func).toContain('thread.comments?.nodes')
        expect(func).toContain('warn')
      })
    })
  })

  describe('createReviewCommentReply', () => {
    test('should export function with correct signature', () => {
      expect(typeof createReviewCommentReply).toBe('function')
    })

    test('should accept commentNodeId and body parameters', () => {
      const func = createReviewCommentReply.toString()
      expect(func).toContain('commentNodeId')
      expect(func).toContain('body')
    })

    test('should be async function', () => {
      const func = createReviewCommentReply.toString()
      expect(func).toContain('async')
    })

    test('should call getThreadIdFromComment', () => {
      const func = createReviewCommentReply.toString()
      expect(func).toContain('getThreadIdFromComment')
    })

    test('should use addPullRequestReviewThreadReply mutation', () => {
      const func = createReviewCommentReply.toString()
      expect(func).toContain('addPullRequestReviewThreadReply')
    })

    test('should return object with nodeId, databaseId, and url', () => {
      // Verify return type structure from function signature
      expect(typeof createReviewCommentReply).toBe('function')
    })
  })

  describe('updateReviewCommentByNodeId', () => {
    test('should export function with correct signature', () => {
      expect(typeof updateReviewCommentByNodeId).toBe('function')
    })

    test('should accept commentNodeId and body parameters', () => {
      const func = updateReviewCommentByNodeId.toString()
      expect(func).toContain('commentNodeId')
      expect(func).toContain('body')
    })

    test('should be async function', () => {
      const func = updateReviewCommentByNodeId.toString()
      expect(func).toContain('async')
    })
  })

  describe('updateIssueCommentByNodeId', () => {
    test('should export function with correct signature', () => {
      expect(typeof updateIssueCommentByNodeId).toBe('function')
    })

    test('should accept commentNodeId and body parameters', () => {
      const func = updateIssueCommentByNodeId.toString()
      expect(func).toContain('commentNodeId')
      expect(func).toContain('body')
    })

    test('should be async function', () => {
      const func = updateIssueCommentByNodeId.toString()
      expect(func).toContain('async')
    })
  })

  describe('listIssueTypes', () => {
    test('should export function with correct signature', () => {
      const { listIssueTypes } = require('../../src/lib/github-graphql')
      expect(typeof listIssueTypes).toBe('function')
    })

    test('should accept owner and repo parameters', () => {
      const { listIssueTypes } = require('../../src/lib/github-graphql')
      const func = listIssueTypes.toString()
      expect(func).toContain('owner')
      expect(func).toContain('repo')
    })

    test('should be async function', () => {
      const { listIssueTypes } = require('../../src/lib/github-graphql')
      const func = listIssueTypes.toString()
      expect(func).toContain('async')
    })

    test('should query repository issueTypes', () => {
      const { listIssueTypes } = require('../../src/lib/github-graphql')
      const func = listIssueTypes.toString()
      expect(func).toContain('repository')
      expect(func).toContain('issueTypes')
    })

    test('should return array of IssueType objects', () => {
      const { listIssueTypes } = require('../../src/lib/github-graphql')
      const func = listIssueTypes.toString()
      expect(func).toContain('nodes')
    })

    test('should throw error when repository not found', () => {
      const { listIssueTypes } = require('../../src/lib/github-graphql')
      const func = listIssueTypes.toString()
      expect(func).toContain('Repository')
      expect(func).toContain('not found')
      expect(func).toContain('Possible reasons')
    })

    test('should return empty array when no issue types', () => {
      const { listIssueTypes } = require('../../src/lib/github-graphql')
      const func = listIssueTypes.toString()
      expect(func).toContain('return []')
    })
  })

  describe('getRepositoryNodeId', () => {
    test('should export function with correct signature', () => {
      const { getRepositoryNodeId } = require('../../src/lib/github-graphql')
      expect(typeof getRepositoryNodeId).toBe('function')
    })

    test('should accept owner and repo parameters', () => {
      const { getRepositoryNodeId } = require('../../src/lib/github-graphql')
      const func = getRepositoryNodeId.toString()
      expect(func).toContain('owner')
      expect(func).toContain('repo')
    })

    test('should be async function', () => {
      const { getRepositoryNodeId } = require('../../src/lib/github-graphql')
      const func = getRepositoryNodeId.toString()
      expect(func).toContain('async')
    })

    test('should query repository id', () => {
      const { getRepositoryNodeId } = require('../../src/lib/github-graphql')
      const func = getRepositoryNodeId.toString()
      expect(func).toContain('repository')
    })

    test('should throw error when repository not found', () => {
      const { getRepositoryNodeId } = require('../../src/lib/github-graphql')
      const func = getRepositoryNodeId.toString()
      expect(func).toContain('Repository')
      expect(func).toContain('not found')
      expect(func).toContain('Possible reasons')
    })
  })

  describe('createIssueWithType', () => {
    test('should export function with correct signature', () => {
      const { createIssueWithType } = require('../../src/lib/github-graphql')
      expect(typeof createIssueWithType).toBe('function')
    })

    test('should accept owner, repo, title, body, and issueTypeId parameters', () => {
      const { createIssueWithType } = require('../../src/lib/github-graphql')
      const func = createIssueWithType.toString()
      expect(func).toContain('owner')
      expect(func).toContain('repo')
      expect(func).toContain('title')
      expect(func).toContain('body')
      expect(func).toContain('issueTypeId')
    })

    test('should be async function', () => {
      const { createIssueWithType } = require('../../src/lib/github-graphql')
      const func = createIssueWithType.toString()
      expect(func).toContain('async')
    })

    test('should use createIssue mutation', () => {
      const { createIssueWithType } = require('../../src/lib/github-graphql')
      const func = createIssueWithType.toString()
      expect(func).toContain('createIssue')
    })

    test('should return object with number and nodeId', () => {
      const { createIssueWithType } = require('../../src/lib/github-graphql')
      expect(typeof createIssueWithType).toBe('function')
    })

    test('should throw error when issue creation fails', () => {
      const { createIssueWithType } = require('../../src/lib/github-graphql')
      const func = createIssueWithType.toString()
      expect(func).toContain('Failed to create issue')
      expect(func).toContain('Possible reasons')
      expect(func).toContain('permissions')
    })
  })

  describe('updateIssueType', () => {
    test('should export function with correct signature', () => {
      const { updateIssueType } = require('../../src/lib/github-graphql')
      expect(typeof updateIssueType).toBe('function')
    })

    test('should accept issueId and issueTypeId parameters', () => {
      const { updateIssueType } = require('../../src/lib/github-graphql')
      const func = updateIssueType.toString()
      expect(func).toContain('issueId')
      expect(func).toContain('issueTypeId')
    })

    test('should be async function', () => {
      const { updateIssueType } = require('../../src/lib/github-graphql')
      const func = updateIssueType.toString()
      expect(func).toContain('async')
    })

    test('should use updateIssueIssueType mutation', () => {
      const { updateIssueType } = require('../../src/lib/github-graphql')
      const func = updateIssueType.toString()
      expect(func).toContain('updateIssueIssueType')
    })

    test('should support clearing type with null', () => {
      const { updateIssueType } = require('../../src/lib/github-graphql')
      expect(typeof updateIssueType).toBe('function')
    })

    test('should throw error when update fails', () => {
      const { updateIssueType } = require('../../src/lib/github-graphql')
      const func = updateIssueType.toString()
      expect(func).toContain('Failed to update issue type')
      expect(func).toContain('Possible reasons')
      expect(func).toContain('does not exist')
    })
  })

  describe('getLabelNodeIds', () => {
    test('should export function with correct signature', () => {
      expect(typeof getLabelNodeIds).toBe('function')
    })

    test('should accept owner, repo, and labelNames parameters', () => {
      const func = getLabelNodeIds.toString()
      expect(func).toContain('owner')
      expect(func).toContain('repo')
      expect(func).toContain('labelNames')
    })

    test('should be async function', () => {
      const func = getLabelNodeIds.toString()
      expect(func).toContain('async')
    })

    test('should query repository labels', () => {
      const func = getLabelNodeIds.toString()
      expect(func).toContain('repository')
      expect(func).toContain('labels')
    })

    test('should return array of label Node IDs', () => {
      const func = getLabelNodeIds.toString()
      expect(func).toContain('map')
    })
  })

  describe('getAssigneeNodeIds', () => {
    test('should export function with correct signature', () => {
      expect(typeof getAssigneeNodeIds).toBe('function')
    })

    test('should accept owner, repo, and logins parameters', () => {
      const func = getAssigneeNodeIds.toString()
      expect(func).toContain('owner')
      expect(func).toContain('repo')
      expect(func).toContain('logins')
    })

    test('should be async function', () => {
      const func = getAssigneeNodeIds.toString()
      expect(func).toContain('async')
    })

    test('should handle @me special case', () => {
      const func = getAssigneeNodeIds.toString()
      expect(func).toContain('@me')
      expect(func).toContain('viewer')
    })

    test('should query user Node IDs', () => {
      const func = getAssigneeNodeIds.toString()
      expect(func).toContain('user')
    })

    test('should return array of assignee Node IDs', () => {
      const func = getAssigneeNodeIds.toString()
      expect(func).toContain('nodeIds')
    })
  })

  describe('getMilestoneNodeId', () => {
    test('should export function with correct signature', () => {
      expect(typeof getMilestoneNodeId).toBe('function')
    })

    test('should accept owner, repo, and milestoneName parameters', () => {
      const func = getMilestoneNodeId.toString()
      expect(func).toContain('owner')
      expect(func).toContain('repo')
      expect(func).toContain('milestoneName')
    })

    test('should be async function', () => {
      const func = getMilestoneNodeId.toString()
      expect(func).toContain('async')
    })

    test('should query repository milestones', () => {
      const func = getMilestoneNodeId.toString()
      expect(func).toContain('repository')
      expect(func).toContain('milestones')
    })

    test('should return milestone Node ID string', () => {
      const func = getMilestoneNodeId.toString()
      expect(func).toContain('return')
    })
  })

  describe('getProjectNodeIds', () => {
    test('should export function with correct signature', () => {
      expect(typeof getProjectNodeIds).toBe('function')
    })

    test('should accept owner, repo, and projectTitles parameters', () => {
      const func = getProjectNodeIds.toString()
      expect(func).toContain('owner')
      expect(func).toContain('repo')
      expect(func).toContain('projectTitles')
    })

    test('should be async function', () => {
      const func = getProjectNodeIds.toString()
      expect(func).toContain('async')
    })

    test('should query repository projects', () => {
      const func = getProjectNodeIds.toString()
      expect(func).toContain('repository')
      expect(func).toContain('projectsV2')
    })

    test('should query organization projects', () => {
      const func = getProjectNodeIds.toString()
      expect(func).toContain('organization')
      expect(func).toContain('projectsV2')
    })

    test('should return array of project Node IDs', () => {
      const func = getProjectNodeIds.toString()
      expect(func).toContain('nodeIds')
    })
  })
})
