/**
 * GitHub API Response Fixtures
 * Mock responses for GitHub REST and GraphQL APIs used in integration tests
 */

/**
 * Mock repository information
 */
export const mockRepoInfo = {
  owner: 'test-owner',
  repo: 'test-repo',
  full_name: 'test-owner/test-repo',
}

/**
 * Mock issue data
 */
export const mockIssue = {
  number: 123,
  title: 'Test Issue',
  body: 'This is a test issue',
  state: 'OPEN',
  nodeId: 'I_kwDOABCDEF123456',
}

export const mockParentIssue = {
  number: 100,
  title: 'Parent Issue',
  body: 'Parent issue for testing sub-issues',
  state: 'OPEN',
  nodeId: 'I_kwDOABCDEF100000',
}

export const mockChildIssue = {
  number: 101,
  title: 'Child Issue',
  body: 'Child issue to be linked',
  state: 'OPEN',
  nodeId: 'I_kwDOABCDEF101000',
}

export const mockBlockingIssue = {
  number: 200,
  title: 'Blocking Issue',
  body: 'This blocks other issues',
  state: 'OPEN',
  nodeId: 'I_kwDOABCDEF200000',
}

export const mockBlockedIssue = {
  number: 201,
  title: 'Blocked Issue',
  body: 'This is blocked by another issue',
  state: 'OPEN',
  nodeId: 'I_kwDOABCDEF201000',
}

/**
 * Mock PR data
 */
export const mockPr = {
  number: 456,
  title: 'Test PR',
  body: 'This is a test PR',
  state: 'OPEN',
  nodeId: 'PR_kwDOABCDEF456789',
}

/**
 * Mock review comment data
 */
export const mockReviewComment = {
  id: 987654321,
  nodeId: 'PRRC_kwDOTestNodeId',
  body: 'This is a review comment',
  path: 'src/index.ts',
  line: 42,
  pull_request_url: `https://api.github.com/repos/${mockRepoInfo.owner}/${mockRepoInfo.repo}/pulls/${mockPr.number}`,
  user: {
    login: 'reviewer',
  },
}

/**
 * Mock review thread data
 */
export const mockReviewThread = {
  id: 'PRRT_kwDOABCDEF12345',
  isResolved: false,
  path: 'src/index.ts',
  line: 42,
  comments: {
    nodes: [
      {
        id: mockReviewComment.nodeId,
        body: mockReviewComment.body,
      },
    ],
  },
}

/**
 * Mock issue type data
 */
export const mockIssueTypes = [
  {
    id: 'IT_kwDOABCDEF001',
    name: 'Bug',
    description: 'Something isn\'t working',
    color: 'RED',
    isEnabled: true,
  },
  {
    id: 'IT_kwDOABCDEF002',
    name: 'Feature',
    description: 'New feature or request',
    color: 'GREEN',
    isEnabled: true,
  },
  {
    id: 'IT_kwDOABCDEF003',
    name: 'Epic',
    description: 'Large body of work',
    color: 'PURPLE',
    isEnabled: true,
  },
]

/**
 * GraphQL Response: Get Issue Node ID
 */
export function createGetIssueNodeIdResponse(issueNumber: number, nodeId: string) {
  return {
    data: {
      repository: {
        issue: {
          id: nodeId,
          number: issueNumber,
        },
      },
    },
  }
}

/**
 * GraphQL Response: Get PR Node ID
 */
export function createGetPrNodeIdResponse(prNumber: number, nodeId: string) {
  return {
    data: {
      repository: {
        pullRequest: {
          id: nodeId,
          number: prNumber,
        },
      },
    },
  }
}

/**
 * GraphQL Response: Create Sub-issue
 */
export function createSubIssueResponse(parentNodeId: string, title: string, newIssueNumber: number, newNodeId: string) {
  return {
    data: {
      createSubIssue: {
        subIssue: {
          id: newNodeId,
          number: newIssueNumber,
          title,
        },
        parentIssue: {
          id: parentNodeId,
        },
      },
    },
  }
}

/**
 * GraphQL Response: Add Sub-issue
 */
export function createAddSubIssueResponse(parentNodeId: string, childNodeId: string) {
  return {
    data: {
      addSubIssue: {
        parentIssue: {
          id: parentNodeId,
        },
        subIssue: {
          id: childNodeId,
        },
      },
    },
  }
}

/**
 * GraphQL Response: Remove Sub-issue
 */
export function createRemoveSubIssueResponse(parentNodeId: string, childNodeId: string) {
  return {
    data: {
      removeSubIssue: {
        parentIssue: {
          id: parentNodeId,
        },
        subIssue: {
          id: childNodeId,
        },
      },
    },
  }
}

/**
 * GraphQL Response: List Sub-issues
 */
export function createListSubIssuesResponse(subIssues: Array<{ number: number, title: string, state: string, nodeId: string }>) {
  return {
    data: {
      node: {
        subIssues: {
          nodes: subIssues.map(issue => ({
            id: issue.nodeId,
            number: issue.number,
            title: issue.title,
            state: issue.state,
          })),
        },
      },
    },
  }
}

/**
 * GraphQL Response: Add Blocked By
 */
export function createAddBlockedByResponse(issueNodeId: string, blockingIssueNodeId: string, blockingIssueNumber: number, blockingIssueTitle: string) {
  return {
    data: {
      addBlockedBy: {
        issue: {
          id: issueNodeId,
        },
        blockingIssue: {
          id: blockingIssueNodeId,
          number: blockingIssueNumber,
          title: blockingIssueTitle,
        },
      },
    },
  }
}

/**
 * GraphQL Response: Remove Blocked By
 */
export function createRemoveBlockedByResponse(issueNodeId: string, blockingIssueNodeId: string) {
  return {
    data: {
      removeBlockedBy: {
        issue: {
          id: issueNodeId,
        },
        blockingIssue: {
          id: blockingIssueNodeId,
        },
      },
    },
  }
}

/**
 * GraphQL Response: List Blocked By
 */
export function createListBlockedByResponse(blockers: Array<{ number: number, title: string, state: string, nodeId: string }>) {
  return {
    data: {
      node: {
        blockedBy: {
          nodes: blockers.map(issue => ({
            id: issue.nodeId,
            number: issue.number,
            title: issue.title,
            state: issue.state,
          })),
        },
      },
    },
  }
}

/**
 * GraphQL Response: Resolve Review Thread
 */
export function createResolveThreadResponse(threadId: string) {
  return {
    data: {
      resolveReviewThread: {
        thread: {
          id: threadId,
          isResolved: true,
        },
      },
    },
  }
}

/**
 * GraphQL Response: List Review Threads
 */
export function createListReviewThreadsResponse(threads: Array<{ id: string, isResolved: boolean, path: string, line: number | null, comments?: Array<{ id: string }> }>) {
  return {
    data: {
      node: {
        reviewThreads: {
          nodes: threads.map(thread => ({
            id: thread.id,
            isResolved: thread.isResolved,
            path: thread.path,
            line: thread.line,
            comments: {
              nodes: thread.comments || [],
            },
          })),
        },
      },
    },
  }
}

/**
 * REST Response: Get Repository Info
 */
export function createRepoViewResponse(owner: string, repo: string) {
  return {
    owner: {
      login: owner,
    },
    name: repo,
  }
}

/**
 * REST Response: Create Issue Comment
 */
export function createIssueCommentResponse(commentId: number, body: string, issueNumber: number) {
  return {
    id: commentId,
    body,
    html_url: `https://github.com/${mockRepoInfo.owner}/${mockRepoInfo.repo}/issues/${issueNumber}#issuecomment-${commentId}`,
  }
}

/**
 * REST Response: Create PR Comment
 */
export function createPrCommentResponse(commentId: number, body: string, prNumber: number) {
  return {
    id: commentId,
    body,
    html_url: `https://github.com/${mockRepoInfo.owner}/${mockRepoInfo.repo}/pull/${prNumber}#issuecomment-${commentId}`,
  }
}

/**
 * REST Response: Get Review Comment
 */
export function createGetReviewCommentResponse(commentId: number, body: string, prNumber: number, path: string, line: number) {
  return {
    id: commentId,
    body,
    path,
    line,
    pull_request_url: `https://api.github.com/repos/${mockRepoInfo.owner}/${mockRepoInfo.repo}/pulls/${prNumber}`,
    html_url: `https://github.com/${mockRepoInfo.owner}/${mockRepoInfo.repo}/pull/${prNumber}#discussion_r${commentId}`,
  }
}

/**
 * REST Response: Create Review Reply
 */
export function createReviewReplyResponse(replyId: number, body: string, inReplyTo: number) {
  return {
    id: replyId,
    body,
    in_reply_to_id: inReplyTo,
    html_url: `https://github.com/${mockRepoInfo.owner}/${mockRepoInfo.repo}/pull/${mockPr.number}#discussion_r${replyId}`,
  }
}

/**
 * REST Response: Get Current PR Info
 */
export function createCurrentPrResponse(prNumber: number, owner: string, repo: string) {
  return {
    number: prNumber,
    headRepositoryOwner: {
      login: owner,
    },
    headRepository: {
      name: repo,
    },
  }
}

/**
 * Error Response: Not Found
 */
export const notFoundError = {
  message: 'Not Found',
  documentation_url: 'https://docs.github.com/rest',
}

/**
 * Error Response: Validation Failed
 */
export function createValidationError(field: string, code: string) {
  return {
    message: 'Validation Failed',
    errors: [
      {
        resource: 'Issue',
        field,
        code,
      },
    ],
  }
}

/**
 * Error Response: Unauthorized
 */
export const unauthorizedError = {
  message: 'Bad credentials',
  documentation_url: 'https://docs.github.com/rest',
}

/**
 * GraphQL Response: List Issue Types
 */
export function createListIssueTypesResponse(types: Array<{ id: string, name: string, description?: string, color: string, isEnabled: boolean }>) {
  return {
    data: {
      repository: {
        issueTypes: {
          nodes: types,
        },
      },
    },
  }
}

/**
 * GraphQL Response: Update Issue Type
 */
export function createUpdateIssueTypeResponse(issueNodeId: string) {
  return {
    data: {
      updateIssueIssueType: {
        issue: {
          id: issueNodeId,
        },
      },
    },
  }
}

/**
 * GraphQL Response: Create Issue with Type
 */
export function createIssueWithTypeResponse(issueNumber: number, nodeId: string, title: string) {
  return {
    data: {
      createIssue: {
        issue: {
          id: nodeId,
          number: issueNumber,
          title,
        },
      },
    },
  }
}

/**
 * GraphQL Response: Get Repository Node ID
 */
export function createGetRepositoryNodeIdResponse(repositoryId: string) {
  return {
    data: {
      repository: {
        id: repositoryId,
      },
    },
  }
}

/**
 * Mock gh CLI responses for common commands
 */
export const ghCliResponses = {
  repoView: JSON.stringify(createRepoViewResponse(mockRepoInfo.owner, mockRepoInfo.repo)),
  currentPr: JSON.stringify(createCurrentPrResponse(mockPr.number, mockRepoInfo.owner, mockRepoInfo.repo)),
  issueComment: JSON.stringify(createIssueCommentResponse(123456, '/please triage', mockIssue.number)),
  prComment: JSON.stringify(createPrCommentResponse(234567, '/please review', mockPr.number)),
  reviewComment: JSON.stringify(createGetReviewCommentResponse(
    mockReviewComment.id,
    mockReviewComment.body,
    mockPr.number,
    mockReviewComment.path,
    mockReviewComment.line,
  )),
}
