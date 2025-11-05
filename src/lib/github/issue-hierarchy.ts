/**
 * GitHub issue hierarchy operations (sub-issues and dependencies)
 */

import { executeGraphQL } from './graphql-core'

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
