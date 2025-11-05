/**
 * GitHub metadata operations for labels, assignees, milestones, and projects
 */

import { executeGraphQL } from './graphql-core'

interface LabelNode {
  id: string
  name: string
}

interface MilestoneNode {
  id: string
  title: string
}

/**
 * Get Node IDs for multiple labels by name
 *
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param labelNames - Array of label names
 * @returns Array of label Node IDs
 * @throws Error if any label is not found
 * @warning This function fetches a maximum of 100 labels due to pagination limits.
 *          For repositories with more labels, consider implementing pagination with `after` cursor.
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

  const results = labelNames.map(name => ({ name, nodeId: labelMap.get(name) }))
  const notFound = results.filter(r => !r.nodeId).map(r => r.name)

  if (notFound.length > 0) {
    throw new Error(
      `Label(s) not found: ${notFound.join(', ')}\n`
      + `Available labels: ${labels.map((l: any) => l.name).join(', ')}`,
    )
  }

  return results.map(r => r.nodeId!)
}

/**
 * Get Node IDs for multiple assignees by login using batched GraphQL query
 * Handles special case: @me (current user)
 *
 * Uses dynamic query building with aliases to fetch all users in a single request,
 * reducing API rate limit consumption from N points to 1 point.
 *
 * @param owner - Repository owner
 * @param repo - Repository name (not used in queries but kept for API consistency)
 * @param logins - Array of user logins (supports @me)
 * @returns Array of assignee Node IDs in the same order as input logins
 * @throws Error if any user is not found
 */
export async function getAssigneeNodeIds(
  owner: string,
  repo: string,
  logins: string[],
): Promise<string[]> {
  if (logins.length === 0) {
    return []
  }

  const nodeIds: string[] = []
  const notFound: string[] = []

  // Separate @me from regular logins
  const hasMeAlias = logins.includes('@me')
  const regularLogins = logins.filter(login => login !== '@me')

  // Build batched query with aliases
  const queryParts: string[] = []
  const variables: Record<string, string> = {}

  // Add viewer query if @me is present
  if (hasMeAlias) {
    queryParts.push('viewer { id }')
  }

  // Add aliased user queries for regular logins
  for (const [index, login] of regularLogins.entries()) {
    const alias = `user${index}`
    const varName = `login${index}`
    queryParts.push(`${alias}: user(login: $${varName}) { id }`)
    variables[varName] = login
  }

  // Build variable declarations
  const varDeclarations = Object.keys(variables)
    .map(varName => `$${varName}: String!`)
    .join(', ')

  // Construct final query
  const batchedQuery = `
    query GetAssigneeNodeIds${varDeclarations ? `(${varDeclarations})` : ''} {
      ${queryParts.join('\n      ')}
    }
  `

  try {
    const data = await executeGraphQL(batchedQuery, variables, undefined, 'GetAssigneeNodeIds')

    // Process results in original order
    for (const login of logins) {
      if (login === '@me') {
        if (data.viewer?.id) {
          nodeIds.push(data.viewer.id)
        }
        else {
          notFound.push(login)
        }
      }
      else {
        const index = regularLogins.indexOf(login)
        const alias = `user${index}`
        if (data[alias]?.id) {
          nodeIds.push(data[alias].id)
        }
        else {
          notFound.push(login)
        }
      }
    }
  }
  catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    // Check if error is due to users not found
    if (errorMessage.includes('Could not resolve to a User') || errorMessage.includes('NOT_FOUND')) {
      // Parse error to identify which users were not found
      // GraphQL returns partial results, so re-query individually to identify missing users
      return fallbackSequentialLookup(owner, repo, logins)
    }

    // Re-throw unexpected errors (network, auth, API failures)
    throw new Error(
      `Failed to look up assignees: ${errorMessage}\n`
      + `This may be a network issue, authentication problem, or API error.\n`
      + `Please check your connection and GitHub authentication: gh auth status`,
    )
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
 * Fallback to sequential lookup when batched query fails
 * Used to identify which specific users are not found
 */
async function fallbackSequentialLookup(
  owner: string,
  repo: string,
  logins: string[],
): Promise<string[]> {
  const nodeIds: string[] = []
  const notFound: string[] = []

  for (const login of logins) {
    if (login === '@me') {
      const viewerQuery = `query GetCurrentUser { viewer { id } }`
      try {
        const viewerData = await executeGraphQL(viewerQuery, {}, undefined, 'GetCurrentUser')
        if (viewerData.viewer?.id) {
          nodeIds.push(viewerData.viewer.id)
        }
        else {
          notFound.push(login)
        }
      }
      catch {
        notFound.push(login)
      }
      continue
    }

    const userQuery = `query GetUserNodeId($login: String!) { user(login: $login) { id } }`
    try {
      const userData = await executeGraphQL(userQuery, { login }, undefined, 'GetUserNodeId')
      if (userData.user?.id) {
        nodeIds.push(userData.user.id)
      }
      else {
        notFound.push(login)
      }
    }
    catch {
      notFound.push(login)
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
 * @warning This function fetches a maximum of 100 open milestones due to pagination limits.
 *          For repositories with more milestones, consider implementing pagination with `after` cursor.
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
 * @warning This function fetches a maximum of 100 repository projects and 100 organization projects
 *          due to pagination limits. For accounts with more projects, consider implementing
 *          pagination with `after` cursor.
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

  const results = projectTitles.map(title => ({ title, nodeId: projectMap.get(title) }))
  const notFound = results.filter(r => !r.nodeId).map(r => r.title)

  if (notFound.length > 0) {
    const availableProjects = allProjects.map(p => p.title).join(', ')
    throw new Error(
      `Project(s) not found: ${notFound.join(', ')}\n${
        availableProjects
          ? `Available projects: ${availableProjects}`
          : 'No projects available'}`,
    )
  }

  return results.map(r => r.nodeId!)
}
