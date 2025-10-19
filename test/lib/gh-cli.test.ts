import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { checkGhAuth, getGitHubToken } from '../../src/lib/gh-cli'
import { createMockGhScript } from '../fixtures/mock-gh'

describe('gh-cli', () => {
  // Store original environment
  let originalGhPath: string | undefined
  const testDir = join(import.meta.dir, '../fixtures/gh-cli-test')

  beforeEach(() => {
    originalGhPath = process.env.GH_PATH

    // Create test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
    mkdirSync(testDir, { recursive: true })
  })

  afterEach(() => {
    // Restore original environment
    if (originalGhPath) {
      process.env.GH_PATH = originalGhPath
    }
    else {
      delete process.env.GH_PATH
    }

    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  describe('checkGhAuth', () => {
    test('should return true when user is authenticated', async () => {
      // Arrange: Mock gh auth status (exit 0)
      const mockGhPath = createMockGhScript('auth-status-success', testDir)
      process.env.GH_PATH = mockGhPath

      // Act
      const result = await checkGhAuth()

      // Assert
      expect(result).toBe(true)
    })

    test('should return false when user is not authenticated (exit 1)', async () => {
      // Arrange: Mock gh auth status (exit 1)
      const mockGhPath = createMockGhScript('auth-status-not-authenticated', testDir)
      process.env.GH_PATH = mockGhPath

      // Act
      const result = await checkGhAuth()

      // Assert
      expect(result).toBe(false)
    })

    test('should throw error with meaningful message when gh CLI is missing', async () => {
      process.env.GH_PATH = '/nonexistent/gh'
      try {
        await checkGhAuth()
      }
      catch (error) {
        expect(error).toBeInstanceOf(Error)
        if (error instanceof Error) {
          expect(error.message.toLowerCase()).toMatch(/gh|cli/)
        }
      }
    })

    test('should throw error with installation URL when gh CLI not found (exit 127)', async () => {
      // Arrange: Mock exit code 127
      const mockGhPath = createMockGhScript('exit-127', testDir)
      process.env.GH_PATH = mockGhPath

      // Act & Assert
      await expect(checkGhAuth()).rejects.toThrow('GitHub CLI (gh) is not installed')
      await expect(checkGhAuth()).rejects.toThrow('https://cli.github.com/')
    })

    test('should throw generic error for unexpected exit codes', async () => {
      // Arrange: Mock exit code 2
      const mockGhPath = createMockGhScript('exit-2', testDir)
      process.env.GH_PATH = mockGhPath

      // Act & Assert
      await expect(checkGhAuth()).rejects.toThrow(/Failed to check GitHub CLI authentication/)
    })
  })

  describe('getGitHubToken', () => {
    test('should return token string when authenticated', async () => {
      // Arrange: Mock gh auth token (exit 0 with token)
      const mockGhPath = createMockGhScript('auth-token-success', testDir)
      process.env.GH_PATH = mockGhPath

      // Act
      const token = await getGitHubToken()

      // Assert
      expect(token).toBe('gho_1234567890abcdefghijklmnopqrstuvwxyz')
    })

    test('should return null when not authenticated (exit 1)', async () => {
      // Arrange: Mock gh auth token (exit 1)
      const mockGhPath = createMockGhScript('auth-token-not-authenticated', testDir)
      process.env.GH_PATH = mockGhPath

      // Act
      const token = await getGitHubToken()

      // Assert
      expect(token).toBe(null)
    })

    test('should return null when token output is empty string', async () => {
      // Arrange: Mock gh auth token (exit 0 but empty stdout)
      const mockGhPath = createMockGhScript('auth-token-empty', testDir)
      process.env.GH_PATH = mockGhPath

      // Act
      const token = await getGitHubToken()

      // Assert
      expect(token).toBe(null)
    })

    test('should throw error with helpful message when gh CLI is missing', async () => {
      process.env.GH_PATH = '/nonexistent/gh'
      try {
        await getGitHubToken()
      }
      catch (error) {
        expect(error).toBeInstanceOf(Error)
        if (error instanceof Error) {
          expect(error.message.toLowerCase()).toMatch(/gh|cli/)
        }
      }
    })

    test('should throw error with installation URL when gh CLI not found (exit 127)', async () => {
      // Arrange: Mock exit code 127
      const mockGhPath = createMockGhScript('exit-127', testDir)
      process.env.GH_PATH = mockGhPath

      // Act & Assert
      await expect(getGitHubToken()).rejects.toThrow('GitHub CLI (gh) is not installed')
      await expect(getGitHubToken()).rejects.toThrow('https://cli.github.com/')
    })
  })
})
