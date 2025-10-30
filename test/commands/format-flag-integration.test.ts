/**
 * Integration tests for --format flag across list commands
 *
 * Tests verify that the --format toon flag works correctly at the command level,
 * ensuring proper wiring between CLI options and output functions.
 */

import { decode } from '@byjohann/toon'
import { describe, expect, test, vi } from 'bun:test'

describe('Format Flag Integration Tests', () => {
  describe('issue sub-issue list command', () => {
    test('should output TOON format when --format toon specified', async () => {
      const spy = vi.spyOn(console, 'log')

      // Mock the command execution (we'll test the output logic directly)
      const mockSubIssues = [
        { number: 124, title: 'Implement auth', state: 'OPEN', nodeId: 'I_abc123' },
        { number: 125, title: 'Add tests', state: 'CLOSED', nodeId: 'I_def456' },
      ]

      // Import the output function to test directly
      const { outputData } = await import('@pleaseai/cli-toolkit/output')

      // Simulate command execution with --format toon
      const data = mockSubIssues.map(issue => ({
        number: issue.number,
        title: issue.title,
        state: issue.state,
        nodeId: issue.nodeId,
        url: `https://github.com/owner/repo/issues/${issue.number}`,
      }))

      outputData(data, 'toon')

      const output = spy.mock.calls[0][0] as string

      // Verify TOON format structure
      expect(output).toContain('[2\t]') // Array length marker with tab
      expect(output).toContain('{number\ttitle\tstate\tnodeId\turl}') // Tab-delimited header
      expect(output).toContain('124\tImplement auth\tOPEN') // Tab-delimited data

      // Verify it's valid TOON (can be decoded)
      const decoded = decode(output)
      expect(decoded).toHaveLength(2)
      expect(decoded[0].number).toBe(124)
      expect(decoded[0].title).toBe('Implement auth')

      spy.mockRestore()
    })

    test('should output JSON format when --format json specified', async () => {
      const spy = vi.spyOn(console, 'log')

      const mockSubIssues = [
        { number: 124, title: 'Test', state: 'OPEN', nodeId: 'I_123' },
      ]

      const { outputData } = await import('@pleaseai/cli-toolkit/output')

      const data = mockSubIssues.map(issue => ({
        number: issue.number,
        title: issue.title,
        state: issue.state,
        nodeId: issue.nodeId,
        url: `https://github.com/owner/repo/issues/${issue.number}`,
      }))

      outputData(data, 'json')

      const output = spy.mock.calls[0][0] as string

      // Verify JSON format
      expect(output).toContain('{')
      expect(output).toContain('"number": 124')
      expect(output).toContain('"title": "Test"')

      // Should be valid JSON
      const parsed = JSON.parse(output)
      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed[0].number).toBe(124)

      spy.mockRestore()
    })

    test('should apply field filtering with TOON format', async () => {
      const spy = vi.spyOn(console, 'log')

      const mockSubIssues = [
        { number: 124, title: 'Test', state: 'OPEN', nodeId: 'I_123', url: 'https://...' },
      ]

      const { outputData } = await import('@pleaseai/cli-toolkit/output')

      outputData(mockSubIssues, 'toon', ['number', 'title'])

      const output = spy.mock.calls[0][0] as string

      // Should only include filtered fields
      expect(output).toContain('{number\ttitle}')
      expect(output).not.toContain('state')
      expect(output).not.toContain('nodeId')
      expect(output).not.toContain('url')

      // Verify decoded data has only filtered fields
      const decoded = decode(output)
      expect(Object.keys(decoded[0])).toEqual(['number', 'title'])

      spy.mockRestore()
    })
  })

  describe('plugin list command', () => {
    test('should output TOON format for plugin list', async () => {
      const spy = vi.spyOn(console, 'log')

      const mockPlugins = [
        { name: 'ai', version: '0.3.0', type: 'command-group', description: 'AI plugin', author: 'PleaseAI', premium: true },
        { name: 'speckit', version: '0.1.0', type: 'utility', description: 'Spec tools', author: 'Community', premium: false },
      ]

      const { outputData } = await import('@pleaseai/cli-toolkit/output')

      outputData(mockPlugins, 'toon')

      const output = spy.mock.calls[0][0] as string

      // Verify TOON structure
      expect(output).toContain('[2\t]')
      expect(output).toContain('{name\tversion\ttype\tdescription\tauthor\tpremium}')
      expect(output).toContain('ai\t0.3.0\tcommand-group')

      // Verify decodability
      const decoded = decode(output)
      expect(decoded).toHaveLength(2)
      expect(decoded[0].name).toBe('ai')
      expect(decoded[0].premium).toBe(true)

      spy.mockRestore()
    })
  })

  describe('pr review thread list command', () => {
    test('should output TOON format for review threads', async () => {
      const spy = vi.spyOn(console, 'log')

      const mockThreads = [
        {
          nodeId: 'PRRT_abc123',
          isResolved: false,
          path: 'src/file.ts',
          line: 42,
          resolvedBy: null,
          firstCommentBody: 'Please fix this',
          url: 'https://github.com/owner/repo/pull/456#discussion_r123',
        },
      ]

      const { outputData } = await import('@pleaseai/cli-toolkit/output')

      outputData(mockThreads, 'toon')

      const output = spy.mock.calls[0][0] as string

      // Verify TOON structure
      expect(output).toContain('[1\t]')
      expect(output).toContain('nodeId')
      expect(output).toContain('isResolved')
      expect(output).toContain('PRRT_abc123')

      // Verify decodability
      const decoded = decode(output)
      expect(decoded[0].nodeId).toBe('PRRT_abc123')
      expect(decoded[0].isResolved).toBe(false)

      spy.mockRestore()
    })
  })

  describe('Format precedence and edge cases', () => {
    test('should default to JSON when no format specified', async () => {
      const spy = vi.spyOn(console, 'log')

      const { outputData } = await import('@pleaseai/cli-toolkit/output')

      outputData([{ a: 1 }]) // No format parameter

      const output = spy.mock.calls[0][0] as string

      // Should be JSON
      expect(output).toContain('{')
      expect(output).toContain('"a": 1')
      const parsed = JSON.parse(output)
      expect(parsed[0].a).toBe(1)

      spy.mockRestore()
    })

    test('should handle empty arrays in both formats', async () => {
      const jsonSpy = vi.spyOn(console, 'log')
      const { outputData } = await import('@pleaseai/cli-toolkit/output')

      // JSON empty array
      outputData([], 'json')
      expect(jsonSpy.mock.calls[0][0]).toBe('[]')
      jsonSpy.mockRestore()

      // TOON empty array
      const toonSpy = vi.spyOn(console, 'log')
      outputData([], 'toon')
      expect(toonSpy.mock.calls[0][0]).toBe('[0\t]:')
      toonSpy.mockRestore()
    })

    test('should handle field filtering with both formats', async () => {
      const data = [
        { number: 123, title: 'Test', state: 'OPEN', extra: 'data' },
      ]

      const { outputData } = await import('@pleaseai/cli-toolkit/output')

      // Test JSON with filtering
      const jsonSpy = vi.spyOn(console, 'log')
      outputData(data, 'json', ['number', 'title'])
      const jsonOutput = jsonSpy.mock.calls[0][0] as string
      expect(jsonOutput).toContain('"number": 123')
      expect(jsonOutput).toContain('"title": "Test"')
      expect(jsonOutput).not.toContain('state')
      expect(jsonOutput).not.toContain('extra')
      jsonSpy.mockRestore()

      // Test TOON with filtering
      const toonSpy = vi.spyOn(console, 'log')
      outputData(data, 'toon', ['number', 'title'])
      const toonOutput = toonSpy.mock.calls[0][0] as string
      expect(toonOutput).toContain('{number\ttitle}')
      expect(toonOutput).not.toContain('state')
      expect(toonOutput).not.toContain('extra')
      toonSpy.mockRestore()
    })
  })

  describe('Real-world data scenarios', () => {
    test('should handle realistic issue data with URLs and special characters', async () => {
      const spy = vi.spyOn(console, 'log')

      const realisticData = [
        {
          number: 86,
          title: 'Add TOON output format for LLM token optimization',
          state: 'OPEN',
          nodeId: 'I_kwDOABC123',
          url: 'https://github.com/pleaseai/gh-please/issues/86',
        },
        {
          number: 87,
          title: 'Fix: bug with "quotes" and special chars',
          state: 'CLOSED',
          nodeId: 'I_kwDODEF456',
          url: 'https://github.com/pleaseai/gh-please/issues/87',
        },
      ]

      const { outputData } = await import('@pleaseai/cli-toolkit/output')

      outputData(realisticData, 'toon')

      const output = spy.mock.calls[0][0] as string

      // Verify TOON structure
      expect(output).toContain('[2\t]')

      // Verify it decodes correctly (most important test)
      const decoded = decode(output)
      expect(decoded).toHaveLength(2)
      expect(decoded[0].number).toBe(86)
      expect(decoded[0].title).toBe('Add TOON output format for LLM token optimization')
      expect(decoded[1].title).toBe('Fix: bug with "quotes" and special chars')
      expect(decoded[0].url).toContain('github.com')

      spy.mockRestore()
    })

    test('should handle multiple plugins with mixed premium status', async () => {
      const spy = vi.spyOn(console, 'log')

      const plugins = [
        { name: 'ai', version: '0.3.0', type: 'command-group', description: 'AI automation', author: 'PleaseAI', premium: true },
        { name: 'speckit', version: '0.1.0', type: 'utility', description: null, author: 'Community', premium: false },
        { name: 'linear', version: '1.0.0', type: 'provider', description: 'Linear integration', author: null, premium: false },
      ]

      const { outputData } = await import('@pleaseai/cli-toolkit/output')

      outputData(plugins, 'toon')

      const output = spy.mock.calls[0][0] as string

      // Verify decodability with null values
      const decoded = decode(output)
      expect(decoded).toHaveLength(3)
      expect(decoded[0].premium).toBe(true)
      expect(decoded[1].premium).toBe(false)
      expect(decoded[1].description).toBeNull()
      expect(decoded[2].author).toBeNull()

      spy.mockRestore()
    })
  })
})
