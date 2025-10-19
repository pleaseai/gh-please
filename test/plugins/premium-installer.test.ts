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
  })
})
