/**
 * CLI Integration Tests for Issue Create Command
 * Tests issue creation with type support through CLI
 */

import { afterEach, beforeEach, describe, test } from 'bun:test'
import {
  createGetRepositoryNodeIdResponse,
  createIssueWithTypeResponse,
  createListIssueTypesResponse,
  ghCliResponses,
  mockIssueTypes,
} from '../../fixtures/github-responses'
import {
  assertExitCode,
  assertOutputContains,
  runCliExpectFailure,
  runCliExpectSuccess,
} from '../../helpers/cli-runner'
import { createMockFromBuilder, GhMockBuilder } from '../../helpers/gh-mock-builder'

describe('Issue Create Command - CLI Integration', () => {
  let cleanupMock: (() => Promise<void>) | null = null
  let mockGhPath: string | null = null

  beforeEach(async () => {
    // Setup comprehensive mock for issue create commands using GhMockBuilder
    const builder = new GhMockBuilder()
      .onRepoView({ stdout: ghCliResponses.repoView, exitCode: 0 })
      .onGetRepositoryNodeId({
        stdout: JSON.stringify(createGetRepositoryNodeIdResponse('R_kwDOABCDEF')),
        exitCode: 0,
      })
      .onListIssueTypes({
        stdout: JSON.stringify(createListIssueTypesResponse(mockIssueTypes)),
        exitCode: 0,
      })
      .onCreateIssueWithType({
        stdout: JSON.stringify(createIssueWithTypeResponse(124, 'I_kwDOABCDEF124000', 'New Issue')),
        exitCode: 0,
      })

    const { cleanup, mockPath } = await createMockFromBuilder(builder)
    cleanupMock = cleanup
    mockGhPath = mockPath
  })

  afterEach(async () => {
    if (cleanupMock) {
      await cleanupMock()
      cleanupMock = null
    }
  })

  describe('gh please issue create', () => {
    test('should create issue with valid type name', async () => {
      const result = await runCliExpectSuccess([
        'issue',
        'create',
        '--title',
        'Fix login bug',
        '--body',
        'Users cannot login',
        '--type',
        'Bug',
      ], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'created', 'any')
      assertOutputContains(result, '124')
      assertExitCode(result, 0)
    })

    test('should create issue with type-id', async () => {
      const result = await runCliExpectSuccess([
        'issue',
        'create',
        '--title',
        'Add dark mode',
        '--type-id',
        mockIssueTypes[1].id, // Feature
      ], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'created', 'any')
      assertOutputContains(result, '124') // Mock returns 124
      assertExitCode(result, 0)
    })

    test('should create issue without type', async () => {
      const result = await runCliExpectSuccess([
        'issue',
        'create',
        '--title',
        'Simple issue',
        '--body',
        'No type assigned',
      ], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'created', 'any')
      assertOutputContains(result, '124') // Mock returns 124
      assertExitCode(result, 0)
    })

    test('should output JSON with --json flag', async () => {
      const result = await runCliExpectSuccess([
        'issue',
        'create',
        '--title',
        'Fix login bug',
        '--type',
        'Bug',
        '--json',
      ], {
        env: { GH_PATH: mockGhPath! },
      })

      // Should be valid JSON
      const parsed = JSON.parse(result.stdout)
      assertExitCode(result, 0)

      // Verify structure
      if (!parsed.number) {
        throw new Error('Expected number field in JSON output')
      }
      if (!parsed.url) {
        throw new Error('Expected url field in JSON output')
      }
      if (parsed.number !== 124) {
        throw new Error(`Expected issue #124, got #${parsed.number}`)
      }
    })

    test('should fail with invalid type name', async () => {
      const result = await runCliExpectFailure([
        'issue',
        'create',
        '--title',
        'Test Issue',
        '--type',
        'InvalidType',
      ], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'not found', 'any')
      assertOutputContains(result, 'Available types', 'any')
    })

    test('should fail without title', async () => {
      const result = await runCliExpectFailure([
        'issue',
        'create',
        '--body',
        'Some body',
      ], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'title', 'any')
      assertOutputContains(result, 'required', 'any')
    })

    test('should show help with --help flag', async () => {
      const result = await runCliExpectSuccess(['issue', 'create', '--help'], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Usage:')
      assertOutputContains(result, 'Create a new issue')
      assertOutputContains(result, '--title')
      assertOutputContains(result, '--type')
      assertOutputContains(result, '--type-id')
    })
  })
})
