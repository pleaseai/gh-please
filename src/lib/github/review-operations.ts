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
 * Get the Thread ID for a review comment by searching PR's reviewThreads
 *
 * GitHub GraphQL API does not provide a direct field to get thread from comment.
 * This function queries all reviewThreads on the PR and finds the thread
 * that contains the target comment.
 *
 * @param commentIdentifier - Node ID (PRRC_...) or Database ID of the review comment
 * @param prNodeId - Node ID of the pull request
 * @returns Thread Node ID (PRRT_...)
 * @throws Error if the comment or thread is not found
 * @see https://github.com/orgs/community/discussions/24666
 */
export async function getThreadIdFromComment(
  commentIdentifier: string,
  prNodeId: string,
): Promise<string> {
  // Query all reviewThreads with their comments
  const query = `
    query GetThreadsForComment($prId: ID!) {
      node(id: $prId) {
        ... on PullRequest {
          reviewThreads(first: 100) {
            nodes {
              id
              comments(first: 100) {
                nodes {
                  id
                  databaseId
                }
              }
            }
          }
        }
      }
    }
  `

  const data = await executeGraphQL(query, { prId: prNodeId }, undefined, 'GetThreadsForComment')

  if (!data.node?.reviewThreads?.nodes) {
    throw new Error(
      `Failed to fetch review threads from PR.\n`
      + `Please verify the PR Node ID and try again.`,
    )
  }

  // Search for the comment in all threads
  for (const thread of data.node.reviewThreads.nodes) {
    for (const comment of thread.comments?.nodes || []) {
      // Match by Node ID or Database ID
      if (
        comment.id === commentIdentifier
        || comment.databaseId?.toString() === commentIdentifier
      ) {
        return thread.id
      }
    }
  }

  throw new Error(
    `Thread not found for review comment ${commentIdentifier}.\n`
    + `Possible reasons:\n`
    + `  • The comment may have been deleted\n`
    + `  • The comment ID may be incorrect (use 'gh please pr review thread list <pr>' to see valid IDs)\n`
    + `  • The PR may have more than 100 review threads (pagination not yet supported)\n`
    + `  • The thread may have more than 100 comments (pagination not yet supported)\n`
    + `  • You may lack permissions to view this PR\n`
    + `\n`
    + `Please verify the comment ID and try again.`,
  )
}

/**
 * Create a reply to a PR review thread
 *
 * Supports multiple identifier formats:
 * - Thread Node ID (PRRT_...): Used directly, no additional API call
 * - Comment Node ID (PRRC_...): Finds thread via reviewThreads query
 * - Database ID (number): Finds thread via reviewThreads query
 *
 * @param identifier - Thread ID (PRRT_...), Comment ID (PRRC_...), or Database ID
 * @param body - Reply body text
 * @param prNodeId - Node ID of the pull request
 * @returns Created reply information
 * @throws Error if the mutation fails
 */
export async function createReviewCommentReply(
  identifier: string,
  body: string,
  prNodeId: string,
): Promise<{
  nodeId: string
  databaseId: number
  url: string
}> {
  // Determine the thread ID based on identifier format
  let threadId: string

  // Check if identifier is already a Thread Node ID (PRRT_...)
  if (/^PRRT_[\w-]+$/.test(identifier)) {
    // Use Thread ID directly - no API call needed
    threadId = identifier
  }
  else {
    // Get the thread ID from comment (by searching reviewThreads)
    threadId = await getThreadIdFromComment(identifier, prNodeId)
  }

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
