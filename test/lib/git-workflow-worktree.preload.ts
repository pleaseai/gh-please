import * as originalFs from 'node:fs'
/**
 * Preload file for git-workflow-worktree tests
 * This file is loaded BEFORE any test imports, allowing us to mock modules
 * before they are imported by the code under test.
 *
 * Run tests with: bun test test/lib/git-workflow-worktree.test.ts --preload ./test/lib/git-workflow-worktree.preload.ts
 */
import { mock } from 'bun:test'

// Create mock functions that will be exported
export const mockRunGitCommand = mock()
export const mockWarnWithFollowup = mock()
export const mockMkdir = mock(() => Promise.resolve())

// Mock git-exec module BEFORE it's imported
mock.module('../../src/lib/git-exec', () => ({
  runCliCommand: mockRunGitCommand,
  warnWithFollowup: mockWarnWithFollowup,
}))

// Mock only fs.promises.mkdir while preserving other fs functions
mock.module('node:fs', () => ({
  ...originalFs,
  default: originalFs,
  promises: {
    ...originalFs.promises,
    mkdir: mockMkdir,
  },
}))
