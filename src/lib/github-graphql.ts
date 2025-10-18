/**
 * GraphQL execution layer for GitHub API
 * Uses gh CLI to execute GraphQL queries and mutations
 */

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

  const proc = Bun.spawn(['gh', ...args], {
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
    id: string
    nodeId: string
    isResolved: boolean
    path: string
    line: number | null
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
    id: thread.id,
    nodeId: thread.id,
    isResolved: thread.isResolved,
    path: thread.path,
    line: thread.line,
  }))
}
