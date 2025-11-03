import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test'
import * as ghPassthrough from '../../src/lib/gh-passthrough'
import { executeGhCommand, injectJsonFlag, isMutationCommand, passThroughCommand, shouldConvertToStructuredFormat } from '../../src/lib/gh-passthrough'

describe('gh-passthrough', () => {
  describe('executeGhCommand', () => {
    test('should execute gh CLI command and return stdout', async () => {
      // Arrange
      const args = ['--version']

      // Act
      const result = await executeGhCommand(args)

      // Assert
      expect(result.stdout).toContain('gh version')
      expect(result.exitCode).toBe(0)
    })

    test('should capture stderr when command fails', async () => {
      // Arrange
      const args = ['invalid-command-that-does-not-exist']

      // Act
      const result = await executeGhCommand(args)

      // Assert
      expect(result.stderr).toBeTruthy()
      expect(result.exitCode).not.toBe(0)
    })

    test('should preserve exit code from gh CLI', async () => {
      // Arrange
      const args = ['api', 'nonexistent-endpoint']

      // Act
      const result = await executeGhCommand(args)

      // Assert
      expect(result.exitCode).not.toBe(0)
    })
  })

  describe('isMutationCommand', () => {
    test('should detect mutation commands', () => {
      // Arrange & Act & Assert
      expect(isMutationCommand(['issue', 'edit', '123'])).toBe(true)
      expect(isMutationCommand(['issue', 'create'])).toBe(true)
      expect(isMutationCommand(['pr', 'close', '456'])).toBe(true)
      expect(isMutationCommand(['pr', 'merge', '789'])).toBe(true)
      expect(isMutationCommand(['issue', 'delete', '1'])).toBe(true)
      expect(isMutationCommand(['pr', 'comment', '2', '-b', 'text'])).toBe(true)
    })

    test('should detect Phase 2.2 mutation commands', () => {
      // Arrange & Act & Assert
      expect(isMutationCommand(['label', 'create', '--name', 'bug'])).toBe(true)
      expect(isMutationCommand(['label', 'edit', 'bug', '--name', 'enhancement'])).toBe(true)
      expect(isMutationCommand(['label', 'delete', 'bug'])).toBe(true)
      expect(isMutationCommand(['variable', 'set', 'KEY', 'value'])).toBe(true)
      expect(isMutationCommand(['variable', 'delete', 'KEY'])).toBe(true)
    })

    test('should detect all mutation command verbs', () => {
      // Arrange & Act & Assert - Test all verbs in MUTATION_COMMANDS
      // Basic mutations
      expect(isMutationCommand(['issue', 'reopen', '123'])).toBe(true)
      expect(isMutationCommand(['pr', 'reopen', '456'])).toBe(true)
      expect(isMutationCommand(['issue', 'lock', '123'])).toBe(true)
      expect(isMutationCommand(['issue', 'unlock', '123'])).toBe(true)
      expect(isMutationCommand(['issue', 'pin', '123'])).toBe(true)
      expect(isMutationCommand(['issue', 'unpin', '123'])).toBe(true)
      expect(isMutationCommand(['issue', 'transfer', '123', '--repo', 'owner/other'])).toBe(true)

      // PR-specific mutations
      expect(isMutationCommand(['pr', 'approve', '456'])).toBe(true)
      expect(isMutationCommand(['pr', 'review', '456'])).toBe(true)
      expect(isMutationCommand(['pr', 'dismiss', '456'])).toBe(true)
    })

    test('should detect project mutation flags', () => {
      // Arrange & Act & Assert
      expect(isMutationCommand(['issue', 'edit', '123', '--add-project', 'Project'])).toBe(true)
      expect(isMutationCommand(['issue', 'edit', '123', '--remove-project', 'Project'])).toBe(true)
    })

    test('should NOT detect Phase 2.2 read commands as mutations', () => {
      // Arrange & Act & Assert
      expect(isMutationCommand(['label', 'list'])).toBe(false)
      expect(isMutationCommand(['secret', 'list'])).toBe(false)
      expect(isMutationCommand(['variable', 'list'])).toBe(false)
      expect(isMutationCommand(['search', 'repos', 'query'])).toBe(false)
      expect(isMutationCommand(['search', 'issues', 'query'])).toBe(false)
      expect(isMutationCommand(['search', 'prs', 'query'])).toBe(false)
      expect(isMutationCommand(['api', '/user'])).toBe(false)
    })

    test('should detect add-* and remove-* mutation commands', () => {
      // Arrange & Act & Assert
      expect(isMutationCommand(['issue', 'edit', '123', '--add-label', 'bug'])).toBe(true)
      expect(isMutationCommand(['issue', 'edit', '123', '--remove-label', 'wontfix'])).toBe(true)
      expect(isMutationCommand(['issue', 'edit', '123', '--add-assignee', '@me'])).toBe(true)
      expect(isMutationCommand(['issue', 'edit', '123', '--remove-assignee', 'user'])).toBe(true)
    })

    test('should NOT detect read commands as mutations', () => {
      // Arrange & Act & Assert
      expect(isMutationCommand(['issue', 'list'])).toBe(false)
      expect(isMutationCommand(['issue', 'view', '123'])).toBe(false)
      expect(isMutationCommand(['pr', 'list'])).toBe(false)
      expect(isMutationCommand(['pr', 'view', '456'])).toBe(false)
      expect(isMutationCommand(['repo', 'view'])).toBe(false)
      expect(isMutationCommand(['release', 'list'])).toBe(false)
      // Ensure flag values are not misinterpreted as verbs
      expect(isMutationCommand(['issue', 'list', '--author', 'create'])).toBe(false)
      // Ensure search terms are not misinterpreted as verbs
      expect(isMutationCommand(['search', 'issues', 'edit'])).toBe(false)
    })

    test('should handle empty args', () => {
      // Arrange & Act & Assert
      expect(isMutationCommand([])).toBe(false)
    })

    test('should handle single arg commands', () => {
      // Arrange & Act & Assert
      expect(isMutationCommand(['create'])).toBe(true)
      expect(isMutationCommand(['list'])).toBe(false)
    })

    test('should handle edge cases gracefully', () => {
      // Arrange & Act & Assert
      // Empty strings in args (empty strings are falsy, logic checks 'arg &&')
      expect(isMutationCommand(['issue', '', 'list'])).toBe(false)
      expect(isMutationCommand(['', 'create'])).toBe(true) // position 1 has 'create'
      expect(isMutationCommand(['issue', '', 'edit'])).toBe(false) // 'edit' at position 2, not checked

      // Multiple mutation flags
      expect(isMutationCommand([
        'issue',
        'edit',
        '123',
        '--add-label',
        'bug',
        '--remove-label',
        'wontfix',
        '--add-assignee',
        '@me',
      ])).toBe(true)

      // Mutation verb at different positions (should only check 0-1)
      expect(isMutationCommand(['workflow', 'delete', 'workflow.yml'])).toBe(true)
      expect(isMutationCommand(['codespace', 'edit', 'name'])).toBe(true)
    })

    test('should detect Phase 2.3 codespace mutation commands', () => {
      // Arrange & Act & Assert
      expect(isMutationCommand(['codespace', 'create', '--repo', 'owner/repo'])).toBe(true)
      expect(isMutationCommand(['codespace', 'delete', 'name'])).toBe(true)
      expect(isMutationCommand(['codespace', 'edit', 'name', '--display-name', 'New'])).toBe(true)
      expect(isMutationCommand(['codespace', 'stop', 'name'])).toBe(true)
      expect(isMutationCommand(['codespace', 'rebuild', 'name'])).toBe(true)
    })

    test('should NOT detect Phase 2.3 codespace read commands as mutations', () => {
      // Arrange & Act & Assert
      expect(isMutationCommand(['codespace', 'list'])).toBe(false)
      expect(isMutationCommand(['codespace', 'view'])).toBe(false)
      expect(isMutationCommand(['codespace', 'logs', 'name'])).toBe(false)
    })

    test('should detect Phase 2.1 GitHub Actions mutation commands', () => {
      // Arrange & Act & Assert
      expect(isMutationCommand(['workflow', 'enable', 'ci.yml'])).toBe(true)
      expect(isMutationCommand(['workflow', 'disable', 'ci.yml'])).toBe(true)
      expect(isMutationCommand(['workflow', 'run', 'ci.yml'])).toBe(true)
      expect(isMutationCommand(['run', 'cancel', '123'])).toBe(true)
      expect(isMutationCommand(['run', 'rerun', '123'])).toBe(true)
      expect(isMutationCommand(['run', 'watch', '123'])).toBe(true)
      expect(isMutationCommand(['cache', 'delete', 'cache-key'])).toBe(true)
    })

    test('should NOT detect Phase 2.1 GitHub Actions read commands as mutations', () => {
      // Arrange & Act & Assert
      expect(isMutationCommand(['workflow', 'list'])).toBe(false)
      expect(isMutationCommand(['workflow', 'view', 'ci.yml'])).toBe(false)
      expect(isMutationCommand(['run', 'list'])).toBe(false)
      expect(isMutationCommand(['run', 'view', '123'])).toBe(false)
      expect(isMutationCommand(['cache', 'list'])).toBe(false)
    })
  })

  describe('shouldConvertToStructuredFormat', () => {
    test('should detect --format toon flag', () => {
      // Arrange
      const args = ['issue', 'list', '--format', 'toon']

      // Act
      const result = shouldConvertToStructuredFormat(args)

      // Assert
      expect(result.format).toBe('toon')
      expect(result.cleanArgs).toEqual(['issue', 'list'])
    })

    test('should detect --format json flag', () => {
      // Arrange
      const args = ['pr', 'list', '--format', 'json']

      // Act
      const result = shouldConvertToStructuredFormat(args)

      // Assert
      expect(result.format).toBe('json')
      expect(result.cleanArgs).toEqual(['pr', 'list'])
    })

    test('should default to toon when no format flag present (Phase 1.1)', () => {
      // Arrange
      const args = ['repo', 'view']

      // Act
      const result = shouldConvertToStructuredFormat(args)

      // Assert
      expect(result.format).toBe('toon')
      expect(result.cleanArgs).toEqual(['repo', 'view'])
    })

    test('should NOT default to toon for mutation commands', () => {
      // Arrange & Act
      const editResult = shouldConvertToStructuredFormat(['issue', 'edit', '123'])
      const createResult = shouldConvertToStructuredFormat(['issue', 'create'])
      const closeResult = shouldConvertToStructuredFormat(['pr', 'close', '456'])
      const mergeResult = shouldConvertToStructuredFormat(['pr', 'merge', '789'])

      // Assert
      expect(editResult.format).toBeNull()
      expect(editResult.cleanArgs).toEqual(['issue', 'edit', '123'])

      expect(createResult.format).toBeNull()
      expect(createResult.cleanArgs).toEqual(['issue', 'create'])

      expect(closeResult.format).toBeNull()
      expect(closeResult.cleanArgs).toEqual(['pr', 'close', '456'])

      expect(mergeResult.format).toBeNull()
      expect(mergeResult.cleanArgs).toEqual(['pr', 'merge', '789'])
    })

    test('should still default to toon for read commands', () => {
      // Arrange & Act
      const listResult = shouldConvertToStructuredFormat(['issue', 'list'])
      const viewResult = shouldConvertToStructuredFormat(['pr', 'view', '123'])
      const statusResult = shouldConvertToStructuredFormat(['pr', 'status'])

      // Assert
      expect(listResult.format).toBe('toon')
      expect(viewResult.format).toBe('toon')
      expect(statusResult.format).toBe('toon')
    })

    test('should extract and remove format flag from args', () => {
      // Arrange
      const args = ['issue', 'list', '--state', 'open', '--format', 'toon', '--limit', '10']

      // Act
      const result = shouldConvertToStructuredFormat(args)

      // Assert
      expect(result.format).toBe('toon')
      expect(result.cleanArgs).toEqual(['issue', 'list', '--state', 'open', '--limit', '10'])
      expect(result.cleanArgs).not.toContain('--format')
      expect(result.cleanArgs).not.toContain('toon')
    })

    test('should handle --format=toon syntax', () => {
      // Arrange
      const args = ['issue', 'list', '--format=toon']

      // Act
      const result = shouldConvertToStructuredFormat(args)

      // Assert
      expect(result.format).toBe('toon')
      expect(result.cleanArgs).toEqual(['issue', 'list'])
    })

    test('should default to toon for invalid format values (Phase 1.1)', () => {
      // Arrange
      const args = ['issue', 'list', '--format', 'xml']

      // Act
      const result = shouldConvertToStructuredFormat(args)

      // Assert
      expect(result.format).toBe('toon')
      expect(result.cleanArgs).toEqual(['issue', 'list'])
    })

    test('should default to toon when --format at end without value (Phase 1.1)', () => {
      // Arrange
      const args = ['issue', 'list', '--format']

      // Act
      const result = shouldConvertToStructuredFormat(args)

      // Assert
      expect(result.format).toBe('toon')
      expect(result.cleanArgs).toEqual(['issue', 'list'])
    })

    test('should handle multiple --format flags (last wins)', () => {
      // Arrange
      const args = ['issue', 'list', '--format', 'json', '--format', 'toon']

      // Act
      const result = shouldConvertToStructuredFormat(args)

      // Assert
      expect(result.format).toBe('toon')
      expect(result.cleanArgs).toEqual(['issue', 'list'])
    })

    test('should detect --format table flag (Phase 1.1)', () => {
      // Arrange
      const args = ['issue', 'list', '--format', 'table']

      // Act
      const result = shouldConvertToStructuredFormat(args)

      // Assert
      expect(result.format).toBe('table')
      expect(result.cleanArgs).toEqual(['issue', 'list'])
    })

    test('should handle --format=table syntax (Phase 1.1)', () => {
      // Arrange
      const args = ['repo', 'view', '--format=table']

      // Act
      const result = shouldConvertToStructuredFormat(args)

      // Assert
      expect(result.format).toBe('table')
      expect(result.cleanArgs).toEqual(['repo', 'view'])
    })

    test('should extract and remove --format table from args (Phase 1.1)', () => {
      // Arrange
      const args = ['issue', 'list', '--state', 'open', '--format', 'table', '--limit', '10']

      // Act
      const result = shouldConvertToStructuredFormat(args)

      // Assert
      expect(result.format).toBe('table')
      expect(result.cleanArgs).toEqual(['issue', 'list', '--state', 'open', '--limit', '10'])
      expect(result.cleanArgs).not.toContain('--format')
      expect(result.cleanArgs).not.toContain('table')
    })

    // Phase 1.5: Query support tests
    test('should extract --query flag (Phase 1.5)', () => {
      // Arrange
      const args = ['release', 'list', '--query', '[?isDraft]']

      // Act
      const result = shouldConvertToStructuredFormat(args)

      // Assert
      expect(result.query).toBe('[?isDraft]')
      expect(result.cleanArgs).toEqual(['release', 'list'])
      expect(result.cleanArgs).not.toContain('--query')
    })

    test('should extract --query=value syntax (Phase 1.5)', () => {
      // Arrange
      const args = ['release', 'list', '--query=[?isLatest]']

      // Act
      const result = shouldConvertToStructuredFormat(args)

      // Assert
      expect(result.query).toBe('[?isLatest]')
      expect(result.cleanArgs).toEqual(['release', 'list'])
    })

    test('should handle both --format and --query flags (Phase 1.5)', () => {
      // Arrange
      const args = ['release', 'list', '--format', 'toon', '--query', '[?isDraft]']

      // Act
      const result = shouldConvertToStructuredFormat(args)

      // Assert
      expect(result.format).toBe('toon')
      expect(result.query).toBe('[?isDraft]')
      expect(result.cleanArgs).toEqual(['release', 'list'])
    })

    test('should handle complex JMESPath query (Phase 1.5)', () => {
      // Arrange
      const args = ['release', 'list', '--query', '[?state==\'OPEN\'].{number:number,title:title}']

      // Act
      const result = shouldConvertToStructuredFormat(args)

      // Assert
      expect(result.query).toBe('[?state==\'OPEN\'].{number:number,title:title}')
      expect(result.cleanArgs).toEqual(['release', 'list'])
    })

    test('should extract query with other flags present (Phase 1.5)', () => {
      // Arrange
      const args = ['release', 'list', '--limit', '10', '--query', '[?isDraft]', '--state', 'open']

      // Act
      const result = shouldConvertToStructuredFormat(args)

      // Assert
      expect(result.query).toBe('[?isDraft]')
      expect(result.cleanArgs).toEqual(['release', 'list', '--limit', '10', '--state', 'open'])
    })

    test('should return undefined query when not provided (Phase 1.5)', () => {
      // Arrange
      const args = ['release', 'list', '--format', 'toon']

      // Act
      const result = shouldConvertToStructuredFormat(args)

      // Assert
      expect(result.query).toBeUndefined()
      expect(result.format).toBe('toon')
    })

    test('should handle multiple --query flags (last wins) (Phase 1.5)', () => {
      // Arrange
      const args = ['release', 'list', '--query', '[?isDraft]', '--query', '[?isLatest]']

      // Act
      const result = shouldConvertToStructuredFormat(args)

      // Assert
      expect(result.query).toBe('[?isLatest]')
      expect(result.cleanArgs).toEqual(['release', 'list'])
    })
  })

  describe('injectJsonFlag', () => {
    test('should inject --json with fields for list commands', () => {
      // Arrange
      const args = ['issue', 'list', '--state', 'open']

      // Act
      const result = injectJsonFlag(args)

      // Assert - More robust: find --json index and verify structure
      const jsonIndex = result.indexOf('--json')
      expect(jsonIndex).not.toBe(-1)
      expect(result.slice(0, jsonIndex)).toEqual(args) // Original args preserved in order
      expect(result.length).toBe(args.length + 2) // --json and fields string

      const fields = result[jsonIndex + 1]
      expect(fields).toContain('assignees')
      expect(fields).toContain('author')
      expect(fields).toContain('title')
    })

    test('should inject --json with fields for mapped commands (view commands)', () => {
      // Arrange
      const args = ['issue', 'view', '123']

      // Act
      const result = injectJsonFlag(args)

      // Assert - More robust: find --json index and verify structure
      const jsonIndex = result.indexOf('--json')
      expect(jsonIndex).not.toBe(-1)
      expect(result.slice(0, jsonIndex)).toEqual(args) // Original args preserved in order
      expect(result.length).toBe(args.length + 2) // --json and fields string

      const fields = result[jsonIndex + 1]
      expect(fields).toContain('assignees')
      expect(fields).toContain('author')
      expect(fields).toContain('title')
    })

    test('should not mutate original args array', () => {
      // Arrange
      const original = ['issue', 'list']

      // Act
      const result = injectJsonFlag(original)

      // Assert - More robust: verify no mutation and correct structure
      expect(original).toEqual(['issue', 'list']) // Original unchanged
      expect(result).not.toBe(original) // Different array reference

      const jsonIndex = result.indexOf('--json')
      expect(jsonIndex).not.toBe(-1)
      expect(result.slice(0, jsonIndex)).toEqual(original)

      const fields = result[jsonIndex + 1]
      expect(fields).toContain('assignees')
    })

    test('should handle empty args array', () => {
      // Arrange
      const args: string[] = []

      // Act
      const result = injectJsonFlag(args)

      // Assert
      expect(result).toEqual(['--json'])
    })

    // Additional tests for field injection (Phase 4)
    test('should inject fields for mapped view commands (issue view)', () => {
      // Arrange
      const args = ['issue', 'view', '123']

      // Act
      const result = injectJsonFlag(args)

      // Assert
      expect(result).toContain('--json')
      expect(result[result.length - 1]).toContain('assignees')
      expect(result[result.length - 1]).toContain('author')
      expect(result[result.length - 1]).toContain('body')
      expect(result[result.length - 1]).not.toContain(' ') // No spaces in field list
    })

    test('should inject fields for mapped view commands (pr view)', () => {
      // Arrange
      const args = ['pr', 'view', '456']

      // Act
      const result = injectJsonFlag(args)

      // Assert
      expect(result).toContain('--json')
      expect(result[result.length - 1]).toContain('additions')
      expect(result[result.length - 1]).toContain('assignees')
      expect(result[result.length - 1]).toContain('baseRefName')
      expect(result[result.length - 1]).not.toContain(' ')
    })

    test('should inject fields for mapped view commands (repo view)', () => {
      // Arrange
      const args = ['repo', 'view', 'owner/repo']

      // Act
      const result = injectJsonFlag(args)

      // Assert
      expect(result).toContain('--json')
      expect(result[result.length - 1]).toContain('name')
      expect(result[result.length - 1]).toContain('owner')
      expect(result[result.length - 1]).toContain('description')
      expect(result[result.length - 1]).not.toContain(' ')
    })

    test('should fallback to --json only for release view (empty fields)', () => {
      // Arrange
      const args = ['release', 'view', 'v1.0.0']

      // Act
      const result = injectJsonFlag(args)

      // Assert - release view has empty field string, so falls back to --json only
      const jsonIndex = result.indexOf('--json')
      expect(jsonIndex).not.toBe(-1)
      expect(result.slice(0, jsonIndex)).toEqual(args)
      expect(result.length).toBe(args.length + 1) // --json only (no fields)
      expect(result[jsonIndex]).toBe('--json')
    })

    test('should fallback to --json only for release list (unmapped command)', () => {
      // Arrange
      const args = ['release', 'list', '--limit', '10']

      // Act
      const result = injectJsonFlag(args)

      // Assert - release list is not mapped, so falls back to --json only
      const jsonIndex = result.indexOf('--json')
      expect(jsonIndex).not.toBe(-1)
      expect(result.slice(0, jsonIndex)).toEqual(args)
      expect(result.length).toBe(args.length + 1) // --json only (no fields)
      expect(result[jsonIndex]).toBe('--json')
    })

    test('should inject fields for workflow list (Phase 2.1)', () => {
      // Arrange
      const args = ['workflow', 'list']

      // Act
      const result = injectJsonFlag(args)

      // Assert
      expect(result).toContain('--json')
      expect(result.length).toBe(4) // args + --json + fields
      expect(result[2]).toBe('--json')
      const fields = result[3]
      expect(fields).toContain('id')
      expect(fields).toContain('name')
      expect(fields).toContain('path')
      expect(fields).toContain('state')
    })

    test('should inject fields for run list (Phase 2.1)', () => {
      // Arrange
      const args = ['run', 'list']

      // Act
      const result = injectJsonFlag(args)

      // Assert
      expect(result).toContain('--json')
      expect(result.length).toBe(4) // args + --json + fields
      expect(result[2]).toBe('--json')
      const fields = result[3]
      expect(fields).toContain('attempt')
      expect(fields).toContain('conclusion')
      expect(fields).toContain('status')
      expect(fields).toContain('url')
    })

    test('should inject fields for cache list (Phase 2.1)', () => {
      // Arrange
      const args = ['cache', 'list']

      // Act
      const result = injectJsonFlag(args)

      // Assert
      expect(result).toContain('--json')
      expect(result.length).toBe(4) // args + --json + fields
      expect(result[2]).toBe('--json')
      const fields = result[3]
      expect(fields).toContain('createdAt')
      expect(fields).toContain('id')
      expect(fields).toContain('key')
      expect(fields).toContain('sizeInBytes')
    })

    test('should fallback to --json only for run view (requires run ID)', () => {
      // Arrange
      const args = ['run', 'view', '123']

      // Act
      const result = injectJsonFlag(args)

      // Assert
      expect(result).toContain('--json')
      expect(result.length).toBe(4) // args + --json
      expect(result[3]).toBe('--json')
    })

    test('should preserve other arguments when injecting fields', () => {
      // Arrange
      const args = ['issue', 'view', '123', '--repo', 'owner/repo']

      // Act
      const result = injectJsonFlag(args)

      // Assert
      expect(result[0]).toBe('issue')
      expect(result[1]).toBe('view')
      expect(result[2]).toBe('123')
      expect(result[3]).toBe('--repo')
      expect(result[4]).toBe('owner/repo')
      expect(result[5]).toBe('--json')
      expect(result[6]).toBeTruthy() // Fields should be present
    })

    test('should use comma-separated fields with no spaces', () => {
      // Arrange
      const args = ['issue', 'view', '1']

      // Act
      const result = injectJsonFlag(args)

      // Assert
      const fields = result[result.length - 1]
      expect(fields).not.toContain(' ')
      expect(fields).toMatch(/^[\w,]+$/) // \w matches uppercase/lowercase letters, digits, and underscores; appropriate for camelCase field names. Only word characters and commas.
    })
  })

  describe('passThroughCommand', () => {
    let executeGhCommandSpy: ReturnType<typeof spyOn>
    let consoleErrorSpy: ReturnType<typeof spyOn>
    let processExitSpy: ReturnType<typeof spyOn>
    let processStdoutWriteSpy: ReturnType<typeof spyOn>

    beforeEach(() => {
      // Mock console.error to suppress error output during tests
      consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {})
      // Mock process.exit to prevent test termination
      processExitSpy = spyOn(process, 'exit').mockImplementation((() => {}) as any)
      // Mock process.stdout.write to capture output
      processStdoutWriteSpy = spyOn(process.stdout, 'write').mockImplementation(() => true)
    })

    afterEach(() => {
      executeGhCommandSpy?.mockRestore()
      consoleErrorSpy.mockRestore()
      processExitSpy.mockRestore()
      processStdoutWriteSpy.mockRestore()
    })

    test('should convert to TOON format when --format toon flag present', async () => {
      // Arrange
      const mockJsonOutput = JSON.stringify([
        { number: 1, title: 'Issue 1', state: 'OPEN' },
        { number: 2, title: 'Issue 2', state: 'CLOSED' },
      ])
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: mockJsonOutput,
        stderr: '',
        exitCode: 0,
      })

      const args = ['issue', 'list', '--format', 'toon']

      // Act
      await passThroughCommand(args)

      // Assert - list commands now have field mappings
      const callArgs = executeGhCommandSpy.mock.calls[0][0]
      expect(callArgs[0]).toBe('issue')
      expect(callArgs[1]).toBe('list')
      expect(callArgs[2]).toBe('--json')
      expect(callArgs[3]).toContain('assignees') // Should have fields
      expect(processExitSpy).not.toHaveBeenCalled()
    })

    test('should convert to JSON format when --format json flag present', async () => {
      // Arrange
      const mockJsonOutput = JSON.stringify({ name: 'test-repo', owner: 'test-owner' })
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: mockJsonOutput,
        stderr: '',
        exitCode: 0,
      })

      const args = ['repo', 'view', '--format', 'json']

      // Act
      await passThroughCommand(args)

      // Assert - repo view should now inject fields from GH_JSON_FIELDS
      expect(executeGhCommandSpy).toHaveBeenCalledTimes(1)
      const callArgs = executeGhCommandSpy.mock.calls[0][0]
      expect(callArgs[0]).toBe('repo')
      expect(callArgs[1]).toBe('view')
      expect(callArgs[2]).toBe('--json')
      expect(callArgs[3]).toContain('archivedAt') // Should contain repo view fields
      expect(processExitSpy).not.toHaveBeenCalled()
    })

    test('should convert to TOON by default when no format flag present (Phase 1.1)', async () => {
      // Arrange
      const mockJsonOutput = JSON.stringify({ name: 'test-repo', owner: 'test-owner', stars: 100 })
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: mockJsonOutput,
        stderr: '',
        exitCode: 0,
      })

      const args = ['repo', 'view']

      // Act
      await passThroughCommand(args)

      // Assert - Should inject fields for repo view
      const callArgs = executeGhCommandSpy.mock.calls[0][0]
      expect(callArgs[0]).toBe('repo')
      expect(callArgs[1]).toBe('view')
      expect(callArgs[2]).toBe('--json')
      expect(callArgs[3]).toContain('archivedAt') // Should contain repo view fields
      expect(processExitSpy).not.toHaveBeenCalled()
    })

    test('should preserve original output when --format table flag present (Phase 1.1)', async () => {
      // Arrange
      const mockOutput = 'Repository: test-owner/test-repo\nStars: 100'
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: mockOutput,
        stderr: '',
        exitCode: 0,
      })

      const args = ['repo', 'view', '--format', 'table']

      // Act
      await passThroughCommand(args)

      // Assert
      expect(executeGhCommandSpy).toHaveBeenCalledWith(['repo', 'view'])
      expect(processStdoutWriteSpy).toHaveBeenCalledWith(mockOutput)
      expect(consoleErrorSpy).toHaveBeenCalled() // Deprecation warning
      expect(processExitSpy).not.toHaveBeenCalled()
    })

    test('should handle JSON parse failures with helpful error message', async () => {
      // Arrange
      const invalidJson = 'not valid json output'
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: invalidJson,
        stderr: '',
        exitCode: 0,
      })

      const args = ['issue', 'list', '--format', 'toon']

      // Act
      await passThroughCommand(args)

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled()
      // Check for JSON parse error message
      expect(consoleErrorSpy.mock.calls.some((call: any[]) =>
        call.some((arg: any) => typeof arg === 'string' && arg.includes('JSON')),
      )).toBe(true)
      expect(processExitSpy).toHaveBeenCalledWith(1)
    })

    test('should handle --json not supported error with helpful message', async () => {
      // Arrange
      const errorMessage = 'unknown flag: --json'
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: '',
        stderr: errorMessage,
        exitCode: 1,
      })

      const args = ['workflow', 'run', 'test', '--format', 'toon']

      // Act
      await passThroughCommand(args)

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled()
      // Check for --json not supported message
      expect(consoleErrorSpy.mock.calls.some((call: any[]) =>
        call.some((arg: any) =>
          typeof arg === 'string'
          && (arg.includes('not support') || arg.includes('지원하지 않습니다')),
        ),
      )).toBe(true)
      expect(processExitSpy).toHaveBeenCalledWith(1)
    })

    test('should handle fields required error when command not mapped', async () => {
      // Arrange
      const errorMessage = 'Specify one or more comma-separated fields for `--json`:\nassignees\nauthor\nbody\ncreatedAt'
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: '',
        stderr: errorMessage,
        exitCode: 1,
      })

      const args = ['custom', 'view', '123', '--format', 'toon']

      // Act
      await passThroughCommand(args)

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled()
      // Check for fields required message (language-agnostic check)
      const allErrorOutput = consoleErrorSpy.mock.calls.flat().join(' ')
      expect(allErrorOutput).toMatch(/field mapping|필드 매핑/)
      // Should show available fields header
      expect(allErrorOutput).toContain('Available fields')
      // Should suggest running update-fields
      expect(allErrorOutput).toContain('update-fields')
      expect(processExitSpy).toHaveBeenCalledWith(1)
    })

    test('should distinguish between fields required and json not supported errors', async () => {
      // Arrange - Fields required error
      const fieldsRequiredError = 'Specify one or more comma-separated fields for `--json`:\nfield1\nfield2'
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: '',
        stderr: fieldsRequiredError,
        exitCode: 1,
      })

      const args1 = ['unmapped', 'view', '123', '--format', 'toon']

      // Act
      await passThroughCommand(args1)

      // Assert - Should show fields required message
      const fieldsOutput = consoleErrorSpy.mock.calls.flat().join(' ')
      expect(fieldsOutput).toMatch(/field mapping|필드 매핑/)
      expect(fieldsOutput).not.toMatch(/not support|지원하지 않습니다/)

      // Reset spies
      consoleErrorSpy.mockClear()
      processExitSpy.mockClear()

      // Arrange - JSON not supported error
      const jsonNotSupportedError = 'unknown flag: --json'
      executeGhCommandSpy.mockResolvedValue({
        stdout: '',
        stderr: jsonNotSupportedError,
        exitCode: 1,
      })

      const args2 = ['workflow', 'run', 'test', '--format', 'toon']

      // Act
      await passThroughCommand(args2)

      // Assert - Should show json not supported message
      const jsonOutput = consoleErrorSpy.mock.calls.flat().join(' ')
      expect(jsonOutput).toMatch(/not support|지원하지 않습니다/)
      expect(jsonOutput).not.toMatch(/field mapping|필드 매핑/)
    })

    test('should pass through gh CLI errors when using --format table (Phase 1.1)', async () => {
      // Arrange
      const errorMessage = 'API error: resource not found'
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: '',
        stderr: errorMessage,
        exitCode: 1,
      })

      const processStderrWriteSpy = spyOn(process.stderr, 'write').mockImplementation(() => true)
      const args = ['api', 'nonexistent-endpoint', '--format', 'table']

      // Act
      await passThroughCommand(args)

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled() // Deprecation warning
      expect(processStderrWriteSpy).toHaveBeenCalledWith(errorMessage)
      expect(processExitSpy).toHaveBeenCalledWith(1)

      processStderrWriteSpy.mockRestore()
    })

    test('should handle empty JSON output gracefully', async () => {
      // Arrange
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: '',
        stderr: '',
        exitCode: 0,
      })

      const args = ['issue', 'list', '--format', 'toon']

      // Act
      await passThroughCommand(args)

      // Assert - list commands now have field mappings
      const callArgs = executeGhCommandSpy.mock.calls[0][0]
      expect(callArgs[0]).toBe('issue')
      expect(callArgs[1]).toBe('list')
      expect(callArgs[2]).toBe('--json')
      expect(callArgs[3]).toContain('assignees') // Should have fields
      expect(processExitSpy).not.toHaveBeenCalled()
      // Empty output should not cause parse error
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    // Integration tests for field injection with TOON/JSON conversion (Phase 4)
    test('should inject fields and convert to TOON for issue view', async () => {
      // Arrange
      const mockJsonOutput = JSON.stringify({
        number: 123,
        title: 'Test Issue',
        author: { login: 'testuser' },
        state: 'OPEN',
        body: 'Test body',
      })
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: mockJsonOutput,
        stderr: '',
        exitCode: 0,
      })

      const args = ['issue', 'view', '123', '--format', 'toon']

      // Act
      await passThroughCommand(args)

      // Assert
      const callArgs = executeGhCommandSpy.mock.calls[0][0]
      expect(callArgs[0]).toBe('issue')
      expect(callArgs[1]).toBe('view')
      expect(callArgs[2]).toBe('123')
      expect(callArgs[3]).toBe('--json')
      expect(callArgs[4]).toContain('assignees')
      expect(callArgs[4]).toContain('author')
      expect(processExitSpy).not.toHaveBeenCalled()
    })

    test('should inject fields and convert to JSON for pr view', async () => {
      // Arrange
      const mockJsonOutput = JSON.stringify({
        number: 456,
        title: 'Test PR',
        additions: 10,
        deletions: 5,
        state: 'OPEN',
      })
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: mockJsonOutput,
        stderr: '',
        exitCode: 0,
      })

      const args = ['pr', 'view', '456', '--format', 'json']

      // Act
      await passThroughCommand(args)

      // Assert
      const callArgs = executeGhCommandSpy.mock.calls[0][0]
      expect(callArgs[0]).toBe('pr')
      expect(callArgs[1]).toBe('view')
      expect(callArgs[2]).toBe('456')
      expect(callArgs[3]).toBe('--json')
      expect(callArgs[4]).toContain('additions')
      expect(callArgs[4]).toContain('deletions')
      expect(processExitSpy).not.toHaveBeenCalled()
    })

    test('should convert list commands to TOON with field injection', async () => {
      // Arrange
      const mockJsonOutput = JSON.stringify([
        { number: 1, title: 'Issue 1' },
        { number: 2, title: 'Issue 2' },
      ])
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: mockJsonOutput,
        stderr: '',
        exitCode: 0,
      })

      const args = ['issue', 'list', '--format', 'toon']

      // Act
      await passThroughCommand(args)

      // Assert - list commands now have field mappings
      const callArgs = executeGhCommandSpy.mock.calls[0][0]
      expect(callArgs[0]).toBe('issue')
      expect(callArgs[1]).toBe('list')
      expect(callArgs[2]).toBe('--json')
      expect(callArgs[3]).toContain('assignees') // Fields are injected for list commands
      expect(callArgs.length).toBe(4)
      expect(processExitSpy).not.toHaveBeenCalled()
    })

    test('should detect fields required error for unmapped view commands', async () => {
      // Arrange
      const errorMessage = 'Specify one or more comma-separated fields for `--json`:\nfield1\nfield2\nfield3'
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: '',
        stderr: errorMessage,
        exitCode: 1,
      })

      const args = ['label', 'view', 'bug', '--format', 'toon']

      // Act
      await passThroughCommand(args)

      // Assert
      const allErrorOutput = consoleErrorSpy.mock.calls.flat().join(' ')
      expect(allErrorOutput).toMatch(/field mapping|필드 매핑/)
      expect(allErrorOutput).toContain('Available fields')
      expect(allErrorOutput).toContain('update-fields')
      expect(processExitSpy).toHaveBeenCalledWith(1)
    })

    test('should detect --json not supported error', async () => {
      // Arrange
      const errorMessage = 'unknown flag: --json\nUsage: gh workflow run <name>'
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: '',
        stderr: errorMessage,
        exitCode: 1,
      })

      const args = ['workflow', 'run', 'test', '--format', 'toon']

      // Act
      await passThroughCommand(args)

      // Assert
      const allErrorOutput = consoleErrorSpy.mock.calls.flat().join(' ')
      expect(allErrorOutput).toMatch(/not support|지원하지 않습니다/)
      expect(allErrorOutput).toContain('Troubleshooting')
      expect(processExitSpy).toHaveBeenCalledWith(1)
    })

    test('should handle TOON conversion with nested objects in injected fields', async () => {
      // Arrange
      const mockJsonOutput = JSON.stringify({
        number: 789,
        title: 'Complex Issue',
        author: { login: 'user1', email: 'user1@example.com' },
        assignees: [
          { login: 'assignee1' },
          { login: 'assignee2' },
        ],
      })
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: mockJsonOutput,
        stderr: '',
        exitCode: 0,
      })

      const args = ['issue', 'view', '789', '--format', 'toon']

      // Act
      await passThroughCommand(args)

      // Assert
      const callArgs = executeGhCommandSpy.mock.calls[0][0]
      expect(callArgs[4]).toContain('assignees')
      expect(callArgs[4]).toContain('author')
      expect(processExitSpy).not.toHaveBeenCalled()
    })

    test('should handle JSON conversion with array data in injected fields (Phase 2.1)', async () => {
      // Arrange
      const mockJsonOutput = JSON.stringify([
        { id: 1, name: 'Workflow 1', state: 'active' },
        { id: 2, name: 'Workflow 2', state: 'disabled' },
        { id: 3, name: 'Workflow 3', state: 'active' },
      ])
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: mockJsonOutput,
        stderr: '',
        exitCode: 0,
      })

      const args = ['workflow', 'list', '--format', 'json']

      // Act
      await passThroughCommand(args)

      // Assert - workflow list now has field mappings
      const callArgs = executeGhCommandSpy.mock.calls[0][0]
      expect(callArgs[0]).toBe('workflow')
      expect(callArgs[1]).toBe('list')
      expect(callArgs[2]).toBe('--json')
      expect(callArgs[3]).toContain('id')
      expect(callArgs[3]).toContain('name')
      expect(callArgs[3]).toContain('state')
      expect(processExitSpy).not.toHaveBeenCalled()
    })

    // Phase 1.1: Deprecation warning tests
    test('should show deprecation warning when using --format table (Phase 1.1)', async () => {
      // Arrange
      const mockOutput = 'Issue #1\nIssue #2'
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: mockOutput,
        stderr: '',
        exitCode: 0,
      })

      const args = ['issue', 'list', '--format', 'table']

      // Act
      await passThroughCommand(args)

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled()
      const errorCalls = consoleErrorSpy.mock.calls.flat().join(' ')
      expect(errorCalls).toMatch(/deprecated|더 이상 사용되지 않습니다/)
      expect(errorCalls).toMatch(/--format table/)
      expect(processStdoutWriteSpy).toHaveBeenCalledWith(mockOutput)
      expect(processExitSpy).not.toHaveBeenCalled()
    })

    test('should not show deprecation warning for TOON format (Phase 1.1)', async () => {
      // Arrange
      const mockJsonOutput = JSON.stringify([{ number: 1, title: 'Issue 1' }])
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: mockJsonOutput,
        stderr: '',
        exitCode: 0,
      })

      const args = ['issue', 'list', '--format', 'toon']

      // Act
      await passThroughCommand(args)

      // Assert
      expect(consoleErrorSpy).not.toHaveBeenCalled()
      expect(processExitSpy).not.toHaveBeenCalled()
    })

    test('should not show deprecation warning for JSON format (Phase 1.1)', async () => {
      // Arrange
      const mockJsonOutput = JSON.stringify([{ number: 1, title: 'Issue 1' }])
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: mockJsonOutput,
        stderr: '',
        exitCode: 0,
      })

      const args = ['issue', 'list', '--format', 'json']

      // Act
      await passThroughCommand(args)

      // Assert
      expect(consoleErrorSpy).not.toHaveBeenCalled()
      expect(processExitSpy).not.toHaveBeenCalled()
    })

    test('should not show deprecation warning for default TOON (Phase 1.1)', async () => {
      // Arrange
      const mockJsonOutput = JSON.stringify([{ number: 1, title: 'Issue 1' }])
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: mockJsonOutput,
        stderr: '',
        exitCode: 0,
      })

      const args = ['issue', 'list']

      // Act
      await passThroughCommand(args)

      // Assert
      expect(consoleErrorSpy).not.toHaveBeenCalled()
      expect(processExitSpy).not.toHaveBeenCalled()
    })

    test('should handle --format table with errors (Phase 1.1)', async () => {
      // Arrange
      const errorMessage = 'API error: resource not found'
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: '',
        stderr: errorMessage,
        exitCode: 1,
      })

      const processStderrWriteSpy = spyOn(process.stderr, 'write').mockImplementation(() => true)
      const args = ['api', 'nonexistent-endpoint', '--format', 'table']

      // Act
      await passThroughCommand(args)

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled() // Deprecation warning
      expect(processStderrWriteSpy).toHaveBeenCalledWith(errorMessage)
      expect(processExitSpy).toHaveBeenCalledWith(1)

      processStderrWriteSpy.mockRestore()
    })

    // Phase 2.2 Integration Tests
    test('should not inject --json for label create mutation command (Phase 2.2)', async () => {
      // Arrange
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: 'Created label "bug"',
        stderr: '',
        exitCode: 0,
      })

      const args = ['label', 'create', '--name', 'bug']

      // Act
      await passThroughCommand(args)

      // Assert - no --json injection for mutation commands
      const callArgs = executeGhCommandSpy.mock.calls[0][0]
      expect(callArgs).toEqual(['label', 'create', '--name', 'bug'])
      expect(callArgs).not.toContain('--json')
      expect(processExitSpy).not.toHaveBeenCalled()
    })

    test('should not inject --json for variable set mutation command (Phase 2.2)', async () => {
      // Arrange
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: 'Set variable KEY',
        stderr: '',
        exitCode: 0,
      })

      const args = ['variable', 'set', 'KEY', 'value']

      // Act
      await passThroughCommand(args)

      // Assert - no --json injection for mutation commands
      const callArgs = executeGhCommandSpy.mock.calls[0][0]
      expect(callArgs).toEqual(['variable', 'set', 'KEY', 'value'])
      expect(callArgs).not.toContain('--json')
      expect(processExitSpy).not.toHaveBeenCalled()
    })

    test('should default to TOON for variable list read command (Phase 2.2)', async () => {
      // Arrange
      const mockJsonOutput = JSON.stringify([
        { name: 'KEY1', value: 'value1' },
        { name: 'KEY2', value: 'value2' },
      ])
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: mockJsonOutput,
        stderr: '',
        exitCode: 0,
      })

      const args = ['variable', 'list']

      // Act
      await passThroughCommand(args)

      // Assert - --json injected for read commands (TOON default)
      const callArgs = executeGhCommandSpy.mock.calls[0][0]
      expect(callArgs[0]).toBe('variable')
      expect(callArgs[1]).toBe('list')
      expect(callArgs[2]).toBe('--json')
      expect(processExitSpy).not.toHaveBeenCalled()
    })

    test('should default to TOON for label list read command (Phase 2.2)', async () => {
      // Arrange
      const mockJsonOutput = JSON.stringify([
        { name: 'bug', color: 'red' },
        { name: 'enhancement', color: 'blue' },
      ])
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: mockJsonOutput,
        stderr: '',
        exitCode: 0,
      })

      const args = ['label', 'list']

      // Act
      await passThroughCommand(args)

      // Assert - --json injected for read commands
      const callArgs = executeGhCommandSpy.mock.calls[0][0]
      expect(callArgs[0]).toBe('label')
      expect(callArgs[1]).toBe('list')
      expect(callArgs[2]).toBe('--json')
      expect(processExitSpy).not.toHaveBeenCalled()
    })

    test('should default to TOON for search read commands (Phase 2.2)', async () => {
      // Arrange
      const mockJsonOutput = JSON.stringify([{ name: 'repo1' }])
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: mockJsonOutput,
        stderr: '',
        exitCode: 0,
      })

      const args = ['search', 'repos', 'query']

      // Act
      await passThroughCommand(args)

      // Assert - --json injected for read commands
      const callArgs = executeGhCommandSpy.mock.calls[0][0]
      expect(callArgs[0]).toBe('search')
      expect(callArgs[1]).toBe('repos')
      expect(callArgs[2]).toBe('query')
      expect(callArgs[3]).toBe('--json')
      expect(processExitSpy).not.toHaveBeenCalled()
    })

    // Phase 2.3 Integration Tests
    test('should fallback to --json only for codespace list (empty fields)', async () => {
      // Arrange
      const mockJsonOutput = JSON.stringify([{
        name: 'test-codespace',
        state: 'Available',
        repository: 'owner/repo',
      }])
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: mockJsonOutput,
        stderr: '',
        exitCode: 0,
      })

      const args = ['codespace', 'list', '--limit', '10']

      // Act
      await passThroughCommand(args)

      // Assert - --json injected without fields (empty field mapping)
      const callArgs = executeGhCommandSpy.mock.calls[0][0]
      expect(callArgs[0]).toBe('codespace')
      expect(callArgs[1]).toBe('list')
      expect(callArgs[2]).toBe('--limit')
      expect(callArgs[3]).toBe('10')
      expect(callArgs[4]).toBe('--json')
      expect(callArgs.length).toBe(5) // No fields parameter
      expect(processExitSpy).not.toHaveBeenCalled()
    })

    test('should fallback to --json only for codespace view (empty fields)', async () => {
      // Arrange
      const mockJsonOutput = JSON.stringify({
        name: 'test-codespace',
        state: 'Available',
        displayName: 'Test Codespace',
        repository: 'owner/repo',
      })
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: mockJsonOutput,
        stderr: '',
        exitCode: 0,
      })

      const args = ['codespace', 'view']

      // Act
      await passThroughCommand(args)

      // Assert - --json injected without fields (empty field mapping)
      const callArgs = executeGhCommandSpy.mock.calls[0][0]
      expect(callArgs[0]).toBe('codespace')
      expect(callArgs[1]).toBe('view')
      expect(callArgs[2]).toBe('--json')
      expect(callArgs.length).toBe(3) // No fields parameter
      expect(processExitSpy).not.toHaveBeenCalled()
    })

    test('should not inject --json for codespace create mutation command (Phase 2.3)', async () => {
      // Arrange
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: 'Created codespace for owner/repo',
        stderr: '',
        exitCode: 0,
      })

      const args = ['codespace', 'create', '--repo', 'owner/repo']

      // Act
      await passThroughCommand(args)

      // Assert - no --json injection for mutation commands
      const callArgs = executeGhCommandSpy.mock.calls[0][0]
      expect(callArgs).toEqual(['codespace', 'create', '--repo', 'owner/repo'])
      expect(callArgs).not.toContain('--json')
      expect(processExitSpy).not.toHaveBeenCalled()
    })

    test('should not inject --json for codespace delete mutation command (Phase 2.3)', async () => {
      // Arrange
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: 'Deleted codespace: test-codespace',
        stderr: '',
        exitCode: 0,
      })

      const args = ['codespace', 'delete', 'test-codespace']

      // Act
      await passThroughCommand(args)

      // Assert - no --json injection for mutation commands
      const callArgs = executeGhCommandSpy.mock.calls[0][0]
      expect(callArgs).toEqual(['codespace', 'delete', 'test-codespace'])
      expect(callArgs).not.toContain('--json')
      expect(processExitSpy).not.toHaveBeenCalled()
    })

    test('should not inject --json for codespace stop mutation command (Phase 2.3)', async () => {
      // Arrange
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: 'Stopped codespace: test-codespace',
        stderr: '',
        exitCode: 0,
      })

      const args = ['codespace', 'stop', 'test-codespace']

      // Act
      await passThroughCommand(args)

      // Assert - no --json injection for mutation commands
      const callArgs = executeGhCommandSpy.mock.calls[0][0]
      expect(callArgs).toEqual(['codespace', 'stop', 'test-codespace'])
      expect(callArgs).not.toContain('--json')
      expect(processExitSpy).not.toHaveBeenCalled()
    })

    test('should not inject --json for codespace rebuild mutation command (Phase 2.3)', async () => {
      // Arrange
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: 'Rebuilding codespace: test-codespace',
        stderr: '',
        exitCode: 0,
      })

      const args = ['codespace', 'rebuild', 'test-codespace']

      // Act
      await passThroughCommand(args)

      // Assert - no --json injection for mutation commands
      const callArgs = executeGhCommandSpy.mock.calls[0][0]
      expect(callArgs).toEqual(['codespace', 'rebuild', 'test-codespace'])
      expect(callArgs).not.toContain('--json')
      expect(processExitSpy).not.toHaveBeenCalled()
    })

    // Phase 2.1: GitHub Actions Integration Tests
    test('should default to TOON for workflow list (Phase 2.1)', async () => {
      // Arrange
      const mockJsonOutput = JSON.stringify([
        { id: 123, name: 'CI', path: '.github/workflows/ci.yml', state: 'active' },
        { id: 456, name: 'Release', path: '.github/workflows/release.yml', state: 'disabled' },
      ])
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: mockJsonOutput,
        stderr: '',
        exitCode: 0,
      })

      const args = ['workflow', 'list']

      // Act
      await passThroughCommand(args)

      // Assert - --json injected with fields
      const callArgs = executeGhCommandSpy.mock.calls[0][0]
      expect(callArgs[0]).toBe('workflow')
      expect(callArgs[1]).toBe('list')
      expect(callArgs[2]).toBe('--json')
      expect(callArgs[3]).toContain('id')
      expect(callArgs[3]).toContain('name')
      expect(callArgs[3]).toContain('path')
      expect(callArgs[3]).toContain('state')
      expect(processExitSpy).not.toHaveBeenCalled()
    })

    test('should default to TOON for run list (Phase 2.1)', async () => {
      // Arrange
      const mockJsonOutput = JSON.stringify([
        {
          databaseId: 123,
          displayTitle: 'Test Run',
          status: 'completed',
          conclusion: 'success',
          workflowName: 'CI',
        },
      ])
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: mockJsonOutput,
        stderr: '',
        exitCode: 0,
      })

      const args = ['run', 'list']

      // Act
      await passThroughCommand(args)

      // Assert - --json injected with fields
      const callArgs = executeGhCommandSpy.mock.calls[0][0]
      expect(callArgs[0]).toBe('run')
      expect(callArgs[1]).toBe('list')
      expect(callArgs[2]).toBe('--json')
      expect(callArgs[3]).toContain('databaseId')
      expect(callArgs[3]).toContain('displayTitle')
      expect(callArgs[3]).toContain('status')
      expect(callArgs[3]).toContain('conclusion')
      expect(processExitSpy).not.toHaveBeenCalled()
    })

    test('should default to TOON for cache list (Phase 2.1)', async () => {
      // Arrange
      const mockJsonOutput = JSON.stringify([
        {
          id: 1,
          key: 'cache-key-1',
          sizeInBytes: 1024,
          createdAt: '2025-01-01T00:00:00Z',
        },
      ])
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: mockJsonOutput,
        stderr: '',
        exitCode: 0,
      })

      const args = ['cache', 'list']

      // Act
      await passThroughCommand(args)

      // Assert - --json injected with fields
      const callArgs = executeGhCommandSpy.mock.calls[0][0]
      expect(callArgs[0]).toBe('cache')
      expect(callArgs[1]).toBe('list')
      expect(callArgs[2]).toBe('--json')
      expect(callArgs[3]).toContain('id')
      expect(callArgs[3]).toContain('key')
      expect(callArgs[3]).toContain('sizeInBytes')
      expect(callArgs[3]).toContain('createdAt')
      expect(processExitSpy).not.toHaveBeenCalled()
    })

    test('should not inject --json for workflow enable mutation command (Phase 2.1)', async () => {
      // Arrange
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: 'Enabled workflow: ci.yml',
        stderr: '',
        exitCode: 0,
      })

      const args = ['workflow', 'enable', 'ci.yml']

      // Act
      await passThroughCommand(args)

      // Assert - no --json injection for mutation commands
      const callArgs = executeGhCommandSpy.mock.calls[0][0]
      expect(callArgs).toEqual(['workflow', 'enable', 'ci.yml'])
      expect(callArgs).not.toContain('--json')
      expect(processExitSpy).not.toHaveBeenCalled()
    })

    test('should not inject --json for run cancel mutation command (Phase 2.1)', async () => {
      // Arrange
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: 'Cancelled run: 123',
        stderr: '',
        exitCode: 0,
      })

      const args = ['run', 'cancel', '123']

      // Act
      await passThroughCommand(args)

      // Assert - no --json injection for mutation commands
      const callArgs = executeGhCommandSpy.mock.calls[0][0]
      expect(callArgs).toEqual(['run', 'cancel', '123'])
      expect(callArgs).not.toContain('--json')
      expect(processExitSpy).not.toHaveBeenCalled()
    })

    test('should not inject --json for cache delete mutation command (Phase 2.1)', async () => {
      // Arrange
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: 'Deleted cache: cache-key-1',
        stderr: '',
        exitCode: 0,
      })

      const args = ['cache', 'delete', 'cache-key-1']

      // Act
      await passThroughCommand(args)

      // Assert - no --json injection for mutation commands
      const callArgs = executeGhCommandSpy.mock.calls[0][0]
      expect(callArgs).toEqual(['cache', 'delete', 'cache-key-1'])
      expect(callArgs).not.toContain('--json')
      expect(processExitSpy).not.toHaveBeenCalled()
    })
  })

  // Phase 1.5: Integration tests for query execution
  describe('Query Integration Tests (Phase 1.5)', () => {
    let executeGhCommandSpy: ReturnType<typeof spyOn>
    let processExitSpy: ReturnType<typeof spyOn>
    let consoleErrorSpy: ReturnType<typeof spyOn>

    beforeEach(() => {
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand')
      processExitSpy = spyOn(process, 'exit').mockImplementation((() => {}) as never)
      consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      executeGhCommandSpy.mockRestore()
      processExitSpy.mockRestore()
      consoleErrorSpy.mockRestore()
    })

    test('should apply query with equals signs correctly (Phase 1.5)', () => {
      // Arrange
      const args = ['release', 'list', '--query=[?state==`OPEN`]']

      // Act
      const result = shouldConvertToStructuredFormat(args)

      // Assert - Query should preserve all equals signs
      expect(result.query).toBe('[?state==`OPEN`]')
      expect(result.cleanArgs).toEqual(['release', 'list'])
    })

    test('should error when --query has no value', () => {
      // Arrange
      const args = ['release', 'list', '--query']

      // Act
      shouldConvertToStructuredFormat(args)

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled()
      const errorOutput = consoleErrorSpy.mock.calls.flat().join(' ')
      expect(errorOutput).toContain('--query flag requires a value')
      expect(processExitSpy).toHaveBeenCalledWith(1)
    })

    test('should error when --query value is a flag', () => {
      // Arrange
      const args = ['release', 'list', '--query', '--limit', '10']

      // Act
      shouldConvertToStructuredFormat(args)

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled()
      const errorOutput = consoleErrorSpy.mock.calls.flat().join(' ')
      expect(errorOutput).toContain('--query flag requires a value')
      expect(processExitSpy).toHaveBeenCalledWith(1)
    })

    test('should not pass --query flag to gh CLI', async () => {
      // Arrange
      const mockJsonOutput = JSON.stringify([{ tagName: 'v1.0.0', isDraft: false }])
      executeGhCommandSpy.mockResolvedValue({
        stdout: mockJsonOutput,
        stderr: '',
        exitCode: 0,
      })

      const args = ['release', 'list', '--query', '[?isDraft]', '--limit', '10']

      // Act
      await passThroughCommand(args)

      // Assert
      const callArgs = executeGhCommandSpy.mock.calls[0][0]
      expect(callArgs).not.toContain('--query')
      expect(callArgs).not.toContain('[?isDraft]')
      expect(callArgs).toContain('--limit')
      expect(callArgs).toContain('10')
    })
  })
})
