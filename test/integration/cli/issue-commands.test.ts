/**
 * CLI Integration Tests for Issue Commands
 * Tests sub-issue and dependency management through CLI
 */

import type { GhMockRule } from '../../helpers/cli-runner'
import { afterEach, beforeEach, describe, test } from 'bun:test'
import {
  createAddBlockedByResponse,
  createAddSubIssueResponse,
  createGetIssueNodeIdResponse,
  createListBlockedByResponse,
  createListSubIssuesResponse,
  createRemoveBlockedByResponse,
  createRemoveSubIssueResponse,
  createSubIssueResponse,
  ghCliResponses,
  mockBlockedIssue,
  mockBlockingIssue,
  mockChildIssue,
  mockParentIssue,
} from '../../fixtures/github-responses'
import {
  assertExitCode,
  assertOutputContains,
  createGhMock,

  runCli,
  runCliExpectFailure,
  runCliExpectSuccess,
} from '../../helpers/cli-runner'

describe('Issue Commands - CLI Integration', () => {
  let cleanupMock: (() => Promise<void>) | null = null
  let mockGhPath: string | null = null

  beforeEach(async () => {
    // Setup comprehensive mock for issue commands
    const mockRules: GhMockRule[] = [
      // Mock repo view
      {
        args: ['repo', 'view', '--json', 'owner,name'],
        response: {
          stdout: ghCliResponses.repoView,
          exitCode: 0,
        },
      },
      // Mock GraphQL queries - Get Issue Node ID
      {
        args: /getIssueNodeId.*"number":100/,
        response: {
          stdout: JSON.stringify(
            createGetIssueNodeIdResponse(mockParentIssue.number, mockParentIssue.nodeId),
          ),
          exitCode: 0,
        },
      },
      {
        args: /getIssueNodeId.*"number":101/,
        response: {
          stdout: JSON.stringify(
            createGetIssueNodeIdResponse(mockChildIssue.number, mockChildIssue.nodeId),
          ),
          exitCode: 0,
        },
      },
      {
        args: /getIssueNodeId.*"number":200/,
        response: {
          stdout: JSON.stringify(
            createGetIssueNodeIdResponse(mockBlockingIssue.number, mockBlockingIssue.nodeId),
          ),
          exitCode: 0,
        },
      },
      {
        args: /getIssueNodeId.*"number":201/,
        response: {
          stdout: JSON.stringify(
            createGetIssueNodeIdResponse(mockBlockedIssue.number, mockBlockedIssue.nodeId),
          ),
          exitCode: 0,
        },
      },
      // Mock GraphQL mutations - Sub-issues
      {
        args: /createSubIssue/,
        response: {
          stdout: JSON.stringify(
            createSubIssueResponse(mockParentIssue.nodeId, 'New Sub-issue', 102, 'I_kwDOABCDEF102000'),
          ),
          exitCode: 0,
        },
      },
      {
        args: /addSubIssue/,
        response: {
          stdout: JSON.stringify(
            createAddSubIssueResponse(mockParentIssue.nodeId, mockChildIssue.nodeId),
          ),
          exitCode: 0,
        },
      },
      {
        args: /removeSubIssue/,
        response: {
          stdout: JSON.stringify(
            createRemoveSubIssueResponse(mockParentIssue.nodeId, mockChildIssue.nodeId),
          ),
          exitCode: 0,
        },
      },
      // Mock GraphQL queries - List Sub-issues
      {
        args: /subIssues.*first/,
        response: {
          stdout: JSON.stringify(
            createListSubIssuesResponse([
              { number: 101, title: 'Child Issue', state: 'OPEN', nodeId: mockChildIssue.nodeId },
              { number: 102, title: 'New Sub-issue', state: 'OPEN', nodeId: 'I_kwDOABCDEF102000' },
            ]),
          ),
          exitCode: 0,
        },
      },
      // Mock GraphQL mutations - Dependencies
      {
        args: /addBlockedBy/,
        response: {
          stdout: JSON.stringify(
            createAddBlockedByResponse(
              mockBlockedIssue.nodeId,
              mockBlockingIssue.nodeId,
              mockBlockingIssue.number,
              mockBlockingIssue.title,
            ),
          ),
          exitCode: 0,
        },
      },
      {
        args: /removeBlockedBy/,
        response: {
          stdout: JSON.stringify(
            createRemoveBlockedByResponse(mockBlockedIssue.nodeId, mockBlockingIssue.nodeId),
          ),
          exitCode: 0,
        },
      },
      // Mock GraphQL queries - List Dependencies
      {
        args: /blockedBy.*first/,
        response: {
          stdout: JSON.stringify(
            createListBlockedByResponse([
              { number: 200, title: 'Blocking Issue', state: 'OPEN', nodeId: mockBlockingIssue.nodeId },
            ]),
          ),
          exitCode: 0,
        },
      },
    ]

    const { cleanup, mockPath } = await createGhMock(mockRules)
    cleanupMock = cleanup
    mockGhPath = mockPath
  })

  afterEach(async () => {
    if (cleanupMock) {
      await cleanupMock()
      cleanupMock = null
    }
  })

  describe('gh please issue sub-issue create', () => {
    test('should create sub-issue with title and body', async () => {
      const result = await runCliExpectSuccess([
        'issue',
        'sub-issue',
        'create',
        String(mockParentIssue.number),
        '--title',
        'New Sub-issue',
        '--body',
        'Sub-issue description',
      ], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Getting parent issue')
      assertOutputContains(result, 'Creating sub-issue')
      assertOutputContains(result, 'Sub-issue #102 created')
      assertExitCode(result, 0)
    })

    test('should create sub-issue with title only', async () => {
      const result = await runCliExpectSuccess([
        'issue',
        'sub-issue',
        'create',
        String(mockParentIssue.number),
        '--title',
        'Title Only Sub-issue',
      ], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Sub-issue #102 created')
      assertExitCode(result, 0)
    })

    test('should show help with --help flag', async () => {
      const result = await runCliExpectSuccess(['issue', 'sub-issue', 'create', '--help'], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Usage:')
      assertOutputContains(result, 'Create a new sub-issue')
      assertOutputContains(result, '--title')
    })

    test('should fail without title option', async () => {
      const result = await runCliExpectFailure([
        'issue',
        'sub-issue',
        'create',
        String(mockParentIssue.number),
      ], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'error', 'any')
      assertOutputContains(result, 'title', 'any')
    })

    test('should fail with invalid parent issue number', async () => {
      const result = await runCliExpectFailure([
        'issue',
        'sub-issue',
        'create',
        'not-a-number',
        '--title',
        'Test',
      ], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'error', 'any')
    })
  })

  describe('gh please issue sub-issue add', () => {
    test('should link existing issue as sub-issue', async () => {
      const result = await runCliExpectSuccess([
        'issue',
        'sub-issue',
        'add',
        String(mockParentIssue.number),
        String(mockChildIssue.number),
      ], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Getting parent issue')
      assertOutputContains(result, 'Getting child issue')
      assertOutputContains(result, 'Adding')
      assertOutputContains(result, 'linked as sub-issue')
      assertExitCode(result, 0)
    })

    test('should show help with --help flag', async () => {
      const result = await runCliExpectSuccess(['issue', 'sub-issue', 'add', '--help'], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Usage:')
      assertOutputContains(result, 'Add existing issue as sub-issue')
    })

    test('should fail with missing arguments', async () => {
      const result = await runCliExpectFailure(['issue', 'sub-issue', 'add'], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'error', 'any')
    })
  })

  describe('gh please issue sub-issue remove', () => {
    test('should unlink sub-issue', async () => {
      const result = await runCliExpectSuccess([
        'issue',
        'sub-issue',
        'remove',
        String(mockParentIssue.number),
        String(mockChildIssue.number),
      ], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Removing sub-issue link')
      assertOutputContains(result, 'unlinked')
      assertExitCode(result, 0)
    })

    test('should show help with --help flag', async () => {
      const result = await runCliExpectSuccess(['issue', 'sub-issue', 'remove', '--help'], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Usage:')
      assertOutputContains(result, 'Unlink sub-issue')
    })
  })

  describe('gh please issue sub-issue list', () => {
    test('should list all sub-issues', async () => {
      const result = await runCliExpectSuccess([
        'issue',
        'sub-issue',
        'list',
        String(mockParentIssue.number),
      ], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Sub-issues of')
      assertOutputContains(result, '#101')
      assertOutputContains(result, 'Child Issue')
      assertOutputContains(result, '#102')
      assertOutputContains(result, 'New Sub-issue')
      assertExitCode(result, 0)
    })

    test('should show help with --help flag', async () => {
      const result = await runCliExpectSuccess(['issue', 'sub-issue', 'list', '--help'], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Usage:')
      assertOutputContains(result, 'List all sub-issues')
    })
  })

  describe('gh please issue dependency add', () => {
    test('should add blocked-by dependency', async () => {
      const result = await runCliExpectSuccess([
        'issue',
        'dependency',
        'add',
        String(mockBlockedIssue.number),
        '--blocked-by',
        String(mockBlockingIssue.number),
      ], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Getting issue')
      assertOutputContains(result, 'Getting blocking issue')
      assertOutputContains(result, 'Adding dependency')
      assertOutputContains(result, 'blocked by')
      assertExitCode(result, 0)
    })

    test('should show help with --help flag', async () => {
      const result = await runCliExpectSuccess(['issue', 'dependency', 'add', '--help'], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Usage:')
      assertOutputContains(result, 'Add issue dependency')
      assertOutputContains(result, '--blocked-by')
    })

    test('should fail without --blocked-by option', async () => {
      const result = await runCliExpectFailure([
        'issue',
        'dependency',
        'add',
        String(mockBlockedIssue.number),
      ], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'error', 'any')
      assertOutputContains(result, 'blocked-by', 'any')
    })
  })

  describe('gh please issue dependency remove', () => {
    test('should remove blocked-by dependency', async () => {
      const result = await runCliExpectSuccess([
        'issue',
        'dependency',
        'remove',
        String(mockBlockedIssue.number),
        String(mockBlockingIssue.number),
      ], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Removing dependency')
      assertOutputContains(result, 'no longer blocked')
      assertExitCode(result, 0)
    })

    test('should show help with --help flag', async () => {
      const result = await runCliExpectSuccess(['issue', 'dependency', 'remove', '--help'], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Usage:')
      assertOutputContains(result, 'Remove issue dependency')
    })
  })

  describe('gh please issue dependency list', () => {
    test('should list all blocking issues', async () => {
      const result = await runCliExpectSuccess([
        'issue',
        'dependency',
        'list',
        String(mockBlockedIssue.number),
      ], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Dependencies blocking')
      assertOutputContains(result, '#200')
      assertOutputContains(result, 'Blocking Issue')
      assertExitCode(result, 0)
    })

    test('should show help with --help flag', async () => {
      const result = await runCliExpectSuccess(['issue', 'dependency', 'list', '--help'], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Usage:')
      assertOutputContains(result, 'List issue dependencies')
    })
  })

  describe('gh please issue (command group)', () => {
    test('should show help when no subcommand provided', async () => {
      const result = await runCli(['issue'], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Manage GitHub issues', 'any')
    })

    test('should show help with --help flag', async () => {
      const result = await runCliExpectSuccess(['issue', '--help'], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Usage:')
      assertOutputContains(result, 'sub-issue')
      assertOutputContains(result, 'dependency')
    })
  })

  describe('gh please issue sub-issue (subcommand group)', () => {
    test('should show help when no action provided', async () => {
      const result = await runCli(['issue', 'sub-issue'], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Manage sub-issues', 'any')
    })

    test('should show help with --help flag', async () => {
      const result = await runCliExpectSuccess(['issue', 'sub-issue', '--help'], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Usage:')
      assertOutputContains(result, 'create')
      assertOutputContains(result, 'add')
      assertOutputContains(result, 'remove')
      assertOutputContains(result, 'list')
    })
  })

  describe('gh please issue dependency (subcommand group)', () => {
    test('should show help when no action provided', async () => {
      const result = await runCli(['issue', 'dependency'], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Manage issue dependencies', 'any')
    })

    test('should show help with --help flag', async () => {
      const result = await runCliExpectSuccess(['issue', 'dependency', '--help'], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Usage:')
      assertOutputContains(result, 'add')
      assertOutputContains(result, 'remove')
      assertOutputContains(result, 'list')
    })
  })
})
