import type {
  ActionResultOutput,
  DependencyListOutput,
  OutputData,
  PluginListOutput,
  ReviewThreadOutput,
  SubIssueListOutput,
} from '../../../src/lib/formatters/types'
import { describe, expect, test } from 'bun:test'
import { XMLFormatter } from '../../../src/lib/formatters/xml'

describe('XMLFormatter', () => {
  const formatter = new XMLFormatter()
  const timestamp = '2025-10-21T10:30:00Z'
  const repository = 'owner/repo'
  const command = 'gh please test'

  describe('formatSubIssueList', () => {
    test('should format sub-issue list with XML structure', () => {
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
          ],
          total: 2,
        } satisfies SubIssueListOutput,
      }

      const output = formatter.format(data)

      // XML declaration
      expect(output).toContain('<?xml version="1.0" encoding="UTF-8"?>')

      // Root element
      expect(output).toContain('<sub-issue-list>')
      expect(output).toContain('</sub-issue-list>')

      // Metadata
      expect(output).toContain('<metadata>')
      expect(output).toContain('<command>gh please test</command>')
      expect(output).toContain('<repository>owner/repo</repository>')
      expect(output).toContain(`<timestamp>${timestamp}</timestamp>`)
      expect(output).toContain('</metadata>')

      // Parent
      expect(output).toContain('<parent number="123" url="https://github.com/owner/repo/issues/123">')
      expect(output).toContain('<title>Implement Authentication System</title>')
      expect(output).toContain('</parent>')

      // Summary
      expect(output).toContain('<summary>')
      expect(output).toContain('<total>2</total>')
      expect(output).toContain('</summary>')

      // Sub-issues
      expect(output).toContain('<sub-issues>')
      expect(output).toContain('<issue number="124" state="OPEN">')
      expect(output).toContain('<title>Implement authentication module</title>')
      expect(output).toContain('<url>https://github.com/owner/repo/issues/124</url>')
      expect(output).toContain('</issue>')
      expect(output).toContain('<issue number="125" state="CLOSED">')
      expect(output).toContain('</sub-issues>')
    })

    test('should handle empty sub-issue list', () => {
      const data: OutputData = {
        command,
        timestamp,
        data: {
          parent: { number: 123, title: 'Test', url: 'http://example.com' },
          subIssues: [],
          total: 0,
        } satisfies SubIssueListOutput,
      }

      const output = formatter.format(data)
      expect(output).toContain('<total>0</total>')
      expect(output).toContain('<sub-issues>')
      expect(output).toContain('</sub-issues>')
    })

    test('should escape XML special characters', () => {
      const data: OutputData = {
        command,
        timestamp,
        data: {
          parent: {
            number: 123,
            title: 'Title with <special> & "chars" \'test\'',
            url: 'http://example.com?foo=1&bar=2',
          },
          subIssues: [],
          total: 0,
        } satisfies SubIssueListOutput,
      }

      const output = formatter.format(data)
      expect(output).toContain('Title with &lt;special&gt; &amp; &quot;chars&quot; &apos;test&apos;')
      expect(output).toContain('http://example.com?foo=1&amp;bar=2')
    })
  })

  describe('formatDependencyList', () => {
    test('should format dependency list as XML', () => {
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
          ],
          total: 1,
        } satisfies DependencyListOutput,
      }

      const output = formatter.format(data)

      expect(output).toContain('<?xml version="1.0" encoding="UTF-8"?>')
      expect(output).toContain('<dependency-list>')
      expect(output).toContain('<issue number="123" url="https://github.com/owner/repo/issues/123">')
      expect(output).toContain('<title>Feature Implementation</title>')
      expect(output).toContain('<blockers>')
      expect(output).toContain('<issue number="120" state="CLOSED">')
      expect(output).toContain('</blockers>')
      expect(output).toContain('</dependency-list>')
    })

    test('should handle empty blockers list', () => {
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
      expect(output).toContain('<total>0</total>')
      expect(output).toContain('<blockers>')
      expect(output).toContain('</blockers>')
    })
  })

  describe('formatReviewThread', () => {
    test('should format review threads as XML', () => {
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
              isResolved: false,
            },
          ],
          total: 2,
          resolved: 1,
        } satisfies ReviewThreadOutput,
      }

      const output = formatter.format(data)

      expect(output).toContain('<?xml version="1.0" encoding="UTF-8"?>')
      expect(output).toContain('<review-thread-list>')
      expect(output).toContain('<pull-request number="456" url="https://github.com/owner/repo/pull/456">')
      expect(output).toContain('<title>Add new feature</title>')

      // Summary
      expect(output).toContain('<total>2</total>')
      expect(output).toContain('<resolved>1</resolved>')
      expect(output).toContain('<unresolved>1</unresolved>')

      // Threads with optional line attribute
      expect(output).toContain('<thread id="thread-1" resolved="true" line="42">')
      expect(output).toContain('<path>src/index.ts</path>')
      expect(output).toContain('<thread id="thread-2" resolved="false">')
      expect(output).not.toContain('line=""')
      expect(output).toContain('</review-thread-list>')
    })
  })

  describe('formatPluginList', () => {
    test('should format plugin list as XML', () => {
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

      expect(output).toContain('<?xml version="1.0" encoding="UTF-8"?>')
      expect(output).toContain('<plugin-list>')
      expect(output).toContain('<total>2</total>')
      expect(output).toContain('<plugins>')
      expect(output).toContain('<plugin name="@pleaseai/gh-please-ai" version="1.0.0" type="command-group">')
      expect(output).toContain('<location>node_modules/@pleaseai/gh-please-ai</location>')
      expect(output).toContain('<plugin name="gh-please-utils" version="0.5.0" type="utility">')
      expect(output).toContain('</plugins>')
      expect(output).toContain('</plugin-list>')
    })

    test('should handle empty plugin list', () => {
      const data: OutputData = {
        command,
        timestamp,
        data: { plugins: [], total: 0 } satisfies PluginListOutput,
      }

      const output = formatter.format(data)
      expect(output).toContain('<total>0</total>')
      expect(output).toContain('<plugins>')
      expect(output).toContain('</plugins>')
    })
  })

  describe('formatActionResult', () => {
    test('should format successful action result as XML', () => {
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

      expect(output).toContain('<?xml version="1.0" encoding="UTF-8"?>')
      expect(output).toContain('<action-result action="created" success="true">')
      expect(output).toContain('<result type="sub-issue">')
      expect(output).toContain('<id>124</id>')
      expect(output).toContain('<url>https://github.com/owner/repo/issues/124</url>')
      expect(output).toContain('<metadata>')
      expect(output).toContain('<parentNumber>123</parentNumber>')
      expect(output).toContain('<title>New sub-issue</title>')
      expect(output).toContain('</metadata>')
      expect(output).toContain('<message>Sub-issue created successfully</message>')
      expect(output).toContain('</action-result>')
    })

    test('should format failed action result without optional fields', () => {
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
        } satisfies ActionResultOutput,
      }

      const output = formatter.format(data)

      expect(output).toContain('<action-result action="deleted" success="false">')
      expect(output).toContain('<id>comment-123</id>')
      expect(output).not.toContain('<url>')
      // Metadata section is always included at the document level
      expect(output).toContain('<metadata>')
      expect(output).toContain('<command>gh please test</command>')
      // But result.metadata (nested metadata) should not be present
      expect(output).not.toContain('<parentNumber>')
      expect(output).not.toContain('<title>')
      expect(output).not.toContain('<message>')
    })
  })

  describe('formatGeneric', () => {
    test('should format unknown data with CDATA', () => {
      const data: OutputData = {
        command,
        timestamp,
        data: {
          customField: 'value',
          nestedObject: { foo: 'bar' },
        },
      }

      const output = formatter.format(data)

      expect(output).toContain('<?xml version="1.0" encoding="UTF-8"?>')
      expect(output).toContain('<command-output>')
      expect(output).toContain('<data>')
      expect(output).toContain('<![CDATA[')
      expect(output).toContain('"customField": "value"')
      expect(output).toContain(']]>')
      expect(output).toContain('</data>')
      expect(output).toContain('</command-output>')
    })
  })

  describe('metadata', () => {
    test('should include metadata in all outputs', () => {
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

      expect(output).toContain('<metadata>')
      expect(output).toContain('<command>gh please issue sub-issue list</command>')
      expect(output).toContain('<repository>owner/repo</repository>')
      expect(output).toContain('<timestamp>2025-10-21T10:30:00Z</timestamp>')
      expect(output).toContain('</metadata>')
    })

    test('should handle missing repository', () => {
      const data: OutputData = {
        command: 'gh please test',
        timestamp: '2025-10-21T10:30:00Z',
        data: { plugins: [], total: 0 } satisfies PluginListOutput,
      }

      const output = formatter.format(data)

      expect(output).toContain('<metadata>')
      expect(output).toContain('<command>gh please test</command>')
      expect(output).not.toContain('<repository>')
      expect(output).toContain('<timestamp>2025-10-21T10:30:00Z</timestamp>')
      expect(output).toContain('</metadata>')
    })
  })

  describe('escape', () => {
    test('should escape all XML special characters', () => {
      const data: OutputData = {
        command,
        timestamp,
        data: {
          parent: {
            number: 123,
            title: 'Test & <tag> "quotes" \'apostrophe\'',
            url: 'http://example.com?a=1&b=2',
          },
          subIssues: [],
          total: 0,
        } satisfies SubIssueListOutput,
      }

      const output = formatter.format(data)
      expect(output).toContain('Test &amp; &lt;tag&gt; &quot;quotes&quot; &apos;apostrophe&apos;')
      expect(output).toContain('http://example.com?a=1&amp;b=2')
    })
  })

  describe('XML validity', () => {
    test('should generate valid XML structure', () => {
      const data: OutputData = {
        command,
        timestamp,
        repository,
        data: {
          parent: { number: 123, title: 'Test', url: 'http://example.com' },
          subIssues: [
            { number: 124, title: 'Sub 1', state: 'OPEN', url: 'http://example.com/124' },
          ],
          total: 1,
        } satisfies SubIssueListOutput,
      }

      const output = formatter.format(data)

      // Check well-formed XML (opening/closing tags match)
      expect(output.split('<sub-issue-list>').length).toBe(2)
      expect(output.split('</sub-issue-list>').length).toBe(2)
      expect(output.split('<metadata>').length).toBe(2)
      expect(output.split('</metadata>').length).toBe(2)
      expect(output.split('<parent').length).toBe(2)
      expect(output.split('</parent>').length).toBe(2)
      expect(output.split('<sub-issues>').length).toBe(2)
      expect(output.split('</sub-issues>').length).toBe(2)
    })
  })
})
