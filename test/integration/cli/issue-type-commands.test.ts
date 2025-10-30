/**
 * CLI Integration Tests for Issue Type Commands
 * Tests issue type management through CLI
 */

import { afterEach, beforeEach, describe, test } from 'bun:test'
import {
  createGetIssueNodeIdResponse,
  createGetRepositoryNodeIdResponse,
  createListIssueTypesResponse,
  createUpdateIssueTypeResponse,
  ghCliResponses,
  mockIssue,
  mockIssueTypes,
} from '../../fixtures/github-responses'
import {
  assertExitCode,
  assertOutputContains,
  runCliExpectFailure,
  runCliExpectSuccess,
} from '../../helpers/cli-runner'
import { createMockFromBuilder, GhMockBuilder } from '../../helpers/gh-mock-builder'

describe('Issue Type Commands - CLI Integration', () => {
  let cleanupMock: (() => Promise<void>) | null = null
  let mockGhPath: string | null = null

  beforeEach(async () => {
    // Setup comprehensive mock for issue type commands using GhMockBuilder
    // The builder automatically handles pattern ordering via ts-pattern!
    const builder = new GhMockBuilder()
      .onRepoView({ stdout: ghCliResponses.repoView, exitCode: 0 })
      .onListIssueTypes({
        stdout: JSON.stringify(createListIssueTypesResponse(mockIssueTypes)),
        exitCode: 0,
      })
      .onUpdateIssueType({
        stdout: JSON.stringify(createUpdateIssueTypeResponse(mockIssue.nodeId)),
        exitCode: 0,
      })
      .onGetIssueNodeId({
        stdout: JSON.stringify(createGetIssueNodeIdResponse(mockIssue.number, mockIssue.nodeId)),
        exitCode: 0,
      })
      .onGetRepositoryNodeId({
        stdout: JSON.stringify(createGetRepositoryNodeIdResponse('R_kwDOABCDEF')),
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

  describe('gh please issue type list', () => {
    test('should list all issue types', async () => {
      const result = await runCliExpectSuccess([
        'issue',
        'type',
        'list',
      ], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Available issue types')
      assertOutputContains(result, 'Bug')
      assertOutputContains(result, 'Feature')
      assertOutputContains(result, 'Epic')
      assertOutputContains(result, 'RED')
      assertOutputContains(result, 'GREEN')
      assertOutputContains(result, 'PURPLE')
      assertExitCode(result, 0)
    })

    test('should output JSON with --json flag', async () => {
      const result = await runCliExpectSuccess([
        'issue',
        'type',
        'list',
        '--json',
      ], {
        env: { GH_PATH: mockGhPath! },
      })

      // Should be valid JSON
      const parsed = JSON.parse(result.stdout)
      assertExitCode(result, 0)

      // Verify structure
      if (!Array.isArray(parsed)) {
        throw new TypeError('Expected JSON array')
      }
      if (parsed.length !== 3) {
        throw new Error(`Expected 3 types, got ${parsed.length}`)
      }
      if (parsed[0].name !== 'Bug') {
        throw new Error(`Expected first type to be Bug, got ${parsed[0].name}`)
      }
    })

    test('should output JSON with field selection', async () => {
      const result = await runCliExpectSuccess([
        'issue',
        'type',
        'list',
        '--json',
        'name,color',
      ], {
        env: { GH_PATH: mockGhPath! },
      })

      const parsed = JSON.parse(result.stdout)
      assertExitCode(result, 0)

      // Should only have selected fields
      if (!parsed[0].name) {
        throw new Error('Expected name field')
      }
      if (!parsed[0].color) {
        throw new Error('Expected color field')
      }
      if (parsed[0].description) {
        throw new Error('Should not have description field')
      }
      if (parsed[0].id) {
        throw new Error('Should not have id field')
      }
    })

    test('should show help with --help flag', async () => {
      const result = await runCliExpectSuccess(['issue', 'type', 'list', '--help'], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Usage:')
      assertOutputContains(result, 'List all issue types')
    })
  })

  describe('gh please issue type set', () => {
    test('should set issue type by name', async () => {
      const result = await runCliExpectSuccess([
        'issue',
        'type',
        'set',
        String(mockIssue.number),
        '--type',
        'Bug',
      ], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Setting')
      assertOutputContains(result, 'Bug')
      assertOutputContains(result, 'successfully', 'any')
      assertExitCode(result, 0)
    })

    test('should set issue type by ID', async () => {
      const result = await runCliExpectSuccess([
        'issue',
        'type',
        'set',
        String(mockIssue.number),
        '--type-id',
        mockIssueTypes[0].id,
      ], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Setting')
      assertOutputContains(result, 'successfully', 'any')
      assertExitCode(result, 0)
    })

    test('should fail with invalid type name', async () => {
      const result = await runCliExpectFailure([
        'issue',
        'type',
        'set',
        String(mockIssue.number),
        '--type',
        'InvalidType',
      ], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'not found', 'any')
      assertOutputContains(result, 'Available types', 'any')
    })

    test('should fail without type option', async () => {
      const result = await runCliExpectFailure([
        'issue',
        'type',
        'set',
        String(mockIssue.number),
      ], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'type', 'any')
      assertOutputContains(result, 'required', 'any')
    })

    test('should fail with invalid issue number', async () => {
      const result = await runCliExpectFailure([
        'issue',
        'type',
        'set',
        'not-a-number',
        '--type',
        'Bug',
      ], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Issue numbers must be valid', 'any')
    })

    test('should show help with --help flag', async () => {
      const result = await runCliExpectSuccess(['issue', 'type', 'set', '--help'], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Usage:')
      assertOutputContains(result, 'Set the issue type')
      assertOutputContains(result, '--type')
      assertOutputContains(result, '--type-id')
    })
  })

  describe('gh please issue type remove', () => {
    test('should remove issue type', async () => {
      const result = await runCliExpectSuccess([
        'issue',
        'type',
        'remove',
        String(mockIssue.number),
      ], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Removing')
      assertOutputContains(result, 'removed', 'any')
      assertExitCode(result, 0)
    })

    test('should fail with invalid issue number', async () => {
      const result = await runCliExpectFailure([
        'issue',
        'type',
        'remove',
        'not-a-number',
      ], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Issue numbers must be valid', 'any')
    })

    test('should show help with --help flag', async () => {
      const result = await runCliExpectSuccess(['issue', 'type', 'remove', '--help'], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Usage:')
      assertOutputContains(result, 'Remove the issue type')
    })
  })

  describe('gh please issue type (command group)', () => {
    test('should show help when no subcommand provided', async () => {
      // Commander shows help and exits with code 1 when no subcommand is provided
      const result = await runCliExpectFailure(['issue', 'type'], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Manage issue types', 'any')
    })

    test('should show help with --help flag', async () => {
      const result = await runCliExpectSuccess(['issue', 'type', '--help'], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Usage:')
      assertOutputContains(result, 'list')
      assertOutputContains(result, 'set')
      assertOutputContains(result, 'remove')
    })
  })
})
