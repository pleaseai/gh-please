import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
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

    test('should preserve nested directory structure during extraction', async () => {
      // Arrange: Create complex nested directory structure
      const sourceDir = join(testDir, 'source')
      const srcDir = join(sourceDir, 'src')
      const commandsDir = join(srcDir, 'commands')
      const libDir = join(srcDir, 'lib')

      mkdirSync(commandsDir, { recursive: true })
      mkdirSync(libDir, { recursive: true })

      writeFileSync(join(sourceDir, 'package.json'), '{"name": "test"}')
      writeFileSync(join(sourceDir, 'README.md'), '# Test Project')
      writeFileSync(join(commandsDir, 'index.ts'), 'export {}')
      writeFileSync(join(libDir, 'utils.ts'), 'export const utils = {}')

      // Create tarball from source directory
      const proc = Bun.spawn(['tar', '-czf', tarballPath, '-C', sourceDir, '.'], {
        stdout: 'pipe',
        stderr: 'pipe',
      })
      await proc.exited

      // Act
      await extractTarball(tarballPath, extractDir)

      // Assert: Verify all nested directories exist
      expect(existsSync(extractDir)).toBe(true)
      expect(existsSync(join(extractDir, 'src'))).toBe(true)
      expect(existsSync(join(extractDir, 'src', 'commands'))).toBe(true)
      expect(existsSync(join(extractDir, 'src', 'lib'))).toBe(true)

      // Assert: Verify all files exist with correct content
      expect(existsSync(join(extractDir, 'package.json'))).toBe(true)
      expect(existsSync(join(extractDir, 'README.md'))).toBe(true)
      expect(existsSync(join(extractDir, 'src', 'commands', 'index.ts'))).toBe(true)
      expect(existsSync(join(extractDir, 'src', 'lib', 'utils.ts'))).toBe(true)

      const packageJson = await Bun.file(join(extractDir, 'package.json')).text()
      expect(packageJson).toBe('{"name": "test"}')

      const readme = await Bun.file(join(extractDir, 'README.md')).text()
      expect(readme).toBe('# Test Project')

      const indexTs = await Bun.file(join(extractDir, 'src', 'commands', 'index.ts')).text()
      expect(indexTs).toBe('export {}')

      const utilsTs = await Bun.file(join(extractDir, 'src', 'lib', 'utils.ts')).text()
      expect(utilsTs).toBe('export const utils = {}')
    })

    test('should throw error with descriptive message for corrupted tarball', async () => {
      // Arrange: Create a corrupted tarball (valid gzip header but invalid tar content)
      const corruptedData = new Uint8Array(1024)
      crypto.getRandomValues(corruptedData)
      const gzipped = Bun.gzipSync(corruptedData)
      writeFileSync(tarballPath, gzipped)

      // Act & Assert
      await expect(extractTarball(tarballPath, extractDir)).rejects.toThrow()
    })

    test('should extract empty tarball to empty directory', async () => {
      // Arrange: Create a valid but empty tarball (no files in it)
      const emptyDir = join(testDir, 'empty')
      mkdirSync(emptyDir, { recursive: true })

      const proc = Bun.spawn(['tar', '-czf', tarballPath, '-C', emptyDir, '.'], {
        stdout: 'pipe',
        stderr: 'pipe',
      })
      await proc.exited

      // Act
      await extractTarball(tarballPath, extractDir)

      // Assert
      expect(existsSync(extractDir)).toBe(true)
      const files = readdirSync(extractDir)
      expect(files).toHaveLength(0)
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
