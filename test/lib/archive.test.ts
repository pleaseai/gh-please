import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { cleanupArchive, extractTarball, validateTarball } from '../../src/lib/archive'

describe('archive utilities', () => {
  const testDir = join(import.meta.dir, '../fixtures/archive-test')
  const tarballPath = join(testDir, 'test.tar.gz')
  const extractDir = join(testDir, 'extracted')

  beforeEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
    mkdirSync(testDir, { recursive: true })
  })

  afterEach(() => {
    // Clean up after tests
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  describe('extractTarball', () => {
    test('should extract valid tarball to target directory', async () => {
      // Arrange: Create a simple tarball for testing
      const sourceDir = join(testDir, 'source')
      mkdirSync(sourceDir, { recursive: true })
      writeFileSync(join(sourceDir, 'test.txt'), 'test content')

      // Create tarball using tar command
      const proc = Bun.spawn(['tar', '-czf', tarballPath, '-C', sourceDir, '.'], {
        stdout: 'pipe',
        stderr: 'pipe',
      })
      await proc.exited

      // Act
      await extractTarball(tarballPath, extractDir)

      // Assert
      expect(existsSync(extractDir)).toBe(true)
      expect(existsSync(join(extractDir, 'test.txt'))).toBe(true)
      const content = await Bun.file(join(extractDir, 'test.txt')).text()
      expect(content).toBe('test content')
    })

    test('should throw error when tarball does not exist', async () => {
      // Arrange
      const nonExistentPath = join(testDir, 'nonexistent.tar.gz')

      // Act & Assert
      await expect(extractTarball(nonExistentPath, extractDir)).rejects.toThrow()
    })

    test('should throw error when target directory cannot be created', async () => {
      // Arrange: Create a simple tarball
      const sourceDir = join(testDir, 'source')
      mkdirSync(sourceDir, { recursive: true })
      writeFileSync(join(sourceDir, 'test.txt'), 'test')

      const proc = Bun.spawn(['tar', '-czf', tarballPath, '-C', sourceDir, '.'], {
        stdout: 'pipe',
        stderr: 'pipe',
      })
      await proc.exited

      // Act & Assert: Try to extract to invalid path
      const invalidDir = '/invalid/path/that/cannot/be/created'
      await expect(extractTarball(tarballPath, invalidDir)).rejects.toThrow()
    })

    test('should create target directory if it does not exist', async () => {
      // Arrange
      const sourceDir = join(testDir, 'source')
      mkdirSync(sourceDir, { recursive: true })
      writeFileSync(join(sourceDir, 'test.txt'), 'test content')

      const proc = Bun.spawn(['tar', '-czf', tarballPath, '-C', sourceDir, '.'], {
        stdout: 'pipe',
        stderr: 'pipe',
      })
      await proc.exited

      // Act
      const newExtractDir = join(testDir, 'new', 'nested', 'dir')
      await extractTarball(tarballPath, newExtractDir)

      // Assert
      expect(existsSync(newExtractDir)).toBe(true)
      expect(existsSync(join(newExtractDir, 'test.txt'))).toBe(true)
    })
  })

  describe('cleanupArchive', () => {
    test('should remove tarball file', async () => {
      // Arrange: Create a dummy tarball
      writeFileSync(tarballPath, 'dummy content')
      expect(existsSync(tarballPath)).toBe(true)

      // Act
      await cleanupArchive(tarballPath)

      // Assert
      expect(existsSync(tarballPath)).toBe(false)
    })

    test('should not throw error when file does not exist', async () => {
      // Arrange
      const nonExistentPath = join(testDir, 'nonexistent.tar.gz')

      // Act & Assert
      await expect(cleanupArchive(nonExistentPath)).resolves.toBeUndefined()
    })
  })

  describe('validateTarball', () => {
    test('should return true for valid tarball', async () => {
      // Arrange: Create a valid tarball
      const sourceDir = join(testDir, 'source')
      mkdirSync(sourceDir, { recursive: true })
      writeFileSync(join(sourceDir, 'test.txt'), 'test content')

      const proc = Bun.spawn(['tar', '-czf', tarballPath, '-C', sourceDir, '.'], {
        stdout: 'pipe',
        stderr: 'pipe',
      })
      await proc.exited

      // Act
      const result = await validateTarball(tarballPath)

      // Assert
      expect(result).toBe(true)
    })

    test('should return false for invalid tarball', async () => {
      // Arrange: Create an invalid file
      writeFileSync(tarballPath, 'not a valid tarball')

      // Act
      const result = await validateTarball(tarballPath)

      // Assert
      expect(result).toBe(false)
    })

    test('should return false when file does not exist', async () => {
      // Arrange
      const nonExistentPath = join(testDir, 'nonexistent.tar.gz')

      // Act
      const result = await validateTarball(nonExistentPath)

      // Assert
      expect(result).toBe(false)
    })
  })
})
