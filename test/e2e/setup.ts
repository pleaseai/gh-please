/**
 * E2E Test Setup and Utilities
 * Provides infrastructure for end-to-end testing with real GitHub API
 */

import { afterAll } from 'bun:test'

/**
 * Environment configuration for E2E tests
 */
export interface E2EConfig {
  /** GitHub personal access token for testing */
  githubToken: string
  /** Test repository owner */
  testOwner: string
  /** Test repository name */
  testRepo: string
  /** Whether to skip cleanup after tests */
  skipCleanup: boolean
}

/**
 * Check if E2E tests should run
 * E2E tests only run when GITHUB_TEST_TOKEN is set
 */
export function shouldRunE2ETests(): boolean {
  return !!process.env.GITHUB_TEST_TOKEN
}

/**
 * Get E2E test configuration from environment
 */
export function getE2EConfig(): E2EConfig {
  const githubToken = process.env.GITHUB_TEST_TOKEN || ''
  const testOwner = process.env.GITHUB_TEST_OWNER || 'pleaseai'
  const testRepo = process.env.GITHUB_TEST_REPO || 'gh-please-e2e'
  const skipCleanup = process.env.E2E_SKIP_CLEANUP === 'true'

  return {
    githubToken,
    testOwner,
    testRepo,
    skipCleanup,
  }
}

/**
 * Skip test if E2E tests are not enabled
 */
export function skipIfNoE2E(testFn: () => void | Promise<void>): () => void | Promise<void> {
  return shouldRunE2ETests()
    ? testFn
    : () => {
        console.log('⊘ Skipping E2E test (GITHUB_TEST_TOKEN not set)')
      }
}

/**
 * Test artifact tracker for cleanup
 */
export class TestArtifacts {
  private issues: number[] = []
  private prs: number[] = []
  private comments: number[] = []

  addIssue(issueNumber: number): void {
    this.issues.push(issueNumber)
  }

  addPr(prNumber: number): void {
    this.prs.push(prNumber)
  }

  addComment(commentId: number): void {
    this.comments.push(commentId)
  }

  getIssues(): number[] {
    return [...this.issues]
  }

  getPrs(): number[] {
    return [...this.prs]
  }

  getComments(): number[] {
    return [...this.comments]
  }

  clear(): void {
    this.issues = []
    this.prs = []
    this.comments = []
  }
}

/**
 * E2E Test helper class
 */
export class E2ETestHelper {
  private config: E2EConfig
  private artifacts: TestArtifacts

  constructor(config: E2EConfig) {
    this.config = config
    this.artifacts = new TestArtifacts()
  }

  getConfig(): E2EConfig {
    return this.config
  }

  getArtifacts(): TestArtifacts {
    return this.artifacts
  }

  /**
   * Create a test issue
   */
  async createTestIssue(title: string, body?: string, labels?: string[]): Promise<number> {
    const args = [
      'api',
      `/repos/${this.config.testOwner}/${this.config.testRepo}/issues`,
      '-X',
      'POST',
      '-f',
      `title=${title}`,
    ]

    if (body) {
      args.push('-f', `body=${body}`)
    }

    // GitHub API requires labels as an array in JSON format
    if (labels && labels.length > 0) {
      for (const label of labels) {
        args.push('-f', `labels[]=${label}`)
      }
    }

    const proc = Bun.spawn(['gh', ...args], {
      env: {
        ...process.env,
        GITHUB_TOKEN: this.config.githubToken,
      },
      stdout: 'pipe',
      stderr: 'pipe',
    })

    await proc.exited

    const stdout = await new Response(proc.stdout).text()
    const stderr = await new Response(proc.stderr).text()

    // Check for errors
    if (proc.exitCode !== 0) {
      throw new Error(`Failed to create issue: ${stderr || stdout}`)
    }

    const response = JSON.parse(stdout)
    const issueNumber = response.number

    if (!issueNumber) {
      throw new Error(`Failed to get issue number from response: ${stdout}`)
    }

    this.artifacts.addIssue(issueNumber)

    return issueNumber
  }

  /**
   * Close and cleanup test issue
   */
  async cleanupIssue(issueNumber: number): Promise<void> {
    try {
      await Bun.spawn([
        'gh',
        'api',
        `/repos/${this.config.testOwner}/${this.config.testRepo}/issues/${issueNumber}`,
        '-X',
        'PATCH',
        '-f',
        'state=closed',
      ], {
        env: {
          ...process.env,
          GITHUB_TOKEN: this.config.githubToken,
        },
      }).exited
    }
    catch (error) {
      console.warn(`Failed to cleanup issue #${issueNumber}:`, error)
    }
  }

  /**
   * Cleanup all test artifacts
   */
  async cleanup(): Promise<void> {
    if (this.config.skipCleanup) {
      console.log('⊘ Skipping cleanup (E2E_SKIP_CLEANUP=true)')
      return
    }

    console.log('🧹 Cleaning up E2E test artifacts...')

    // Close all test issues
    const issues = this.artifacts.getIssues()
    for (const issueNumber of issues) {
      await this.cleanupIssue(issueNumber)
    }

    this.artifacts.clear()

    console.log('✓ Cleanup complete')
  }

  /**
   * Wait for a condition to be true with timeout
   */
  async waitFor(
    condition: () => boolean | Promise<boolean>,
    options: { timeout?: number, interval?: number } = {},
  ): Promise<boolean> {
    const { timeout = 10000, interval = 500 } = options
    const startTime = Date.now()

    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return true
      }
      await new Promise(resolve => setTimeout(resolve, interval))
    }

    return false
  }

  /**
   * Get issue details
   */
  async getIssue(issueNumber: number): Promise<any> {
    const proc = Bun.spawn([
      'gh',
      'api',
      `/repos/${this.config.testOwner}/${this.config.testRepo}/issues/${issueNumber}`,
    ], {
      env: {
        ...process.env,
        GITHUB_TOKEN: this.config.githubToken,
      },
      stdout: 'pipe',
    })

    await proc.exited
    const stdout = await new Response(proc.stdout).text()
    return JSON.parse(stdout)
  }

  /**
   * Get issue comments
   */
  async getIssueComments(issueNumber: number): Promise<any[]> {
    const proc = Bun.spawn([
      'gh',
      'api',
      `/repos/${this.config.testOwner}/${this.config.testRepo}/issues/${issueNumber}/comments`,
    ], {
      env: {
        ...process.env,
        GITHUB_TOKEN: this.config.githubToken,
      },
      stdout: 'pipe',
    })

    await proc.exited
    const stdout = await new Response(proc.stdout).text()
    return JSON.parse(stdout)
  }

  /**
   * Check if issue has a specific comment
   */
  async hasComment(issueNumber: number, commentText: string): Promise<boolean> {
    const comments = await this.getIssueComments(issueNumber)
    return comments.some(c => c.body.includes(commentText))
  }
}

/**
 * Setup and teardown for E2E test suites
 */
export function setupE2ESuite(): E2ETestHelper | null {
  if (!shouldRunE2ETests()) {
    console.log('⊘ Skipping E2E tests (GITHUB_TEST_TOKEN not set)')
    console.log('   To run E2E tests, set GITHUB_TEST_TOKEN environment variable')
    return null
  }

  const config = getE2EConfig()
  const helper = new E2ETestHelper(config)

  console.log('🚀 Setting up E2E tests')
  console.log(`   Repository: ${config.testOwner}/${config.testRepo}`)
  console.log(`   Skip cleanup: ${config.skipCleanup}`)

  // Cleanup after all tests
  afterAll(async () => {
    await helper.cleanup()
  })

  return helper
}

/**
 * Run gh please CLI command for E2E tests
 * Uses local source code (dist/index.js) instead of installed extension
 */
export async function runE2ECommand(
  args: string[],
  config: E2EConfig,
): Promise<{ exitCode: number | null, stdout: string, stderr: string }> {
  // Add --repo flag if not already present
  const commandArgs = [...args]
  if (!commandArgs.includes('--repo')) {
    commandArgs.push('--repo', `${config.testOwner}/${config.testRepo}`)
  }

  // Run local build directly instead of installed gh extension
  // This ensures we're testing the current code, not an older installed version
  const proc = Bun.spawn(
    ['bun', 'run', 'dist/index.js', ...commandArgs],
    {
      env: {
        ...process.env,
        GITHUB_TOKEN: config.githubToken,
      },
      stdout: 'pipe',
      stderr: 'pipe',
      cwd: process.cwd(),
    },
  )

  await proc.exited

  const stdout = await new Response(proc.stdout).text()
  const stderr = await new Response(proc.stderr).text()

  return {
    exitCode: proc.exitCode,
    stdout: stdout.trim(),
    stderr: stderr.trim(),
  }
}
