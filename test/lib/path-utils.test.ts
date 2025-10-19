import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { expandHome } from '../../src/lib/path-utils'

describe('path-utils', () => {
  let originalHome: string | undefined

  beforeEach(() => {
    originalHome = process.env.HOME
  })

  afterEach(() => {
    if (originalHome) {
      process.env.HOME = originalHome
    }
    else {
      delete process.env.HOME
    }
  })

  describe('expandHome', () => {
    test('should expand ~ to home directory', () => {
      // Arrange
      process.env.HOME = '/home/testuser'

      // Act
      const result = expandHome('~')

      // Assert
      expect(result).toBe('/home/testuser')
    })

    test('should expand ~/path to home/path', () => {
      // Arrange
      process.env.HOME = '/home/testuser'

      // Act
      const result = expandHome('~/.gh-please/plugins/ai')

      // Assert
      expect(result).toBe('/home/testuser/.gh-please/plugins/ai')
    })

    test('should expand ~/ prefix correctly', () => {
      // Arrange
      process.env.HOME = '/Users/testuser'

      // Act
      const result = expandHome('~/documents/file.txt')

      // Assert
      expect(result).toBe('/Users/testuser/documents/file.txt')
    })

    test('should return path unchanged when not starting with ~', () => {
      // Arrange
      process.env.HOME = '/home/testuser'
      const absolutePath = '/home/testuser/.gh-please'

      // Act
      const result = expandHome(absolutePath)

      // Assert
      expect(result).toBe(absolutePath)
    })

    test('should return relative path unchanged', () => {
      // Arrange
      process.env.HOME = '/home/testuser'
      const relativePath = '.gh-please/plugins'

      // Act
      const result = expandHome(relativePath)

      // Assert
      expect(result).toBe(relativePath)
    })

    test('should handle path with only tilde at start', () => {
      // Arrange
      process.env.HOME = '/home/testuser'

      // Act
      const result = expandHome('~/a')

      // Assert
      expect(result).toBe('/home/testuser/a')
    })

    test('should handle deep nested paths', () => {
      // Arrange
      process.env.HOME = '/root'

      // Act
      const result = expandHome('~/.config/app/settings/config.json')

      // Assert
      expect(result).toBe('/root/.config/app/settings/config.json')
    })

    test('should respect HOME environment variable override', () => {
      // Arrange
      process.env.HOME = '/custom/home/path'

      // Act
      const result = expandHome('~/.local/share')

      // Assert
      expect(result).toBe('/custom/home/path/.local/share')
    })

    test('should handle HOME with trailing slash', () => {
      // Arrange
      process.env.HOME = '/home/testuser/'

      // Act
      const result = expandHome('~/.config')

      // Assert
      expect(result).toBe('/home/testuser//.config')
    })

    test('should handle paths with special characters', () => {
      // Arrange
      process.env.HOME = '/home/user-name'

      // Act
      const result = expandHome('~/my-app/config.json')

      // Assert
      expect(result).toBe('/home/user-name/my-app/config.json')
    })

    test('should handle paths with dots', () => {
      // Arrange
      process.env.HOME = '/home/testuser'

      // Act
      const result = expandHome('~/../other/path')

      // Assert
      expect(result).toBe('/home/testuser/../other/path')
    })

    test('should handle empty string', () => {
      // Arrange
      process.env.HOME = '/home/testuser'
      const emptyPath = ''

      // Act
      const result = expandHome(emptyPath)

      // Assert
      expect(result).toBe(emptyPath)
    })

    test('should handle path with multiple tildes', () => {
      // Arrange
      process.env.HOME = '/home/testuser'

      // Act
      const result = expandHome('~/.config/~old/backup')

      // Assert
      expect(result).toBe('/home/testuser/.config/~old/backup')
    })

    test('should not expand tilde in middle of path', () => {
      // Arrange
      process.env.HOME = '/home/testuser'

      // Act
      const result = expandHome('/home/~user/config')

      // Assert
      expect(result).toBe('/home/~user/config')
    })

    test('should handle Windows-style paths (no change)', () => {
      // Arrange
      process.env.HOME = '/home/testuser'

      // Act
      const result = expandHome('C:\\Users\\testuser\\.config')

      // Assert
      expect(result).toBe('C:\\Users\\testuser\\.config')
    })
  })
})
