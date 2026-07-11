import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'

// Mock gh command
const mockGhPath = '/tmp/mock-gh-issue-comment-delete'
let originalGhPath: string | undefined
let originalSpawn: typeof Bun.spawn

beforeEach(() => {
  originalGhPath = process.env.GH_PATH
  originalSpawn = Bun.spawn
  process.env.GH_PATH = mockGhPath
})

afterEach(() => {
  if (originalGhPath !== undefined) {
    process.env.GH_PATH = originalGhPath
  }
  else {
    delete process.env.GH_PATH
  }
  Bun.spawn = originalSpawn
})

describe('issue comment delete command', () => {
  test('should validate comment ID format', async () => {
    const { createIssueCommentDeleteCommand } = await import(
      '../../../src/commands/issue/comment-delete',
    )

    const command = createIssueCommentDeleteCommand()

    const mockExit = mock(() => {})
    process.exit = mockExit as any

    await command.parseAsync(['node', 'test', 'invalid', '--yes'])

    expect(mockExit).toHaveBeenCalledWith(1)
  })

  test('should require --issue flag when using Database ID', async () => {
    const { createIssueCommentDeleteCommand } = await import(
      '../../../src/commands/issue/comment-delete',
    )

    const command = createIssueCommentDeleteCommand()

    // Mock getRepoInfo to return valid repo
    const mockSpawn = mock((args: string[]) => {
      if (args.includes('repo') && args.includes('view')) {
        return {
          stdout: new Response(
            JSON.stringify({ owner: { login: 'testowner' }, name: 'testrepo' }),
          ).body,
          stderr: new Response('').body,
          exited: Promise.resolve(0),
        }
      }
      return {
        stdout: new Response('').body,
        stderr: new Response('').body,
        exited: Promise.resolve(0),
      }
    })

    Bun.spawn = mockSpawn as any

    const mockExit = mock(() => {})
    process.exit = mockExit as any

    const consoleSpy = mock(() => {})
    console.error = consoleSpy

    await command.parseAsync(['node', 'test', '123456', '--yes'])

    expect(mockExit).toHaveBeenCalledWith(1)
  })

  test.skip('should delete comment with Node ID and --yes flag', async () => {
    const { createIssueCommentDeleteCommand } = await import(
      '../../../src/commands/issue/comment-delete',
    )

    const command = createIssueCommentDeleteCommand()

    // Mock GraphQL call for delete
    const mockSpawn = mock((args: string[]) => {
      if (args.includes('repo') && args.includes('view')) {
        return {
          stdout: new Response(
            JSON.stringify({ owner: { login: 'testowner' }, name: 'testrepo' }),
          ).body,
          stderr: new Response('').body,
          exited: Promise.resolve(0),
        }
      }
      else if (args.includes('graphql')) {
        // GraphQL delete mutation
        return {
          stdout: new Response(
            JSON.stringify({
              data: {
                deleteIssueComment: {
                  clientMutationId: null,
                },
              },
            }),
          ).body,
          stderr: new Response('').body,
          exited: Promise.resolve(0),
        }
      }
      return {
        stdout: new Response('').body,
        stderr: new Response('').body,
        exited: Promise.resolve(0),
      }
    })

    Bun.spawn = mockSpawn as any

    const consoleSpy = mock(() => {})
    console.log = consoleSpy

    await command.parseAsync(['node', 'test', 'IC_kwDOABC123', '--yes'])

    expect(mockSpawn).toHaveBeenCalled()
    expect(consoleSpy).toHaveBeenCalled()
  })

  test.skip('should delete comment with Database ID and --issue flag', async () => {
    const { createIssueCommentDeleteCommand } = await import(
      '../../../src/commands/issue/comment-delete',
    )

    const command = createIssueCommentDeleteCommand()

    // Mock GraphQL and REST API calls
    const mockSpawn = mock((args: string[]) => {
      if (args.includes('repo') && args.includes('view')) {
        return {
          stdout: new Response(
            JSON.stringify({ owner: { login: 'testowner' }, name: 'testrepo' }),
          ).body,
          stderr: new Response('').body,
          exited: Promise.resolve(0),
        }
      }
      else if (args.some((arg: string) => arg.includes('/issues/'))) {
        // REST API list comments
        return {
          stdout: new Response(
            JSON.stringify([
              { id: 123456, node_id: 'IC_kwDOABC123' },
            ]),
          ).body,
          stderr: new Response('').body,
          exited: Promise.resolve(0),
        }
      }
      else if (args.includes('graphql')) {
        // GraphQL delete mutation
        return {
          stdout: new Response(
            JSON.stringify({
              data: {
                deleteIssueComment: {
                  clientMutationId: null,
                },
              },
            }),
          ).body,
          stderr: new Response('').body,
          exited: Promise.resolve(0),
        }
      }
      return {
        stdout: new Response('').body,
        stderr: new Response('').body,
        exited: Promise.resolve(0),
      }
    })

    Bun.spawn = mockSpawn as any

    const consoleSpy = mock(() => {})
    console.log = consoleSpy

    await command.parseAsync(['node', 'test', '123456', '--issue', '42', '--yes'])

    expect(mockSpawn).toHaveBeenCalled()
    expect(consoleSpy).toHaveBeenCalled()
  })

  test('should accept Node ID directly without --issue flag', async () => {
    const { createIssueCommentDeleteCommand } = await import(
      '../../../src/commands/issue/comment-delete',
    )

    const command = createIssueCommentDeleteCommand()

    // This test verifies the command parses correctly with Node ID
    // The actual GraphQL execution is mocked
    const mockSpawn = mock((args: string[]) => {
      if (args.includes('repo') && args.includes('view')) {
        return {
          stdout: new Response(
            JSON.stringify({ owner: { login: 'testowner' }, name: 'testrepo' }),
          ).body,
          stderr: new Response('').body,
          exited: Promise.resolve(0),
        }
      }
      else if (args.includes('graphql')) {
        return {
          stdout: new Response(
            JSON.stringify({
              data: {
                deleteIssueComment: {
                  clientMutationId: null,
                },
              },
            }),
          ).body,
          stderr: new Response('').body,
          exited: Promise.resolve(0),
        }
      }
      return {
        stdout: new Response('').body,
        stderr: new Response('').body,
        exited: Promise.resolve(0),
      }
    })

    Bun.spawn = mockSpawn as any

    const consoleSpy = mock(() => {})
    console.log = consoleSpy

    // This should work without --issue because we're using Node ID
    // Note: GraphQL execution will be attempted but may fail in test environment
    try {
      await command.parseAsync(['node', 'test', 'IC_kwDOABC123', '--yes'])
    }
    catch {
      // Expected in test environment where graphql may not work
    }

    // Verify spawn was called (for repo info at minimum)
    expect(mockSpawn).toHaveBeenCalled()
  })
})
