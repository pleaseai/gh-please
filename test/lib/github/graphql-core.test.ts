import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test'
import { executeGraphQL } from '../../../src/lib/github/graphql-core'

describe('graphql-core', () => {
  describe('executeGraphQL', () => {
    let spawnSpy: any

    beforeEach(() => {
      // Spy on Bun.spawn to capture arguments
      spawnSpy = spyOn(Bun, 'spawn').mockImplementation((_command: string[], _options: any) => {
        const stdout = new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(JSON.stringify({ data: { test: 'success' } })))
            controller.close()
          },
        })

        const stderr = new ReadableStream({
          start(controller) {
            controller.close()
          },
        })

        return {
          stdout,
          stderr,
          exited: Promise.resolve(0),
        } as any
      })
    })

    afterEach(() => {
      // Restore Bun.spawn
      spawnSpy.mockRestore()
    })

    test('should handle scalar variables correctly', async () => {
      const query = 'query Test($owner: String!, $repo: String!) { repository(owner: $owner, name: $repo) { id } }'
      const variables = {
        owner: 'test-owner',
        repo: 'test-repo',
        number: 123,
      }

      await executeGraphQL(query, variables)

      // Verify spawn was called
      expect(spawnSpy).toHaveBeenCalled()

      // Get the actual arguments passed to spawn
      const spawnCalls = spawnSpy.mock.calls
      expect(spawnCalls.length).toBeGreaterThan(0)

      const [command] = spawnCalls[0]
      const fullArgs = [...command]

      // Verify scalar variables are passed as -F 'key=value'
      expect(fullArgs).toContain('-F')
      expect(fullArgs).toContain('owner=test-owner')
      expect(fullArgs).toContain('-F')
      expect(fullArgs).toContain('repo=test-repo')
      expect(fullArgs).toContain('-F')
      expect(fullArgs).toContain('number=123')
    })

    test('should handle array variables with GitHub CLI array syntax', async () => {
      const query = 'mutation CreateIssue($labelIds: [ID!]) { createIssue(input: { labelIds: $labelIds }) { issue { id } } }'
      const variables = {
        labelIds: ['LA_kwDOABC123', 'LA_kwDODEF456', 'LA_kwDOGHI789'],
      }

      await executeGraphQL(query, variables)

      expect(spawnSpy).toHaveBeenCalled()

      const [command] = spawnSpy.mock.calls[0]
      const fullArgs = [...command]

      // Verify array items are passed as multiple -F 'key[]=value' flags
      expect(fullArgs).toContain('-F')
      expect(fullArgs).toContain('labelIds[]=LA_kwDOABC123')
      expect(fullArgs).toContain('-F')
      expect(fullArgs).toContain('labelIds[]=LA_kwDODEF456')
      expect(fullArgs).toContain('-F')
      expect(fullArgs).toContain('labelIds[]=LA_kwDOGHI789')

      // Verify NOT passed as JSON string
      expect(fullArgs.join(' ')).not.toContain('["LA_kwDOABC123"')
    })

    test('should handle empty array variables', async () => {
      const query = 'mutation CreateIssue($labelIds: [ID!]) { createIssue(input: { labelIds: $labelIds }) { issue { id } } }'
      const variables = {
        labelIds: [],
      }

      await executeGraphQL(query, variables)

      expect(spawnSpy).toHaveBeenCalled()

      const [command] = spawnSpy.mock.calls[0]
      const fullArgs = [...command]

      // Empty arrays should not add any -F flags for that variable
      expect(fullArgs.filter(arg => arg.startsWith('labelIds')).length).toBe(0)
    })

    test('should handle single-item array variables', async () => {
      const query = 'mutation CreateIssue($labelIds: [ID!]) { createIssue(input: { labelIds: $labelIds }) { issue { id } } }'
      const variables = {
        labelIds: ['LA_kwDOABC123'],
      }

      await executeGraphQL(query, variables)

      expect(spawnSpy).toHaveBeenCalled()

      const [command] = spawnSpy.mock.calls[0]
      const fullArgs = [...command]

      // Single-item arrays should still use array syntax
      expect(fullArgs).toContain('-F')
      expect(fullArgs).toContain('labelIds[]=LA_kwDOABC123')
    })

    test('should handle mixed scalar and array variables', async () => {
      const query = `
        mutation CreateIssue($repositoryId: ID!, $title: String!, $labelIds: [ID!], $assigneeIds: [ID!]) {
          createIssue(input: {
            repositoryId: $repositoryId
            title: $title
            labelIds: $labelIds
            assigneeIds: $assigneeIds
          }) {
            issue { id }
          }
        }
      `
      const variables = {
        repositoryId: 'R_kwDOABC123',
        title: 'Test Issue',
        labelIds: ['LA_kwDOABC123', 'LA_kwDODEF456'],
        assigneeIds: ['U_kwDOGHI789'],
      }

      await executeGraphQL(query, variables)

      expect(spawnSpy).toHaveBeenCalled()

      const [command] = spawnSpy.mock.calls[0]
      const fullArgs = [...command]

      // Verify scalars use key=value format
      expect(fullArgs).toContain('-F')
      expect(fullArgs).toContain('repositoryId=R_kwDOABC123')
      expect(fullArgs).toContain('-F')
      expect(fullArgs).toContain('title=Test Issue')

      // Verify arrays use key[]=value format
      expect(fullArgs).toContain('-F')
      expect(fullArgs).toContain('labelIds[]=LA_kwDOABC123')
      expect(fullArgs).toContain('-F')
      expect(fullArgs).toContain('labelIds[]=LA_kwDODEF456')
      expect(fullArgs).toContain('-F')
      expect(fullArgs).toContain('assigneeIds[]=U_kwDOGHI789')
    })

    test('should handle array of non-string values', async () => {
      const query = 'mutation Test($numbers: [Int!]) { test(input: { numbers: $numbers }) { result } }'
      const variables = {
        numbers: [1, 2, 3],
      }

      await executeGraphQL(query, variables)

      expect(spawnSpy).toHaveBeenCalled()

      const [command] = spawnSpy.mock.calls[0]
      const fullArgs = [...command]

      // Non-string items should be JSON-stringified
      expect(fullArgs).toContain('-F')
      expect(fullArgs).toContain('numbers[]=1')
      expect(fullArgs).toContain('-F')
      expect(fullArgs).toContain('numbers[]=2')
      expect(fullArgs).toContain('-F')
      expect(fullArgs).toContain('numbers[]=3')
    })

    test('should handle GraphQL-Features header when provided', async () => {
      const query = 'mutation AddSubIssue { addSubIssue { success } }'
      const variables = {}
      const features = ['sub_issues']

      await executeGraphQL(query, variables, features)

      expect(spawnSpy).toHaveBeenCalled()

      const [command] = spawnSpy.mock.calls[0]
      const fullArgs = [...command]

      // Verify GraphQL-Features header is included
      expect(fullArgs).toContain('-H')
      expect(fullArgs).toContain('GraphQL-Features: sub_issues')
    })

    test('should handle multiple GraphQL features', async () => {
      const query = 'mutation Test { test { success } }'
      const variables = {}
      const features = ['sub_issues', 'issue_types']

      await executeGraphQL(query, variables, features)

      expect(spawnSpy).toHaveBeenCalled()

      const [command] = spawnSpy.mock.calls[0]
      const fullArgs = [...command]

      // Multiple features should be comma-separated
      expect(fullArgs).toContain('-H')
      expect(fullArgs).toContain('GraphQL-Features: sub_issues, issue_types')
    })

    test('should include operationName when provided', async () => {
      const query = 'query GetIssue($number: Int!) { issue(number: $number) { id } }'
      const variables = { number: 123 }
      const operationName = 'GetIssue'

      await executeGraphQL(query, variables, undefined, operationName)

      expect(spawnSpy).toHaveBeenCalled()

      const [command] = spawnSpy.mock.calls[0]
      const fullArgs = [...command]

      // Verify operationName is included
      expect(fullArgs).toContain('-F')
      expect(fullArgs).toContain('operationName=GetIssue')
    })
  })
})
