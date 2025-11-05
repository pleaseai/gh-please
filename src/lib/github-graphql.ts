/**
 * GraphQL execution layer for GitHub API
 * Uses gh CLI to execute GraphQL queries and mutations
 */

interface LabelNode {
  id: string
  name: string
}

interface MilestoneNode {
  id: string
  title: string
}

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
 * @param operationName - Optional operation name for better debugging and mocking
 * @returns Parsed GraphQL response data
 * @throws Error if the query fails or returns GraphQL errors
 */
export async function executeGraphQL(
  query: string,
  variables: Record<string, any> = {},
  features?: string[],
  operationName?: string,
): Promise<any> {
  const args = ['api', 'graphql']

  // Add GraphQL Features header if provided
  if (features && features.length > 0) {
    args.push('-H', `GraphQL-Features: ${features.join(', ')}`)
  }

  // Add the query
  args.push('-f', `query=${query}`)

  // Add operation name if provided (for better logging and mock matching)
  if (operationName) {
    args.push('-F', `operationName=${operationName}`)
  }

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
    query GetIssueNodeId($owner: String!, $repo: String!, $number: Int!) {
      repository(owner: $owner, name: $repo) {
        issue(number: $number) {
          id
        }
      }
    }
  `

  const data = await executeGraphQL(query, { owner, repo, number: issueNumber }, undefined, 'GetIssueNodeId')

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
    query GetPrNodeId($owner: String!, $repo: String!, $number: Int!) {
      repository(owner: $owner, name: $repo) {
        pullRequest(number: $number) {
          id
        }
      }
    }
  `

  const data = await executeGraphQL(query, { owner, repo, number: prNumber }, undefined, 'GetPrNodeId')

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
    mutation AddSubIssue($parentId: ID!, $childId: ID!) {
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
    'AddSubIssue',
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
    mutation RemoveSubIssue($parentId: ID!, $childId: ID!) {
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
    'RemoveSubIssue',
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
    query ListSubIssues($issueId: ID!) {
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
  ], 'ListSubIssues')

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
    mutation AddBlockedBy($issueId: ID!, $blockingIssueId: ID!) {
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
  }, undefined, 'AddBlockedBy')
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
    mutation RemoveBlockedBy($issueId: ID!, $blockingIssueId: ID!) {
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
  }, undefined, 'RemoveBlockedBy')
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
    query ListBlockedBy($issueId: ID!) {
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

  const data = await executeGraphQL(query, { issueId: issueNodeId }, undefined, 'ListBlockedBy')

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
  // Step 1: Get PR ID from the comment
  const commentQuery = `
    query GetPrFromComment($commentId: ID!) {
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
  const commentData = await executeGraphQL(commentQuery, { commentId: commentNodeId }, undefined, 'GetPrFromComment')

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
    query GetThreadsForComment($prId: ID!) {
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
  const threadsData = await executeGraphQL(threadsQuery, { prId }, undefined, 'GetThreadsForComment')

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
    query ListIssueTypes($owner: String!, $repo: String!) {
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

  const data = await executeGraphQL(query, { owner, repo }, undefined, 'ListIssueTypes')

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
    query GetRepositoryNodeId($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        id
      }
    }
  `

  const data = await executeGraphQL(query, { owner, repo }, undefined, 'GetRepositoryNodeId')

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
 * Create an issue with optional issue type, labels, assignees, milestone, and projects
 *
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param title - Issue title
 * @param body - Issue body (optional)
 * @param issueTypeId - Issue type Node ID (optional)
 * @param labelIds - Array of label Node IDs (optional)
 * @param assigneeIds - Array of assignee Node IDs (optional)
 * @param milestoneId - Milestone Node ID (optional)
 * @param projectIds - Array of project Node IDs (optional)
 * @returns Object with issue number and Node ID
 * @throws Error if the mutation fails
 */
export async function createIssueWithType(
  owner: string,
  repo: string,
  title: string,
  body?: string,
  issueTypeId?: string,
  labelIds?: string[],
  assigneeIds?: string[],
  milestoneId?: string,
  projectIds?: string[],
): Promise<{ number: number, nodeId: string }> {
  // Get repository Node ID
  const repositoryId = await getRepositoryNodeId(owner, repo)

  const mutation = `
    mutation CreateIssueWithType($repositoryId: ID!, $title: String!, $body: String, $issueTypeId: ID, $labelIds: [ID!], $assigneeIds: [ID!], $milestoneId: ID, $projectIds: [ID!]) {
      createIssue(input: {
        repositoryId: $repositoryId
        title: $title
        body: $body
        issueTypeId: $issueTypeId
        labelIds: $labelIds
        assigneeIds: $assigneeIds
        milestoneId: $milestoneId
        projectIds: $projectIds
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

  if (labelIds !== undefined && labelIds.length > 0) {
    variables.labelIds = labelIds
  }

  if (assigneeIds !== undefined && assigneeIds.length > 0) {
    variables.assigneeIds = assigneeIds
  }

  if (milestoneId !== undefined) {
    variables.milestoneId = milestoneId
  }

  if (projectIds !== undefined && projectIds.length > 0) {
    variables.projectIds = projectIds
  }

  const data = await executeGraphQL(mutation, variables, undefined, 'CreateIssueWithType')

  if (!data.createIssue?.issue) {
    throw new Error(
      `Failed to create issue in repository ${owner}/${repo}.\n`
      + `Possible reasons:\n`
      + `  • You lack permissions to create issues in this repository\n`
      + `  • The repository may be archived, locked, or deleted\n`
      + `  • The issue type ID may be invalid or disabled (if specified)\n`
      + `  • Label IDs may be invalid (if specified)\n`
      + `  • Assignee IDs may be invalid (if specified)\n`
      + `  • Milestone ID may be invalid (if specified)\n`
      + `  • Project IDs may be invalid (if specified)\n`
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
    mutation UpdateIssueType($issueId: ID!, $issueTypeId: ID) {
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
  }, undefined, 'UpdateIssueType')

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

/**
 * Get Node IDs for multiple labels by name
 *
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param labelNames - Array of label names
 * @returns Array of label Node IDs
 * @throws Error if any label is not found
 */
export async function getLabelNodeIds(
  owner: string,
  repo: string,
  labelNames: string[],
): Promise<string[]> {
  const query = `
    query GetLabelNodeIds($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        labels(first: 100) {
          nodes {
            id
            name
          }
        }
      }
    }
  `

  const data = await executeGraphQL(query, { owner, repo }, undefined, 'GetLabelNodeIds')

  if (!data.repository?.labels?.nodes) {
    throw new Error(
      `Repository ${owner}/${repo} not found or labels are not available.\n`
      + `Possible reasons:\n`
      + `  • The repository does not exist or you lack permissions to view it\n`
      + `  • The owner or repo name may be misspelled`,
    )
  }

  const labels: LabelNode[] = data.repository.labels.nodes
  const labelMap = new Map<string, string>(labels.map(label => [label.name, label.id]))

  const nodeIds: string[] = []
  const notFound: string[] = []

  for (const name of labelNames) {
    const nodeId = labelMap.get(name)
    if (nodeId) {
      nodeIds.push(nodeId)
    }
    else {
      notFound.push(name)
    }
  }

  if (notFound.length > 0) {
    throw new Error(
      `Label(s) not found: ${notFound.join(', ')}\n`
      + `Available labels: ${labels.map((l: any) => l.name).join(', ')}`,
    )
  }

  return nodeIds
}

/**
 * Get Node IDs for multiple assignees by login
 * Handles special case: @me (current user)
 *
 * @param owner - Repository owner
 * @param repo - Repository name (not used in queries but kept for API consistency)
 * @param logins - Array of user logins (supports @me)
 * @returns Array of assignee Node IDs
 * @throws Error if any user is not found
 */
export async function getAssigneeNodeIds(
  owner: string,
  repo: string,
  logins: string[],
): Promise<string[]> {
  const nodeIds: string[] = []
  const notFound: string[] = []

  for (const login of logins) {
    // Handle special case: @me
    if (login === '@me') {
      const viewerQuery = `
        query GetCurrentUser {
          viewer {
            id
          }
        }
      `
      const viewerData = await executeGraphQL(viewerQuery, {}, undefined, 'GetCurrentUser')
      if (viewerData.viewer?.id) {
        nodeIds.push(viewerData.viewer.id)
        continue
      }
      else {
        notFound.push(login)
        continue
      }
    }

    // Query for user by login
    const userQuery = `
      query GetUserNodeId($login: String!) {
        user(login: $login) {
          id
        }
      }
    `
    try {
      const userData = await executeGraphQL(userQuery, { login }, undefined, 'GetUserNodeId')
      if (userData.user?.id) {
        nodeIds.push(userData.user.id)
      }
      else {
        notFound.push(login)
      }
    }
    catch (error) {
      // Only treat "not found" errors as missing users
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage.includes('Could not resolve to a User') || errorMessage.includes('NOT_FOUND')) {
        notFound.push(login)
      }
      else {
        // Re-throw unexpected errors (network, auth, API failures)
        throw new Error(
          `Failed to look up assignee "${login}": ${errorMessage}\n`
          + `This may be a network issue, authentication problem, or API error.\n`
          + `Please check your connection and GitHub authentication: gh auth status`,
        )
      }
    }
  }

  if (notFound.length > 0) {
    throw new Error(
      `Assignee(s) not found: ${notFound.join(', ')}\n`
      + `Make sure the user login(s) are correct or use @me for current user`,
    )
  }

  return nodeIds
}

/**
 * Get Node ID for an open milestone by name
 * Note: Only searches OPEN milestones - closed milestones will not be found
 *
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param milestoneName - Milestone title (exact match required)
 * @returns Milestone Node ID
 * @throws Error if the milestone is not found or is closed
 */
export async function getMilestoneNodeId(
  owner: string,
  repo: string,
  milestoneName: string,
): Promise<string> {
  const query = `
    query GetMilestoneNodeId($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        milestones(first: 100, states: OPEN) {
          nodes {
            id
            title
            number
          }
        }
      }
    }
  `

  const data = await executeGraphQL(query, { owner, repo }, undefined, 'GetMilestoneNodeId')

  if (!data.repository?.milestones?.nodes) {
    throw new Error(
      `Repository ${owner}/${repo} not found or milestones are not available.\n`
      + `Possible reasons:\n`
      + `  • The repository does not exist or you lack permissions to view it\n`
      + `  • The owner or repo name may be misspelled`,
    )
  }

  const milestones: MilestoneNode[] = data.repository.milestones.nodes
  const milestone = milestones.find(m => m.title === milestoneName)

  if (!milestone) {
    const availableMilestones = milestones.map(m => m.title).join(', ')
    throw new Error(
      `Milestone "${milestoneName}" not found.\n${
        availableMilestones
          ? `Available milestones: ${availableMilestones}`
          : 'No open milestones available in this repository'}`,
    )
  }

  return milestone.id
}

/**
 * Get Node IDs for multiple projects by title
 * Searches both repository projects and organization projects
 *
 * @param owner - Repository owner (or organization login)
 * @param repo - Repository name
 * @param projectTitles - Array of project titles
 * @returns Array of project Node IDs
 * @throws Error if any project is not found
 */
export async function getProjectNodeIds(
  owner: string,
  repo: string,
  projectTitles: string[],
): Promise<string[]> {
  // Query both repository and organization projects
  const query = `
    query GetProjectNodeIds($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        projectsV2(first: 100) {
          nodes {
            id
            title
          }
        }
      }
      organization(login: $owner) {
        projectsV2(first: 100) {
          nodes {
            id
            title
          }
        }
      }
    }
  `

  const data = await executeGraphQL(query, { owner, repo }, undefined, 'GetProjectNodeIds')

  // Collect all projects from both repository and organization
  const allProjects: Array<{ id: string, title: string }> = []

  if (data.repository?.projectsV2?.nodes) {
    allProjects.push(...data.repository.projectsV2.nodes)
  }

  if (data.organization?.projectsV2?.nodes) {
    allProjects.push(...data.organization.projectsV2.nodes)
  }

  if (allProjects.length === 0) {
    throw new Error(
      `No projects found for ${owner}/${repo}.\n`
      + `Possible reasons:\n`
      + `  • The repository or organization has no projects\n`
      + `  • You lack permissions to view projects\n`
      + `  • Projects (classic) are not supported - use Projects (beta/V2)`,
    )
  }

  // Map project titles to IDs
  const projectMap = new Map<string, string>(allProjects.map(p => [p.title, p.id]))

  const nodeIds: string[] = []
  const notFound: string[] = []

  for (const title of projectTitles) {
    const nodeId = projectMap.get(title)
    if (nodeId) {
      nodeIds.push(nodeId)
    }
    else {
      notFound.push(title)
    }
  }

  if (notFound.length > 0) {
    const availableProjects = allProjects.map(p => p.title).join(', ')
    throw new Error(
      `Project(s) not found: ${notFound.join(', ')}\n${
        availableProjects
          ? `Available projects: ${availableProjects}`
          : 'No projects available'}`,
    )
  }

  return nodeIds
}
