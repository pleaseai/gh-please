/**
 * GitHub PR review operations including threads, comments, and replies
 */

import { executeGraphQL } from './graphql-core'

/**
 * Resolve a review thread
 *
 * @param threadNodeId - Node ID of the review thread
 * @throws Error if the mutation fails
 */
export async function resolveReviewThread(threadNodeId: string): Promise<void> {
  const mutation = `
    mutation ResolveReviewThread($threadId: ID!) {
      resolveReviewThread(input: {threadId: $threadId}) {
        thread {
          id
          isResolved
        }
      }
    }
  `

  await executeGraphQL(mutation, { threadId: threadNodeId }, undefined, 'ResolveReviewThread')
}

/**
 * List all review threads for a pull request
 *
 * @param prNodeId - Node ID of the pull request
 * @returns Array of review thread info
 * @warning This function returns a maximum of 100 review threads due to pagination limits.
 *          Each thread returns only the first comment. For PRs with more threads or comments,
 *          consider implementing pagination with `after` cursor.
 */
export async function listReviewThreads(
  prNodeId: string,
): Promise<
  Array<{
    nodeId: string
    isResolved: boolean
    path: string
    line: number | null
    firstCommentBody?: string
    firstCommentDatabaseId?: number
    resolvedBy?: string
  }>
> {
  const query = `
    query ListReviewThreads($prId: ID!) {
      node(id: $prId) {
        ... on PullRequest {
          reviewThreads(first: 100) {
            nodes {
              id
              isResolved
              path
              line
              comments(first: 1) {
                nodes {
                  body
                  databaseId
                }
              }
              resolvedBy {
                login
              }
            }
          }
        }
      }
    }
  `

  const data = await executeGraphQL(query, { prId: prNodeId }, undefined, 'ListReviewThreads')

  if (!data.node?.reviewThreads) {
    return []
  }

  return data.node.reviewThreads.nodes.map((thread: any) => ({
    nodeId: thread.id,
    isResolved: thread.isResolved,
    path: thread.path,
    line: thread.line,
    firstCommentBody: thread.comments?.nodes?.[0]?.body,
    firstCommentDatabaseId: thread.comments?.nodes?.[0]?.databaseId,
    resolvedBy: thread.resolvedBy?.login,
  }))
}

/**
 * Get the Thread ID for a review comment
 *
 * @param commentNodeId - Node ID of the review comment (PRRC_...)
 * @returns Thread Node ID (PRRT_...)
 * @throws Error if the comment or thread is not found
 */
export async function getThreadIdFromComment(
  commentNodeId: string,
): Promise<string> {
  const query = `
    query GetThreadFromComment($commentId: ID!) {
      node(id: $commentId) {
        ... on PullRequestReviewComment {
          pullRequestReviewThread {
            id
          }
        }
      }
    }
  `

  const data = await executeGraphQL(query, { commentId: commentNodeId }, undefined, 'GetThreadFromComment')

  if (!data.node?.pullRequestReviewThread?.id) {
    throw new Error(
      `Thread not found for review comment ${commentNodeId}.\n`
      + `Possible reasons:\n`
      + `  • The comment may have been deleted\n`
      + `  • The comment ID may be incorrect (use 'gh please pr review thread list <pr>' to see valid IDs)\n`
      + `  • You may lack permissions to view this PR\n`
      + `\n`
      + `Please verify the comment ID and try again.`,
    )
  }

  return data.node.pullRequestReviewThread.id
}

/**
 * Create a reply to a PR review comment using Node ID
 *
 * @param commentNodeId - Node ID of the comment to reply to (PRRC_...)
 * @param body - Reply body text
 * @returns Created reply information
 * @throws Error if the mutation fails
 */
export async function createReviewCommentReply(
  commentNodeId: string,
  body: string,
): Promise<{
  nodeId: string
  databaseId: number
  url: string
}> {
  // Get the thread ID from the comment
  const threadId = await getThreadIdFromComment(commentNodeId)

  const mutation = `
    mutation CreateReviewCommentReply($threadId: ID!, $body: String!) {
      addPullRequestReviewThreadReply(input: {
        pullRequestReviewThreadId: $threadId
        body: $body
      }) {
        comment {
          id
          databaseId
          url
        }
      }
    }
  `

  const data = await executeGraphQL(mutation, {
    threadId,
    body,
  }, undefined, 'CreateReviewCommentReply')

  if (!data.addPullRequestReviewThreadReply?.comment) {
    throw new Error('Failed to create review comment reply')
  }

  const comment = data.addPullRequestReviewThreadReply.comment

  return {
    nodeId: comment.id,
    databaseId: comment.databaseId,
    url: comment.url,
  }
}

/**
 * Update a PR review comment using Node ID
 *
 * @param commentNodeId - Node ID of the comment to update (PRRC_...)
 * @param body - New comment body text
 * @throws Error if the mutation fails
 */
export async function updateReviewCommentByNodeId(
  commentNodeId: string,
  body: string,
): Promise<void> {
  const mutation = `
    mutation UpdateReviewComment($commentId: ID!, $body: String!) {
      updatePullRequestReviewComment(input: {
        pullRequestReviewCommentId: $commentId
        body: $body
      }) {
        pullRequestReviewComment {
          id
        }
      }
    }
  `

  const data = await executeGraphQL(mutation, {
    commentId: commentNodeId,
    body,
  }, undefined, 'UpdateReviewComment')

  if (!data.updatePullRequestReviewComment?.pullRequestReviewComment) {
    throw new Error('Failed to update review comment')
  }
}

/**
 * Update an issue comment using Node ID
 *
 * @param commentNodeId - Node ID of the comment to update (IC_...)
 * @param body - New comment body text
 * @throws Error if the mutation fails
 */
export async function updateIssueCommentByNodeId(
  commentNodeId: string,
  body: string,
): Promise<void> {
  const mutation = `
    mutation UpdateIssueComment($commentId: ID!, $body: String!) {
      updateIssueComment(input: {
        id: $commentId
        body: $body
      }) {
        issueComment {
          id
        }
      }
    }
  `

  const data = await executeGraphQL(mutation, {
    commentId: commentNodeId,
    body,
  }, undefined, 'UpdateIssueComment')

  if (!data.updateIssueComment?.issueComment) {
    throw new Error('Failed to update issue comment')
  }
}
