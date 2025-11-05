/**
 * GitHub issue management operations (creation and types)
 */

import { executeGraphQL, getRepositoryNodeId } from './graphql-core'

/**
 * List all issue types for a repository
 *
 * @param owner - Repository owner
 * @param repo - Repository name
 * @returns Array of issue types
 * @throws Error if the query fails
 * @warning This function returns a maximum of 100 issue types due to pagination limits.
 *          For repositories with more issue types, consider implementing pagination with `after` cursor.
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

  const variables = {
    repositoryId,
    title,
    ...(body !== undefined && { body }),
    ...(issueTypeId !== undefined && { issueTypeId }),
    ...(labelIds !== undefined && labelIds.length > 0 && { labelIds }),
    ...(assigneeIds !== undefined && assigneeIds.length > 0 && { assigneeIds }),
    ...(milestoneId !== undefined && { milestoneId }),
    ...(projectIds !== undefined && projectIds.length > 0 && { projectIds }),
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
