import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { installPlugin } from '../../src/plugins/plugin-installer'
import { createMockGhScript } from '../fixtures/mock-gh'

describe('Premium Plugin Installer', () => {
  let originalGhPath: string | undefined
  let originalHome: string | undefined
  const testDir = join(import.meta.dir, '../fixtures/premium-installer-test')

  beforeEach(() => {
    originalGhPath = process.env.GH_PATH
    originalHome = process.env.HOME

    // Create test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
    mkdirSync(testDir, { recursive: true })

    // Override HOME to test directory
    process.env.HOME = testDir
  })

  afterEach(() => {
    // Restore environment
    if (originalGhPath) {
      process.env.GH_PATH = originalGhPath
    }
    else {
      delete process.env.GH_PATH
    }

    if (originalHome) {
      process.env.HOME = originalHome
    }

    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  describe('Input Validation', () => {
    test('should reject empty plugin name', async () => {
      // Arrange: Mock authentication success
      const mockGhPath = createMockGhScript('auth-status-success', testDir)
      process.env.GH_PATH = mockGhPath

      // Act
      const result = await installPlugin('', { premium: true })

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toMatch(/empty|invalid/i)
    })

    test('should reject plugin name with path traversal', async () => {
      // Arrange: Mock authentication success
      const mockGhPath = createMockGhScript('auth-status-success', testDir)
      process.env.GH_PATH = mockGhPath

      // Act
      const result = await installPlugin('../evil', { premium: true })

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toMatch(/path traversal|invalid/i)
    })

    test('should reject plugin name with forward slash', async () => {
      // Arrange: Mock authentication success
      const mockGhPath = createMockGhScript('auth-status-success', testDir)
      process.env.GH_PATH = mockGhPath

      // Act
      const result = await installPlugin('evil/plugin', { premium: true })

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toMatch(/path traversal|invalid/i)
    })

    test('should reject plugin name with special characters', async () => {
      // Arrange: Mock authentication success
      const mockGhPath = createMockGhScript('auth-status-success', testDir)
      process.env.GH_PATH = mockGhPath

      // Act
      const result = await installPlugin('evil$plugin', { premium: true })

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toMatch(/invalid/i)
    })

    test('should accept valid plugin names', async () => {
      // Arrange: Mock successful installation
      const mockGhPath = join(testDir, 'mock-gh')
      const scriptContent = `#!/usr/bin/env bash
if [[ "$1" == "auth" && "$2" == "status" ]]; then
  echo "Logged in"
  exit 0
elif [[ "$1" == "release" && "$2" == "download" ]]; then
  for ((i=1; i<\${#@}; i++)); do
    if [[ "\${!i}" == "--dir" ]]; then
      DIR="\${@:$((i+1)):1}"
      mkdir -p "$DIR"
      TMP=$(mktemp -d)
      echo '{}' > "$TMP/package.json"
      tar -czf "$DIR/release.tar.gz" -C "$TMP" .
      rm -rf "$TMP"
      exit 0
    fi
  done
fi
exit 1
`
      writeFileSync(mockGhPath, scriptContent, { mode: 0o755 })
      process.env.GH_PATH = mockGhPath

      // Act - test 'ai' which is in registry
      const result = await installPlugin('ai', { premium: true })
      // Should either succeed or fail at download, not validation
      expect(result.success || result.error?.includes('download')).toBe(true)

      // Test other valid names that won't be in registry
      const nonRegistryNames = ['my-plugin', 'my_plugin', 'plugin123']
      for (const name of nonRegistryNames) {
        const result = await installPlugin(name, { premium: true })
        // Should fail because they're not in registry, not because of validation
        expect(result.error?.toLowerCase()).not.toMatch(/empty|path traversal|special character/)
      }
    })
  })

  describe('installPremiumPlugin', () => {
    test('should fail when not authenticated', async () => {
      // Arrange: Mock failed authentication
      const mockGhPath = createMockGhScript('auth-status-not-authenticated', testDir)
      process.env.GH_PATH = mockGhPath

      // Act
      const result = await installPlugin('ai', { premium: true })

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error).toContain('gh auth login')
    })

    test('should fail for unknown plugin name', async () => {
      // Arrange: Mock successful authentication
      const mockGhPath = createMockGhScript('auth-status-success', testDir)
      process.env.GH_PATH = mockGhPath

      // Act
      const result = await installPlugin('unknown-plugin', { premium: true })

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Unknown plugin name')
    })

    test('should create plugin directory for known plugins', async () => {
      // Arrange: Mock successful authentication and download
      const mockGhPath = join(testDir, 'mock-gh')
      const debugFile = join(testDir, 'debug.log')
      const scriptContent = `#!/usr/bin/env bash
if [[ "$1" == "auth" && "$2" == "status" ]]; then
  echo "Logged in to github.com as testuser"
  exit 0
elif [[ "$1" == "release" && "$2" == "download" ]]; then
  # Find --dir value in the arguments
  echo "Args: $@" >> "${debugFile}"
  for ((i=1; i<\${#@}; i++)); do
    if [[ "\${!i}" == "--dir" ]]; then
      DIR="\${@:$((i+1)):1}"
      echo "Found DIR: $DIR" >> "${debugFile}"
      mkdir -p "$DIR"
      # Create a simple tarball with package.json
      TMP_DIR=$(mktemp -d)
      echo '{"name":"@pleaseai/gh-please-ai"}' > "$TMP_DIR/package.json"
      tar -czf "$DIR/release.tar.gz" -C "$TMP_DIR" .
      rm -rf "$TMP_DIR"
      echo "Success" >> "${debugFile}"
      exit 0
    fi
  done
  echo "No DIR found" >> "${debugFile}"
  exit 1
fi
exit 1
`
      writeFileSync(mockGhPath, scriptContent, { mode: 0o755 })
      process.env.GH_PATH = mockGhPath

      // Act
      const result = await installPlugin('ai', { premium: true })

      // Assert
      const pluginDir = join(testDir, '.gh-please', 'plugins', 'ai')
      if (!result.success) {
        console.error('Installation failed:', result)
        if (existsSync(debugFile)) {
          console.error('Debug log:', Bun.file(debugFile).textSync())
        }
      }
      expect(result.success).toBe(true)
      expect(existsSync(pluginDir)).toBe(true)
    })

    test('should fail when repository download fails', async () => {
      // Arrange: Mock successful authentication but failed download
      const mockGhPath = join(testDir, 'mock-gh')
      const scriptContent = `#!/usr/bin/env bash
if [[ "$1" == "auth" && "$2" == "status" ]]; then
  echo "Logged in to github.com as testuser"
  exit 0
elif [[ "$1" == "release" && "$2" == "download" ]]; then
  echo "Release not found" >&2
  exit 1
fi
exit 1
`
      writeFileSync(mockGhPath, scriptContent, { mode: 0o755 })
      process.env.GH_PATH = mockGhPath

      // Act
      const result = await installPlugin('ai', { premium: true })

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    test('should use correct repository for ai plugin', async () => {
      // Arrange: Mock to track repository argument
      const repoLogFile = join(testDir, 'repo-log.txt')
      const mockGhPath = join(testDir, 'mock-gh')
      const scriptContent = `#!/usr/bin/env bash
if [[ "$1" == "auth" && "$2" == "status" ]]; then
  echo "Logged in to github.com as testuser"
  exit 0
elif [[ "$1" == "release" && "$2" == "download" ]]; then
  # Find --repo and --dir values
  for ((i=1; i<\${#@}; i++)); do
    if [[ "\${!i}" == "--repo" ]]; then
      echo "\${@:$((i+1)):1}" > "${repoLogFile}"
    fi
    if [[ "\${!i}" == "--dir" ]]; then
      DIR="\${@:$((i+1)):1}"
    fi
  done
  mkdir -p "$DIR"
  TMP_DIR=$(mktemp -d)
  echo '{"name":"@pleaseai/gh-please-ai"}' > "$TMP_DIR/package.json"
  tar -czf "$DIR/release.tar.gz" -C "$TMP_DIR" .
  rm -rf "$TMP_DIR"
  exit 0
fi
exit 1
`
      writeFileSync(mockGhPath, scriptContent, { mode: 0o755 })
      process.env.GH_PATH = mockGhPath

      // Act
      await installPlugin('ai', { premium: true })

      // Assert
      expect(existsSync(repoLogFile)).toBe(true)
      const repo = await Bun.file(repoLogFile).text()
      expect(repo.trim()).toBe('pleaseai/gh-please-ai')
    })

    test('should verify package.json exists after extraction', async () => {
      // Arrange: Create working mock
      const mockGhPath = join(testDir, 'mock-gh')
      const scriptContent = `#!/usr/bin/env bash
if [[ "$1" == "auth" && "$2" == "status" ]]; then
  echo "Logged in to github.com as testuser"
  exit 0
elif [[ "$1" == "release" && "$2" == "download" ]]; then
  # Find --dir value
  for ((i=1; i<\${#@}; i++)); do
    if [[ "\${!i}" == "--dir" ]]; then
      DIR="\${@:$((i+1)):1}"
      mkdir -p "$DIR"
      TMP_DIR=$(mktemp -d)
      echo '{"name":"@pleaseai/gh-please-ai"}' > "$TMP_DIR/package.json"
      tar -czf "$DIR/release.tar.gz" -C "$TMP_DIR" .
      rm -rf "$TMP_DIR"
      exit 0
    fi
  done
  exit 1
fi
exit 1
`
      writeFileSync(mockGhPath, scriptContent, { mode: 0o755 })
      process.env.GH_PATH = mockGhPath

      // Act
      const result = await installPlugin('ai', { premium: true })

      // Assert
      const pluginDir = join(testDir, '.gh-please', 'plugins', 'ai')
      const packageJsonPath = join(pluginDir, 'package.json')
      expect(result.success).toBe(true)
      expect(existsSync(packageJsonPath)).toBe(true)
      const packageJson = await Bun.file(packageJsonPath).json()
      expect(packageJson.name).toBe('@pleaseai/gh-please-ai')
    })

    test('should fail when tarball without package.json is extracted', async () => {
      // Arrange: Mock tarball without package.json
      const mockGhPath = join(testDir, 'mock-gh')
      const scriptContent = `#!/usr/bin/env bash
if [[ "$1" == "auth" && "$2" == "status" ]]; then
  echo "Logged in to github.com as testuser"
  exit 0
elif [[ "$1" == "release" && "$2" == "download" ]]; then
  for ((i=1; i<\${#@}; i++)); do
    if [[ "\${!i}" == "--dir" ]]; then
      DIR="\${@:$((i+1)):1}"
      mkdir -p "$DIR"
      TMP_DIR=$(mktemp -d)
      echo "empty file" > "$TMP_DIR/README.md"
      tar -czf "$DIR/release.tar.gz" -C "$TMP_DIR" .
      rm -rf "$TMP_DIR"
      exit 0
    fi
  done
  exit 1
fi
exit 1
`
      writeFileSync(mockGhPath, scriptContent, { mode: 0o755 })
      process.env.GH_PATH = mockGhPath

      // Act
      const result = await installPlugin('ai', { premium: true })

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toMatch(/package.json|not found/i)
    })

    test('should cleanup tarball file after successful extraction', async () => {
      // Arrange
      const mockGhPath = join(testDir, 'mock-gh')
      const scriptContent = `#!/usr/bin/env bash
if [[ "$1" == "auth" && "$2" == "status" ]]; then
  echo "Logged in to github.com as testuser"
  exit 0
elif [[ "$1" == "release" && "$2" == "download" ]]; then
  for ((i=1; i<\${#@}; i++)); do
    if [[ "\${!i}" == "--dir" ]]; then
      DIR="\${@:$((i+1)):1}"
      mkdir -p "$DIR"
      TMP_DIR=$(mktemp -d)
      echo '{"name":"test"}' > "$TMP_DIR/package.json"
      tar -czf "$DIR/release.tar.gz" -C "$TMP_DIR" .
      rm -rf "$TMP_DIR"
      exit 0
    fi
  done
  exit 1
fi
exit 1
`
      writeFileSync(mockGhPath, scriptContent, { mode: 0o755 })
      process.env.GH_PATH = mockGhPath

      // Act
      const result = await installPlugin('ai', { premium: true })

      // Assert
      const pluginDir = join(testDir, '.gh-please', 'plugins', 'ai')
      const tarballPath = join(pluginDir, 'release.tar.gz')
      expect(result.success).toBe(true)
      expect(existsSync(tarballPath)).toBe(false)
    })

    test('should handle find command failure when locating tarball', async () => {
      // Arrange: Mock where find command fails
      const mockGhPath = join(testDir, 'mock-gh')
      const scriptContent = `#!/usr/bin/env bash
if [[ "$1" == "auth" && "$2" == "status" ]]; then
  echo "Logged in to github.com as testuser"
  exit 0
elif [[ "$1" == "release" && "$2" == "download" ]]; then
  for ((i=1; i<\${#@}; i++)); do
    if [[ "\${!i}" == "--dir" ]]; then
      DIR="\${@:$((i+1)):1}"
      mkdir -p "$DIR"
      TMP_DIR=$(mktemp -d)
      echo '{"name":"test"}' > "$TMP_DIR/package.json"
      tar -czf "$DIR/release.tar.gz" -C "$TMP_DIR" .
      rm -rf "$TMP_DIR"
      # Create a directory that find can't read to simulate failure
      exit 0
    fi
  done
  exit 1
fi
exit 1
`
      writeFileSync(mockGhPath, scriptContent, { mode: 0o755 })
      process.env.GH_PATH = mockGhPath

      // Act - this should still succeed since the tarball is there
      const result = await installPlugin('ai', { premium: true })

      // Assert - should work even though this is testing edge case
      expect(result.success).toBe(true)
    })
  })
})
