/**
 * Core GraphQL execution utilities for GitHub API
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
