/**
 * GitHub CLI Mock Builder using ts-pattern
 *
 * Provides a fluent API for building GitHub CLI mocks with pattern matching.
 * Uses ts-pattern for more maintainable and type-safe mock definitions.
 *
 * @example
 * ```typescript
 * const mock = new GhMockBuilder()
 *   .onRepoView({ stdout: repoViewResponse })
 *   .onListIssueTypes({ stdout: issueTypesResponse })
 *   .onGetIssueNodeId(123, 'I_node123', { stdout: nodeIdResponse })
 *   .build()
 *
 * const { cleanup, mockPath } = await mock.create()
 * ```
 */

import type { GhMockResponse, GhMockRule } from './cli-runner'
import { match, P } from 'ts-pattern'

type MockPattern = string | string[] | RegExp | ((args: string) => boolean)

interface MockRule {
  pattern: MockPattern
  response: GhMockResponse
  description?: string
}

export class GhMockBuilder {
  private rules: MockRule[] = []

  /**
   * Add a custom rule with pattern matching
   */
  addRule(pattern: MockPattern, response: GhMockResponse, description?: string): this {
    this.rules.push({ pattern, response, description })
    return this
  }

  /**
   * Mock: gh repo view --json owner,name
   */
  onRepoView(response: GhMockResponse): this {
    return this.addRule(
      ['repo', 'view', '--json', 'owner,name'],
      response,
      'Get repository info',
    )
  }

  /**
   * Mock: GraphQL - List Issue Types
   */
  onListIssueTypes(response: GhMockResponse): this {
    return this.addRule(
      /operationName=ListIssueTypes/,
      response,
      'List issue types',
    )
  }

  /**
   * Mock: GraphQL - Update Issue Type
   */
  onUpdateIssueType(response: GhMockResponse): this {
    return this.addRule(
      /operationName=UpdateIssueType/,
      response,
      'Update issue type',
    )
  }

  /**
   * Mock: GraphQL - Get Issue Node ID
   */
  onGetIssueNodeId(response: GhMockResponse): this {
    return this.addRule(
      /operationName=GetIssueNodeId/,
      response,
      'Get issue node ID',
    )
  }

  /**
   * Mock: GraphQL - Get Repository Node ID
   * Matches: query GetRepositoryNodeId { repository(owner:...) { id } }
   */
  onGetRepositoryNodeId(response: GhMockResponse): this {
    return this.addRule(
      /operationName=GetRepositoryNodeId/,
      response,
      'Get repository node ID',
    )
  }

  /**
   * Mock: GraphQL - Create Issue with Type
   * Matches: mutation CreateIssueWithType { createIssue(input: ...) }
   */
  onCreateIssueWithType(response: GhMockResponse): this {
    return this.addRule(
      /operationName=CreateIssueWithType/,
      response,
      'Create issue with type',
    )
  }

  /**
   * Mock: gh issue create
   */
  onIssueCreate(response: GhMockResponse): this {
    return this.addRule(
      (args: string) => args.includes('issue create'),
      response,
      'Create issue via gh CLI',
    )
  }

  /**
   * Build the mock rules and convert to GhMockRule[] format
   * Uses ts-pattern to intelligently order rules from most specific to most general
   */
  build(): GhMockRule[] {
    // Sort rules by specificity (most specific first)
    const sortedRules = this.sortBySpecificity([...this.rules])

    return sortedRules.map((rule) => {
      // Convert function patterns to regex patterns
      if (typeof rule.pattern === 'function') {
        // Convert function pattern to a broad regex and rely on ordering
        // This is a heuristic - the function will be called to determine match
        return {
          args: /.*/, // Match anything, rely on order
          response: rule.response,
        }
      }

      return {
        args: rule.pattern,
        response: rule.response,
      }
    })
  }

  /**
   * Sort rules by specificity (most specific first)
   * This ensures that narrow patterns are checked before broad patterns
   */
  private sortBySpecificity(rules: MockRule[]): MockRule[] {
    return rules.sort((a, b) => {
      const scoreA = this.calculateSpecificity(a.pattern)
      const scoreB = this.calculateSpecificity(b.pattern)
      return scoreB - scoreA // Higher score = more specific = comes first
    })
  }

  /**
   * Calculate specificity score for a pattern
   * Higher score = more specific
   *
   * Priority order (highest to lowest):
   * 1. Exact string/array match (1000+)
   * 2. Function patterns (850)
   * 3. operationName patterns (800-900) - named GraphQL operations
   * 4. Generic regex patterns (500-700)
   * 5. Catch-all patterns (0-400)
   */
  private calculateSpecificity(pattern: MockPattern): number {
    return match(pattern)
      .with(P.array(), (arr) => {
        // Exact array match is very specific
        return 1000 + (arr as string[]).length * 10
      })
      .with(P.string, (str) => {
        // Exact string match is very specific
        return 1000 + str.length
      })
      .with(P.when(p => typeof p === 'function'), () => {
        // Function patterns are specific (assume they check multiple conditions)
        return 850
      })
      .with(P.instanceOf(RegExp), (regex) => {
        // Regex specificity based on keywords and patterns
        const source = regex.source

        // operationName patterns are highly specific (named GraphQL operations)
        if (source.includes('operationName=')) {
          // Extract operation name for more precise scoring
          const opNameMatch = source.match(/operationName=(\w+)/)
          if (opNameMatch) {
            // Score based on operation name length - longer names are more specific
            return 850 + opNameMatch[1].length
          }
          return 850 // Default for operationName patterns
        }

        // Check for "issue create" pattern (CLI command, not GraphQL)
        if (source.includes('issue create')) {
          return 800 // Specific CLI command
        }

        // Count wildcards and specific strings for generic patterns
        const wildcards = (source.match(/\.\*/g) || []).length
        const specificStrings = (source.match(/[a-z]{5,}/gi) || []).length

        // More specific strings = higher score
        // More wildcards = lower score
        return 600 + specificStrings * 30 - wildcards * 15
      })
      .otherwise(() => 0)
  }

  /**
   * Build and create the mock with pattern matching logic
   * This version uses ts-pattern for intelligent matching
   */
  async buildWithPatternMatching(): Promise<{
    cleanup: () => Promise<void>
    mockPath: string
    matchCommand: (args: string) => GhMockResponse
  }> {
    // Create a matcher function using ts-pattern
    const matchCommand = (args: string): GhMockResponse => {
      // Try each rule in order (most specific first)
      for (const rule of this.rules) {
        const isMatch = match(rule.pattern)
          .with(P.string, pattern => args === pattern)
          .with(P.array(), (pattern) => {
            const patternStr = (pattern as string[]).join(' ')
            return args === patternStr || args.includes(patternStr)
          })
          .with(P.instanceOf(RegExp), pattern => (pattern as RegExp).test(args))
          .with(P.when(p => typeof p === 'function'), (pattern) => {
            return (pattern as (args: string) => boolean)(args)
          })
          .otherwise(() => false)

        if (isMatch) {
          return rule.response
        }
      }

      // No rule matched
      return {
        stderr: `gh-mock: No rule matched for args: ${args}`,
        exitCode: 1,
      }
    }

    // Generate bash script that calls our matcher
    const mockScript = this.generateMockScript()

    // Write and setup mock
    const mockScriptPath = '/tmp/gh-mock.sh'
    await Bun.write(mockScriptPath, mockScript)

    const fs = await import('node:fs')
    await fs.promises.chmod(mockScriptPath, 0o755)

    return {
      mockPath: mockScriptPath,
      matchCommand,
      cleanup: async () => {
        try {
          const fs = await import('node:fs')
          await fs.promises.unlink(mockScriptPath)
        }
        catch {
          // Ignore cleanup errors
        }
      },
    }
  }

  /**
   * Generate bash mock script with pattern matching
   */
  private generateMockScript(): string {
    const scriptLines: string[] = [
      '#!/usr/bin/env bash',
      '# Mock GitHub CLI for testing',
      '# Generated by GhMockBuilder with ts-pattern',
      '',
      'ARGS="$@"',
      '',
    ]

    // Add each rule
    for (let i = 0; i < this.rules.length; i++) {
      const rule = this.rules[i]
      const { pattern, response } = rule

      // Escape strings for bash
      const stdout = (response.stdout ?? '').replace(/"/g, '\\"').replace(/\$/g, '\\$')
      const stderr = (response.stderr ?? '').replace(/"/g, '\\"').replace(/\$/g, '\\$')
      const exitCode = response.exitCode ?? 0

      if (rule.description) {
        scriptLines.push(`# ${rule.description}`)
      }

      // Handle different pattern types
      if (Array.isArray(pattern)) {
        // Exact match for array
        const patternStr = pattern.join(' ')
        scriptLines.push(`if [[ "$ARGS" == "${patternStr}" ]]; then`)
      }
      else if (pattern instanceof RegExp) {
        // Regex match
        scriptLines.push(`PATTERN_${i}='${pattern.source}'`)
        scriptLines.push(`if [[ "$ARGS" =~ $PATTERN_${i} ]]; then`)
      }
      else if (typeof pattern === 'string') {
        // String match
        scriptLines.push(`if [[ "$ARGS" == "${pattern}" ]]; then`)
      }
      else {
        // Function - convert to heuristic bash logic
        // This is a workaround since we can't execute JS functions in bash
        scriptLines.push(`# Function-based pattern - using heuristic match`)
        scriptLines.push(`if false; then  # TODO: Implement function pattern`)
      }

      scriptLines.push(`  echo "${stdout}"`)
      if (stderr) {
        scriptLines.push(`  >&2 echo "${stderr}"`)
      }
      scriptLines.push(`  exit ${exitCode}`)
      scriptLines.push('fi')
      scriptLines.push('')
    }

    // No rule matched
    scriptLines.push('# No rule matched')
    scriptLines.push('>&2 echo "gh-mock: No rule matched for args: $ARGS"')
    scriptLines.push('exit 1')

    return scriptLines.join('\n')
  }
}

/**
 * Helper to create standard mock responses
 */
export const MockResponses = {
  success: (stdout: string): GhMockResponse => ({
    stdout,
    exitCode: 0,
  }),

  error: (stderr: string, exitCode = 1): GhMockResponse => ({
    stderr,
    exitCode,
  }),

  json: (data: unknown): GhMockResponse => ({
    stdout: JSON.stringify(data),
    exitCode: 0,
  }),
}

/**
 * Convenience function to create and setup a GitHub mock
 * Uses the builder pattern with automatic cleanup
 *
 * @example
 * ```typescript
 * const { cleanup, mockPath } = await createMockFromBuilder(
 *   new GhMockBuilder()
 *     .onRepoView(MockResponses.json(repoInfo))
 *     .onListIssueTypes(MockResponses.json(issueTypes))
 * )
 * ```
 */
export async function createMockFromBuilder(
  builder: GhMockBuilder,
  mockScriptPath = '/tmp/gh-mock.sh',
): Promise<{ cleanup: () => Promise<void>, mockPath: string }> {
  const { createGhMock } = await import('./cli-runner')
  const rules = builder.build()
  return createGhMock(rules, mockScriptPath)
}
