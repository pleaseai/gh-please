/**
 * GraphQL execution layer for GitHub API
 * Uses gh CLI to execute GraphQL queries and mutations
 */

/**
 * Get the gh command path from environment variable or use default
 * This allows tests to inject a mock gh command
 */
function getGhCommand(): string {
  return process.env.GH_PATH || 'gh'
}

/**
 * Execute a GraphQL query or mutation
 *
 * @param query - GraphQL query/mutation string
 * @param variables - Variables for the query
 * @param features - GraphQL Features header values (e.g., ["sub_issues"])
 * @returns Parsed GraphQL response data
 * @throws Error if the query fails or returns GraphQL errors
 */
export async function executeGraphQL(
  query: string,
  variables: Record<string, any> = {},
  features?: string[],
): Promise<any> {
  const args = ['api', 'graphql']

  // Add GraphQL Features header if provided
  if (features && features.length > 0) {
    args.push('-H', `GraphQL-Features: ${features.join(', ')}`)
  }

  // Add the query
  args.push('-f', `query=${query}`)

  // Add variables
  for (const [key, value] of Object.entries(variables)) {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value)
    args.push('-F', `${key}=${serialized}`)
  }

  const proc = Bun.spawn([getGhCommand(), ...args], {
    env: process.env,
    stdout: 'pipe',
    stderr: 'pipe',
  })

  const output = await new Response(proc.stdout).text()
  const exitCode = await proc.exited

  if (exitCode !== 0) {
    const error = await new Response(proc.stderr).text()
    throw new Error(`GraphQL query failed: ${error.trim()}`)
  }

  const result = JSON.parse(output)

  // Check for GraphQL errors
  if (result.errors) {
    const errorMessages = result.errors.map((e: any) => e.message).join(', ')
    throw new Error(`GraphQL errors: ${errorMessages}`)
  }

  return result.data
}

/**
 * Get the Node ID for an issue
 *
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param issueNumber - Issue number
 * @returns Node ID string
 * @throws Error if the issue is not found
 */
export async function getIssueNodeId(
  owner: string,
  repo: string,
  issueNumber: number,
): Promise<string> {
  const query = `
    query($owner: String!, $repo: String!, $number: Int!) {
      repository(owner: $owner, name: $repo) {
        issue(number: $number) {
          id
        }
      }
    }
  `

  const data = await executeGraphQL(query, { owner, repo, number: issueNumber })

  if (!data.repository?.issue) {
    throw new Error(`Issue #${issueNumber} not found in ${owner}/${repo}`)
  }

  return data.repository.issue.id
}

/**
 * Get the Node ID for a pull request
 *
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param prNumber - Pull request number
 * @returns Node ID string
 * @throws Error if the PR is not found
 */
export async function getPrNodeId(
  owner: string,
  repo: string,
  prNumber: number,
): Promise<string> {
  const query = `
    query($owner: String!, $repo: String!, $number: Int!) {
      repository(owner: $owner, name: $repo) {
        pullRequest(number: $number) {
          id
        }
      }
    }
  `

  const data = await executeGraphQL(query, { owner, repo, number: prNumber })

  if (!data.repository?.pullRequest) {
    throw new Error(`PR #${prNumber} not found in ${owner}/${repo}`)
  }

  return data.repository.pullRequest.id
}

/**
 * Add a sub-issue to a parent issue
 *
 * @param parentNodeId - Node ID of parent issue
 * @param childNodeId - Node ID of child issue to add
 * @throws Error if the mutation fails
 */
export async function addSubIssue(
  parentNodeId: string,
  childNodeId: string,
): Promise<void> {
  const mutation = `
    mutation($parentId: ID!, $childId: ID!) {
      addSubIssue(input: {issueId: $parentId, subIssueId: $childId}) {
        issue {
          id
          title
        }
        subIssue {
          id
          number
          title
        }
      }
    }
  `

  await executeGraphQL(
    mutation,
    { parentId: parentNodeId, childId: childNodeId },
    ['sub_issues'],
  )
}

/**
 * Remove a sub-issue from a parent issue
 *
 * @param parentNodeId - Node ID of parent issue
 * @param childNodeId - Node ID of child issue to remove
 * @throws Error if the mutation fails
 */
export async function removeSubIssue(
  parentNodeId: string,
  childNodeId: string,
): Promise<void> {
  const mutation = `
    mutation($parentId: ID!, $childId: ID!) {
      removeSubIssue(input: {issueId: $parentId, subIssueId: $childId}) {
        issue {
          id
          title
        }
      }
    }
  `

  await executeGraphQL(
    mutation,
    { parentId: parentNodeId, childId: childNodeId },
    ['sub_issues'],
  )
}

/**
 * List all sub-issues of a parent issue
 *
 * @param parentNodeId - Node ID of parent issue
 * @returns Array of sub-issue info
 */
export async function listSubIssues(
  parentNodeId: string,
): Promise<
  Array<{
    number: number
    title: string
    state: string
    nodeId: string
  }>
> {
  const query = `
    query($issueId: ID!) {
      node(id: $issueId) {
        ... on Issue {
          subIssues(first: 100) {
            nodes {
              id
              number
              title
              state
            }
          }
        }
      }
    }
  `

  const data = await executeGraphQL(query, { issueId: parentNodeId }, [
    'sub_issues',
  ])

  if (!data.node?.subIssues) {
    return []
  }

  return data.node.subIssues.nodes.map((issue: any) => ({
    number: issue.number,
    title: issue.title,
    state: issue.state,
    nodeId: issue.id,
  }))
}

/**
 * Add a "blocked by" relationship between issues
 *
 * @param issueNodeId - Node ID of the blocked issue
 * @param blockingIssueNodeId - Node ID of the blocking issue
 * @throws Error if the mutation fails
 */
export async function addBlockedBy(
  issueNodeId: string,
  blockingIssueNodeId: string,
): Promise<void> {
  const mutation = `
    mutation($issueId: ID!, $blockingIssueId: ID!) {
      addBlockedBy(input: {issueId: $issueId, blockingIssueId: $blockingIssueId}) {
        issue {
          id
          title
        }
        blockingIssue {
          id
          number
          title
        }
      }
    }
  `

  await executeGraphQL(mutation, {
    issueId: issueNodeId,
    blockingIssueId: blockingIssueNodeId,
  })
}

/**
 * Remove a "blocked by" relationship between issues
 *
 * @param issueNodeId - Node ID of the blocked issue
 * @param blockingIssueNodeId - Node ID of the blocking issue to remove
 * @throws Error if the mutation fails
 */
export async function removeBlockedBy(
  issueNodeId: string,
  blockingIssueNodeId: string,
): Promise<void> {
  const mutation = `
    mutation($issueId: ID!, $blockingIssueId: ID!) {
      removeBlockedBy(input: {issueId: $issueId, blockingIssueId: $blockingIssueId}) {
        issue {
          id
          title
        }
        blockingIssue {
          id
          title
        }
      }
    }
  `

  await executeGraphQL(mutation, {
    issueId: issueNodeId,
    blockingIssueId: blockingIssueNodeId,
  })
}

/**
 * List all issues blocking a given issue
 *
 * @param issueNodeId - Node ID of the issue
 * @returns Array of blocking issue info
 */
export async function listBlockedBy(
  issueNodeId: string,
): Promise<
  Array<{
    number: number
    title: string
    state: string
    nodeId: string
  }>
> {
  const query = `
    query($issueId: ID!) {
      node(id: $issueId) {
        ... on Issue {
          blockedBy(first: 100) {
            nodes {
              id
              number
              title
              state
            }
          }
        }
      }
    }
  `

  const data = await executeGraphQL(query, { issueId: issueNodeId })

  if (!data.node?.blockedBy) {
    return []
  }

  return data.node.blockedBy.nodes.map((issue: any) => ({
    number: issue.number,
    title: issue.title,
    state: issue.state,
    nodeId: issue.id,
  }))
}

/**
 * Resolve a review thread
 *
 * @param threadNodeId - Node ID of the review thread
 * @throws Error if the mutation fails
 */
export async function resolveReviewThread(threadNodeId: string): Promise<void> {
  const mutation = `
    mutation($threadId: ID!) {
      resolveReviewThread(input: {threadId: $threadId}) {
        thread {
          id
          isResolved
        }
      }
    }
  `

  await executeGraphQL(mutation, { threadId: threadNodeId })
}

/**
 * List all review threads for a pull request
 *
 * @param prNodeId - Node ID of the pull request
 * @returns Array of review thread info
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
    query($prId: ID!) {
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

  const data = await executeGraphQL(query, { prId: prNodeId })

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
  // Step 1: Get PR ID from the comment
  const commentQuery = `
    query($commentId: ID!) {
      node(id: $commentId) {
        ... on PullRequestReviewComment {
          pullRequest {
            id
          }
        }
      }
    }
  `

  console.log(`🔍 Looking up pull request for review comment ${commentNodeId}...`)
  const commentData = await executeGraphQL(commentQuery, { commentId: commentNodeId })

  const prId = commentData.node?.pullRequest?.id
  if (!prId) {
    throw new Error(
      `Could not find pull request for review comment ${commentNodeId}.\n`
      + `Possible reasons:\n`
      + `  • The comment may have been deleted\n`
      + `  • The comment ID may be incorrect (use 'gh please pr review thread list <pr>' to see valid IDs)\n`
      + `  • You may lack permissions to view this PR\n`
      + `\n`
      + `Please verify the comment ID and try again.`,
    )
  }
  console.log(`✓ Found PR: ${prId}`)

  // Step 2: Get all review threads and find the one containing this comment
  const threadsQuery = `
    query($prId: ID!) {
      node(id: $prId) {
        ... on PullRequest {
          reviewThreads(first: 100) {
            nodes {
              id
              comments(first: 100) {
                nodes {
                  id
                }
              }
            }
          }
        }
      }
    }
  `

  console.log(`🔍 Fetching review threads for PR...`)
  const threadsData = await executeGraphQL(threadsQuery, { prId })

  const threads = threadsData.node?.reviewThreads?.nodes
  if (!threads) {
    throw new Error(
      `Could not fetch review threads for PR.\n`
      + `The PR may not exist, you may lack permissions, or there was an API error.`,
    )
  }
  console.log(`✓ Retrieved ${threads.length} review thread(s)`)

  // Find thread containing our comment
  for (const thread of threads) {
    if (!thread.comments?.nodes) {
      console.warn(`⚠️  Warning: Thread ${thread.id} returned without comment data, skipping`)
      continue
    }

    const commentIds = thread.comments.nodes.map((c: any) => c.id)
    if (commentIds.includes(commentNodeId)) {
      return thread.id
    }
  }

  throw new Error(
    `Thread not found for review comment ${commentNodeId}.\n`
    + `Searched ${threads.length} review thread(s) on this PR but none contained this comment.\n`
    + `Possible reasons:\n`
    + `  • The comment ID may be incorrect\n`
    + `  • The comment may have been deleted\n`
    + `  • There may be a data synchronization issue with GitHub\n`
    + `\n`
    + `Try running 'gh please pr review thread list <pr-number>' to see available threads.`,
  )
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
    mutation($threadId: ID!, $body: String!) {
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
  })

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
    mutation($commentId: ID!, $body: String!) {
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
  })

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
    mutation($commentId: ID!, $body: String!) {
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
  })

  if (!data.updateIssueComment?.issueComment) {
    throw new Error('Failed to update issue comment')
  }
}

/**
 * List all issue types for a repository
 *
 * @param owner - Repository owner
 * @param repo - Repository name
 * @returns Array of issue types
 * @throws Error if the query fails
 */
export async function listIssueTypes(
  owner: string,
  repo: string,
): Promise<Array<{
  id: string
  name: string
  description?: string
  color: string
  isEnabled: boolean
}>> {
  const query = `
    query($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        issueTypes(first: 100) {
          nodes {
            id
            name
            description
            color
            isEnabled
          }
        }
      }
    }
  `

  const data = await executeGraphQL(query, { owner, repo })

  if (!data.repository) {
    throw new Error(
      `Repository ${owner}/${repo} not found or issue types are not available.\n`
      + `Possible reasons:\n`
      + `  • The repository does not exist or you lack permissions to view it\n`
      + `  • The owner or repo name may be misspelled\n`
      + `  • Issue types may not be enabled for this repository`,
    )
  }

  if (!data.repository.issueTypes?.nodes) {
    return []
  }

  return data.repository.issueTypes.nodes
}

/**
 * Get the Node ID for a repository
 *
 * @param owner - Repository owner
 * @param repo - Repository name
 * @returns Repository Node ID
 * @throws Error if the repository is not found
 */
export async function getRepositoryNodeId(
  owner: string,
  repo: string,
): Promise<string> {
  const query = `
    query($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        id
      }
    }
  `

  const data = await executeGraphQL(query, { owner, repo })

  if (!data.repository?.id) {
    throw new Error(
      `Repository ${owner}/${repo} not found.\n`
      + `Possible reasons:\n`
      + `  • The repository does not exist\n`
      + `  • You lack permissions to view this repository\n`
      + `  • The owner or repo name may be misspelled`,
    )
  }

  return data.repository.id
}

/**
 * Create an issue with optional issue type
 *
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param title - Issue title
 * @param body - Issue body (optional)
 * @param issueTypeId - Issue type Node ID (optional)
 * @returns Object with issue number and Node ID
 * @throws Error if the mutation fails
 */
export async function createIssueWithType(
  owner: string,
  repo: string,
  title: string,
  body?: string,
  issueTypeId?: string,
): Promise<{ number: number, nodeId: string }> {
  // Get repository Node ID
  const repositoryId = await getRepositoryNodeId(owner, repo)

  const mutation = `
    mutation($repositoryId: ID!, $title: String!, $body: String, $issueTypeId: ID) {
      createIssue(input: {
        repositoryId: $repositoryId
        title: $title
        body: $body
        issueTypeId: $issueTypeId
      }) {
        issue {
          id
          number
        }
      }
    }
  `

  const variables: Record<string, any> = {
    repositoryId,
    title,
  }

  if (body !== undefined) {
    variables.body = body
  }

  if (issueTypeId !== undefined) {
    variables.issueTypeId = issueTypeId
  }

  const data = await executeGraphQL(mutation, variables)

  if (!data.createIssue?.issue) {
    throw new Error(
      `Failed to create issue in repository ${owner}/${repo}.\n`
      + `Possible reasons:\n`
      + `  • You lack permissions to create issues in this repository\n`
      + `  • The repository may be archived, locked, or deleted\n`
      + `  • The issue type ID may be invalid or disabled (if specified)\n`
      + `  • The title may exceed the maximum length (256 characters)\n`
      + `  • Required fields may be missing or malformed`,
    )
  }

  return {
    number: data.createIssue.issue.number,
    nodeId: data.createIssue.issue.id,
  }
}

/**
 * Update the issue type of an existing issue
 *
 * @param issueId - Issue Node ID
 * @param issueTypeId - Issue type Node ID (null to clear)
 * @throws Error if the mutation fails
 */
export async function updateIssueType(
  issueId: string,
  issueTypeId: string | null,
): Promise<void> {
  const mutation = `
    mutation($issueId: ID!, $issueTypeId: ID) {
      updateIssueIssueType(input: {
        issueId: $issueId
        issueTypeId: $issueTypeId
      }) {
        issue {
          id
        }
      }
    }
  `

  const data = await executeGraphQL(mutation, {
    issueId,
    issueTypeId,
  })

  if (!data.updateIssueIssueType?.issue) {
    throw new Error(
      `Failed to update issue type for issue ${issueId}.\n`
      + `Possible reasons:\n`
      + `  • The issue does not exist or has been deleted\n`
      + `  • You lack permissions to modify this issue\n`
      + `  • The issue type ID may be invalid or disabled (if specified)\n`
      + `  • The issue may be locked or in a restricted state\n`
      + `  • The issue may have been transferred to another repository`,
    )
  }
}
