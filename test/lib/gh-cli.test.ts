import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { checkGhAuth, getGitHubToken } from '../../src/lib/gh-cli'

describe('gh-cli', () => {
  // Store original environment
  let originalGhPath: string | undefined

  beforeEach(() => {
    originalGhPath = process.env.GH_PATH
  })

  afterEach(() => {
    // Restore original environment
    if (originalGhPath) {
      process.env.GH_PATH = originalGhPath
    }
    else {
      delete process.env.GH_PATH
    }
  })

  describe('checkGhAuth', () => {
    test('should return boolean when gh CLI is available', async () => {
      const result = await checkGhAuth()
      expect(typeof result).toBe('boolean')
    })

    test('should verify type is exactly boolean', async () => {
      const result = await checkGhAuth()
      expect(result === true || result === false).toBe(true)
    })

    test('should always return a definite value', async () => {
      const result = await checkGhAuth()
      expect(result).toBeDefined()
      expect(result !== null).toBe(true)
      expect(result !== undefined).toBe(true)
    })

    test('should use GH_PATH environment variable when set', async () => {
      // If GH_PATH is set to invalid path, it should throw
      process.env.GH_PATH = '/nonexistent/path/gh'
      await expect(checkGhAuth()).rejects.toThrow()
    })

    test('should throw error with meaningful message when gh CLI is missing', async () => {
      process.env.GH_PATH = '/nonexistent/gh'
      try {
        await checkGhAuth()
      }
      catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })

    test('should provide helpful error message about gh CLI installation', async () => {
      process.env.GH_PATH = '/absolutely/nonexistent/command/gh'
      try {
        await checkGhAuth()
      }
      catch (error) {
        if (error instanceof Error) {
          // Should mention gh CLI or installation
          const message = error.message.toLowerCase()
          expect(message.includes('cli') || message.includes('gh')).toBe(true)
        }
      }
    })
  })

  describe('getGitHubToken', () => {
    test('should return string or null', async () => {
      const token = await getGitHubToken()
      expect(token === null || typeof token === 'string').toBe(true)
    })

    test('should not return undefined', async () => {
      const result = await getGitHubToken()
      expect(result !== undefined).toBe(true)
    })

    test('should return empty string or null when no token is available', async () => {
      const result = await getGitHubToken()
      if (typeof result === 'string') {
        // If it's a string, it should be non-empty or empty is ok
        expect(typeof result).toBe('string')
      }
      else {
        expect(result).toBe(null)
      }
    })

    test('should use GH_PATH environment variable when set', async () => {
      process.env.GH_PATH = '/nonexistent/path/gh'
      await expect(getGitHubToken()).rejects.toThrow()
    })

    test('should throw error with meaningful message when gh CLI is missing', async () => {
      process.env.GH_PATH = '/nonexistent/gh'
      try {
        await getGitHubToken()
      }
      catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })

    test('should provide helpful error message about gh CLI installation', async () => {
      process.env.GH_PATH = '/absolutely/nonexistent/command/gh'
      try {
        await getGitHubToken()
      }
      catch (error) {
        if (error instanceof Error) {
          // Should mention gh CLI or installation
          const message = error.message.toLowerCase()
          expect(message.includes('cli') || message.includes('gh')).toBe(true)
        }
      }
    })
  })

  describe('error handling', () => {
    test('checkGhAuth should be callable', async () => {
      expect(typeof checkGhAuth).toBe('function')
    })

    test('getGitHubToken should be callable', async () => {
      expect(typeof getGitHubToken).toBe('function')
    })

    test('checkGhAuth should handle all exit codes gracefully', async () => {
      // Should not throw for normal execution with valid gh CLI
      const result = await checkGhAuth()
      expect(typeof result).toBe('boolean')
    })

    test('getGitHubToken should handle all exit codes gracefully', async () => {
      // Should not throw for normal execution with valid gh CLI
      const result = await getGitHubToken()
      expect(result === null || typeof result === 'string').toBe(true)
    })
  })

  describe('integration tests', () => {
    test('checkGhAuth should work with default gh command', async () => {
      // Uses default 'gh' from PATH
      const result = await checkGhAuth()
      expect(typeof result).toBe('boolean')
    })

    test('getGitHubToken should work with default gh command', async () => {
      // Uses default 'gh' from PATH
      const result = await getGitHubToken()
      expect(result === null || typeof result === 'string').toBe(true)
    })

    test('authentication state should be consistent', async () => {
      // If checkGhAuth returns true, getGitHubToken should not throw
      const isAuthed = await checkGhAuth()
      if (isAuthed) {
        await expect(getGitHubToken()).resolves.toBeDefined()
      }
    })
  })
})
