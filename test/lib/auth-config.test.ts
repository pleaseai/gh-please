import type { AuthConfig } from '../../src/types'
import { existsSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, test } from 'bun:test'
import { getAuthConfigPath, readAuthConfig, writeAuthConfig } from '../../src/lib/auth-config'

const tmpDirs: string[] = []

function makeTmpPath(): string {
  const dir = mkdtempSync(join(tmpdir(), 'gh-please-auth-'))
  tmpDirs.push(dir)
  return join(dir, 'nested', 'auth.json')
}

afterEach(() => {
  for (const dir of tmpDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('auth-config', () => {
  describe('getAuthConfigPath', () => {
    test('should point at ~/.please/auth.json', () => {
      expect(getAuthConfigPath()).toContain('.please')
      expect(getAuthConfigPath().endsWith('auth.json')).toBe(true)
    })
  })

  describe('writeAuthConfig / readAuthConfig', () => {
    test('should round-trip a config, creating parent directories', () => {
      const path = makeTmpPath()
      const config: AuthConfig = {
        appId: '123',
        installationId: '456',
        privateKeyPath: '/keys/app.pem',
        hostname: 'github.example.com',
      }

      writeAuthConfig(config, path)

      expect(existsSync(path)).toBe(true)
      expect(readAuthConfig(path)).toEqual(config)
    })

    test('should write the file with owner-only (0600) permissions', () => {
      const path = makeTmpPath()
      writeAuthConfig({ appId: '1', installationId: '2' }, path)

      const mode = statSync(path).mode & 0o777
      expect(mode).toBe(0o600)
    })

    test('should never persist a private key value', () => {
      const path = makeTmpPath()
      writeAuthConfig({ appId: '1', installationId: '2', privateKeyPath: '/keys/app.pem' }, path)

      const raw = Bun.file(path)
      // privateKeyPath(경로 참조)만 저장되고 PEM 본문 키가 없어야 한다
      const stored = readAuthConfig(path)!
      expect(stored.privateKeyPath).toBe('/keys/app.pem')
      expect(Object.keys(stored)).not.toContain('privateKey')
      void raw
    })
  })

  describe('readAuthConfig edge cases', () => {
    test('should return null when the file does not exist', () => {
      expect(readAuthConfig(makeTmpPath())).toBeNull()
    })

    test('should return null for malformed JSON', () => {
      const path = makeTmpPath()
      writeAuthConfig({ appId: '1', installationId: '2' }, path)
      writeFileSync(path, '{ not json')
      expect(readAuthConfig(path)).toBeNull()
    })

    test('should return null when required fields are missing', () => {
      const path = makeTmpPath()
      writeAuthConfig({ appId: '1', installationId: '2' }, path)
      writeFileSync(path, JSON.stringify({ appId: '1' }))
      expect(readAuthConfig(path)).toBeNull()
    })

    test('should return null when required fields have wrong types', () => {
      const path = makeTmpPath()
      writeAuthConfig({ appId: '1', installationId: '2' }, path)
      writeFileSync(path, JSON.stringify({ appId: 1, installationId: 2 }))
      expect(readAuthConfig(path)).toBeNull()
    })

    test('should return null when an optional field has a wrong type', () => {
      const path = makeTmpPath()
      writeAuthConfig({ appId: '1', installationId: '2' }, path)
      writeFileSync(path, JSON.stringify({ appId: '1', installationId: '2', hostname: 123 }))
      expect(readAuthConfig(path)).toBeNull()
    })
  })
})
