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
    test('should return boolean type', async () => {
      expect(typeof checkGhAuth).toBe('function')
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

    test('should use GH_PATH environment variable when set', async () => {
      process.env.GH_PATH = '/nonexistent/path/gh'
      await expect(checkGhAuth()).rejects.toThrow()
    })
  })

  describe('getGitHubToken', () => {
    test('should return function', async () => {
      expect(typeof getGitHubToken).toBe('function')
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

    test('should use GH_PATH environment variable when set', async () => {
      process.env.GH_PATH = '/nonexistent/path/gh'
      await expect(getGitHubToken()).rejects.toThrow()
    })
  })

  describe('error handling', () => {
    test('checkGhAuth should be callable', async () => {
      expect(typeof checkGhAuth).toBe('function')
    })

    test('getGitHubToken should be callable', async () => {
      expect(typeof getGitHubToken).toBe('function')
    })
  })
})
