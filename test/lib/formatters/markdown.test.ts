import type {
  ActionResultOutput,
  DependencyListOutput,
  OutputData,
  PluginListOutput,
  ReviewThreadOutput,
  SubIssueListOutput,
} from '../../../src/lib/formatters/types'
import { describe, expect, test } from 'bun:test'
import { MarkdownFormatter } from '../../../src/lib/formatters/markdown'

describe('MarkdownFormatter', () => {
  const formatter = new MarkdownFormatter()
  const timestamp = '2025-10-21T10:30:00Z'
  const repository = 'owner/repo'
  const command = 'gh please test'

  describe('formatSubIssueList', () => {
    test('should format sub-issue list with multiple items', () => {
      const data: OutputData = {
        command,
        timestamp,
        repository,
        data: {
          parent: {
            number: 123,
            title: 'Implement Authentication System',
            url: 'https://github.com/owner/repo/issues/123',
          },
          subIssues: [
            {
              number: 124,
              title: 'Implement authentication module',
              state: 'OPEN',
              url: 'https://github.com/owner/repo/issues/124',
            },
            {
              number: 125,
              title: 'Add unit tests',
              state: 'CLOSED',
              url: 'https://github.com/owner/repo/issues/125',
            },
            {
              number: 126,
              title: 'Update documentation',
              state: 'OPEN',
              url: 'https://github.com/owner/repo/issues/126',
            },
          ],
          total: 3,
        } satisfies SubIssueListOutput,
      }

      const output = formatter.format(data)

      // Check header
      expect(output).toContain('## Sub-Issues for #123: Implement Authentication System')
      expect(output).toContain('**Total**: 3 sub-issues')

      // Check table structure
      expect(output).toContain('| Status | Number | Title |')
      expect(output).toContain('|--------|--------|-------|')

      // Check table rows
      expect(output).toContain('| OPEN | [#124](https://github.com/owner/repo/issues/124) | Implement authentication module |')
      expect(output).toContain('| CLOSED | [#125](https://github.com/owner/repo/issues/125) | Add unit tests |')
      expect(output).toContain('| OPEN | [#126](https://github.com/owner/repo/issues/126) | Update documentation |')

      // Check parent link
      expect(output).toContain('**Parent Issue**: https://github.com/owner/repo/issues/123')

      // Check metadata
      expect(output).toContain('---')
      expect(output).toContain('**Metadata**')
      expect(output).toContain('- Command: `gh please test`')
      expect(output).toContain('- Repository: owner/repo')
      expect(output).toContain(`- Timestamp: ${timestamp}`)
    })

    test('should format empty sub-issue list', () => {
      const data: OutputData = {
        command,
        timestamp,
        repository,
        data: {
          parent: {
            number: 123,
            title: 'Empty Issue',
            url: 'https://github.com/owner/repo/issues/123',
          },
          subIssues: [],
          total: 0,
        } satisfies SubIssueListOutput,
      }

      const output = formatter.format(data)

      expect(output).toContain('**Total**: 0 sub-issues')
      expect(output).toContain('*No sub-issues found*')
      expect(output).not.toContain('| Status | Number | Title |')
    })

    test('should handle singular "sub-issue" for total=1', () => {
      const data: OutputData = {
        command,
        timestamp,
        data: {
          parent: { number: 123, title: 'Test', url: 'http://example.com' },
          subIssues: [{ number: 124, title: 'One', state: 'OPEN', url: 'http://example.com' }],
          total: 1,
        } satisfies SubIssueListOutput,
      }

      const output = formatter.format(data)
      expect(output).toContain('**Total**: 1 sub-issue')
      expect(output).not.toContain('1 sub-issues')
    })

    test('should escape special markdown characters in titles', () => {
      const data: OutputData = {
        command,
        timestamp,
        data: {
          parent: {
            number: 123,
            title: 'Title with | pipe and [brackets] and `backticks`',
            url: 'http://example.com',
          },
          subIssues: [
            {
              number: 124,
              title: 'Issue | with [special] `chars`',
              state: 'OPEN',
              url: 'http://example.com',
            },
          ],
          total: 1,
        } satisfies SubIssueListOutput,
      }

      const output = formatter.format(data)
      expect(output).toContain('Title with \\| pipe and \\[brackets\\] and \\`backticks\\`')
      expect(output).toContain('Issue \\| with \\[special\\] \\`chars\\`')
    })
  })

  describe('formatDependencyList', () => {
    test('should format dependency list with blockers', () => {
      const data: OutputData = {
        command,
        timestamp,
        repository,
        data: {
          issue: {
            number: 123,
            title: 'Feature Implementation',
            url: 'https://github.com/owner/repo/issues/123',
          },
          blockers: [
            {
              number: 120,
              title: 'Setup infrastructure',
              state: 'CLOSED',
              url: 'https://github.com/owner/repo/issues/120',
            },
            {
              number: 121,
              title: 'Add dependencies',
              state: 'OPEN',
              url: 'https://github.com/owner/repo/issues/121',
            },
          ],
          total: 2,
        } satisfies DependencyListOutput,
      }

      const output = formatter.format(data)

      expect(output).toContain('## Dependencies for #123: Feature Implementation')
      expect(output).toContain('**Total**: 2 blockers')
      expect(output).toContain('| CLOSED | [#120](https://github.com/owner/repo/issues/120) | Setup infrastructure |')
      expect(output).toContain('| OPEN | [#121](https://github.com/owner/repo/issues/121) | Add dependencies |')
      expect(output).toContain('**Issue**: https://github.com/owner/repo/issues/123')
    })

    test('should format empty dependency list', () => {
      const data: OutputData = {
        command,
        timestamp,
        data: {
          issue: { number: 123, title: 'Test', url: 'http://example.com' },
          blockers: [],
          total: 0,
        } satisfies DependencyListOutput,
      }

      const output = formatter.format(data)
      expect(output).toContain('**Total**: 0 blockers')
      expect(output).toContain('*No blocking issues found*')
    })

    test('should handle singular "blocker" for total=1', () => {
      const data: OutputData = {
        command,
        timestamp,
        data: {
          issue: { number: 123, title: 'Test', url: 'http://example.com' },
          blockers: [{ number: 120, title: 'One', state: 'OPEN', url: 'http://example.com' }],
          total: 1,
        } satisfies DependencyListOutput,
      }

      const output = formatter.format(data)
      expect(output).toContain('**Total**: 1 blocker')
    })
  })

  describe('formatReviewThread', () => {
    test('should format review threads with resolved and unresolved', () => {
      const data: OutputData = {
        command,
        timestamp,
        repository,
        data: {
          pr: {
            number: 456,
            title: 'Add new feature',
            url: 'https://github.com/owner/repo/pull/456',
          },
          threads: [
            {
              id: 'thread-1',
              path: 'src/index.ts',
              line: 42,
              isResolved: true,
            },
            {
              id: 'thread-2',
              path: 'src/utils.ts',
              line: 10,
              isResolved: false,
            },
            {
              id: 'thread-3',
              path: 'README.md',
              isResolved: false,
            },
          ],
          total: 3,
          resolved: 1,
        } satisfies ReviewThreadOutput,
      }

      const output = formatter.format(data)

      expect(output).toContain('## Review Threads for PR #456: Add new feature')
      expect(output).toContain('**Total**: 3 threads (1 resolved, 2 unresolved)')
      expect(output).toContain('| Status | Thread ID | File | Line |')
      expect(output).toContain('| ✓ Resolved | `thread-1` | src/index.ts | 42 |')
      expect(output).toContain('| ○ Unresolved | `thread-2` | src/utils.ts | 10 |')
      expect(output).toContain('| ○ Unresolved | `thread-3` | README.md | - |')
      expect(output).toContain('**Pull Request**: https://github.com/owner/repo/pull/456')
    })

    test('should handle singular "thread" for total=1', () => {
      const data: OutputData = {
        command,
        timestamp,
        data: {
          pr: { number: 456, title: 'Test', url: 'http://example.com' },
          threads: [{ id: 't1', path: 'file.ts', isResolved: true }],
          total: 1,
          resolved: 1,
        } satisfies ReviewThreadOutput,
      }

      const output = formatter.format(data)
      expect(output).toContain('**Total**: 1 thread')
    })
  })

  describe('formatPluginList', () => {
    test('should format plugin list', () => {
      const data: OutputData = {
        command,
        timestamp,
        data: {
          plugins: [
            {
              name: '@pleaseai/gh-please-ai',
              version: '1.0.0',
              type: 'command-group',
              location: 'node_modules/@pleaseai/gh-please-ai',
            },
            {
              name: 'gh-please-utils',
              version: '0.5.0',
              type: 'utility',
              location: '~/.gh-please/plugins/utils',
            },
          ],
          total: 2,
        } satisfies PluginListOutput,
      }

      const output = formatter.format(data)

      expect(output).toContain('## Installed Plugins')
      expect(output).toContain('**Total**: 2 plugins')
      expect(output).toContain('| Name | Version | Type | Location |')
      expect(output).toContain('| @pleaseai/gh-please-ai | 1.0.0 | command-group | node_modules/@pleaseai/gh-please-ai |')
      expect(output).toContain('| gh-please-utils | 0.5.0 | utility | ~/.gh-please/plugins/utils |')
    })

    test('should format empty plugin list', () => {
      const data: OutputData = {
        command,
        timestamp,
        data: { plugins: [], total: 0 } satisfies PluginListOutput,
      }

      const output = formatter.format(data)
      expect(output).toContain('**Total**: 0 plugins')
      expect(output).toContain('*No plugins installed*')
    })

    test('should handle singular "plugin" for total=1', () => {
      const data: OutputData = {
        command,
        timestamp,
        data: {
          plugins: [{ name: 'test', version: '1.0.0', type: 'util', location: '/path' }],
          total: 1,
        } satisfies PluginListOutput,
      }

      const output = formatter.format(data)
      expect(output).toContain('**Total**: 1 plugin')
    })
  })

  describe('formatActionResult', () => {
    test('should format successful action result', () => {
      const data: OutputData = {
        command,
        timestamp,
        repository,
        data: {
          action: 'created',
          success: true,
          result: {
            type: 'sub-issue',
            id: 124,
            url: 'https://github.com/owner/repo/issues/124',
            metadata: {
              parentNumber: 123,
              title: 'New sub-issue',
            },
          },
          message: 'Sub-issue created successfully',
        } satisfies ActionResultOutput,
      }

      const output = formatter.format(data)

      expect(output).toContain('## ✓ Success: created')
      expect(output).toContain('**Result**:')
      expect(output).toContain('- Type: sub-issue')
      expect(output).toContain('- ID: 124')
      expect(output).toContain('- URL: https://github.com/owner/repo/issues/124')
      expect(output).toContain('**Additional Details**:')
      expect(output).toContain('- parentNumber: 123')
      expect(output).toContain('- title: New sub-issue')
      expect(output).toContain('**Message**: Sub-issue created successfully')
    })

    test('should format failed action result', () => {
      const data: OutputData = {
        command,
        timestamp,
        data: {
          action: 'deleted',
          success: false,
          result: {
            type: 'comment',
            id: 'comment-123',
          },
          message: 'Permission denied',
        } satisfies ActionResultOutput,
      }

      const output = formatter.format(data)

      expect(output).toContain('## ✗ Failed: deleted')
      expect(output).toContain('- Type: comment')
      expect(output).toContain('- ID: comment-123')
      expect(output).not.toContain('- URL:')
      expect(output).toContain('**Message**: Permission denied')
    })

    test('should format action without metadata or message', () => {
      const data: OutputData = {
        command,
        timestamp,
        data: {
          action: 'updated',
          success: true,
          result: {
            type: 'issue',
            id: 123,
          },
        } satisfies ActionResultOutput,
      }

      const output = formatter.format(data)

      expect(output).toContain('## ✓ Success: updated')
      expect(output).not.toContain('**Additional Details**')
      expect(output).not.toContain('**Message**')
    })
  })

  describe('formatGeneric', () => {
    test('should format unknown data types as JSON', () => {
      const data: OutputData = {
        command,
        timestamp,
        data: {
          customField: 'value',
          nestedObject: { foo: 'bar' },
          arrayData: [1, 2, 3],
        },
      }

      const output = formatter.format(data)

      expect(output).toContain('## Command Output')
      expect(output).toContain('```json')
      expect(output).toContain('"customField": "value"')
      expect(output).toContain('"nestedObject"')
      expect(output).toContain('"foo": "bar"')
      expect(output).toContain('```')
    })
  })

  describe('metadata footer', () => {
    test('should include metadata footer in all outputs', () => {
      const data: OutputData = {
        command: 'gh please issue sub-issue list',
        timestamp: '2025-10-21T10:30:00Z',
        repository: 'owner/repo',
        data: {
          parent: { number: 123, title: 'Test', url: 'http://example.com' },
          subIssues: [],
          total: 0,
        } satisfies SubIssueListOutput,
      }

      const output = formatter.format(data)

      expect(output).toContain('---')
      expect(output).toContain('**Metadata**')
      expect(output).toContain('- Command: `gh please issue sub-issue list`')
      expect(output).toContain('- Repository: owner/repo')
      expect(output).toContain('- Timestamp: 2025-10-21T10:30:00Z')
    })

    test('should handle missing repository in metadata', () => {
      const data: OutputData = {
        command: 'gh please test',
        timestamp: '2025-10-21T10:30:00Z',
        data: { plugins: [], total: 0 } satisfies PluginListOutput,
      }

      const output = formatter.format(data)

      expect(output).toContain('**Metadata**')
      expect(output).toContain('- Command: `gh please test`')
      expect(output).not.toContain('- Repository:')
      expect(output).toContain('- Timestamp: 2025-10-21T10:30:00Z')
    })
  })

  describe('escape', () => {
    test('should escape markdown special characters', () => {
      const data: OutputData = {
        command,
        timestamp,
        data: {
          parent: {
            number: 123,
            title: 'Title \\ with | [special] `chars`',
            url: 'http://example.com',
          },
          subIssues: [],
          total: 0,
        } satisfies SubIssueListOutput,
      }

      const output = formatter.format(data)
      expect(output).toContain('Title \\\\ with \\| \\[special\\] \\`chars\\`')
    })
  })
})
