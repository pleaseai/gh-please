import { createVerify, generateKeyPairSync } from 'node:crypto'
import { describe, expect, test } from 'bun:test'
import {
  apiBaseUrl,
  createInstallationToken,
  generateAppJwt,
  resolveInstallationId,
  resolvePrivateKey,
} from '../../src/lib/github-app'

const TEST_APP_ID = '123456'
const FIXED_NOW = 1_700_000_000

// 테스트용 RSA 키쌍 (각 실행마다 생성해 결정적으로 검증)
const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
})

function decodeSegment(segment: string): any {
  return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'))
}

/** 가짜 fetch 응답을 만든다 */
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status })
}

describe('github-app', () => {
  describe('generateAppJwt', () => {
    test('should produce a three-part JWT with RS256 header', () => {
      const jwt = generateAppJwt({ appId: TEST_APP_ID, privateKey, now: FIXED_NOW })
      const parts = jwt.split('.')

      expect(parts).toHaveLength(3)
      expect(decodeSegment(parts[0]!)).toEqual({ alg: 'RS256', typ: 'JWT' })
    })

    test('should set iat/exp/iss with clock drift and 9-minute expiry', () => {
      const jwt = generateAppJwt({ appId: TEST_APP_ID, privateKey, now: FIXED_NOW })
      const payload = decodeSegment(jwt.split('.')[1]!)

      expect(payload.iss).toBe(TEST_APP_ID)
      expect(payload.iat).toBe(FIXED_NOW - 60)
      expect(payload.exp).toBe(FIXED_NOW + 540)
    })

    test('should produce a signature verifiable by the public key', () => {
      const jwt = generateAppJwt({ appId: TEST_APP_ID, privateKey, now: FIXED_NOW })
      const [header, payload, signature] = jwt.split('.')

      const verifier = createVerify('RSA-SHA256')
      verifier.update(`${header}.${payload}`)
      verifier.end()

      const isValid = verifier.verify(publicKey, Buffer.from(signature!, 'base64url'))
      expect(isValid).toBe(true)
    })
  })

  describe('apiBaseUrl', () => {
    test('should use api.github.com for github.com or empty hostname', () => {
      expect(apiBaseUrl()).toBe('https://api.github.com')
      expect(apiBaseUrl('github.com')).toBe('https://api.github.com')
    })

    test('should use /api/v3 path for GitHub Enterprise Server', () => {
      expect(apiBaseUrl('github.example.com')).toBe('https://github.example.com/api/v3')
    })
  })

  describe('createInstallationToken', () => {
    test('should POST to the access_tokens endpoint and return token + expiry', async () => {
      const calls: Array<{ url: string, init?: RequestInit }> = []
      const fetchImpl = (async (url: string, init?: RequestInit) => {
        calls.push({ url, init })
        return jsonResponse({ token: 'ghs_abc123', expires_at: '2026-06-25T13:00:00Z' })
      }) as unknown as typeof fetch

      const result = await createInstallationToken({ jwt: 'JWT', installationId: '789', fetchImpl })

      expect(result).toEqual({ token: 'ghs_abc123', expiresAt: '2026-06-25T13:00:00Z' })
      expect(calls[0]!.url).toBe('https://api.github.com/app/installations/789/access_tokens')
      expect(calls[0]!.init?.method).toBe('POST')
    })

    test('should throw with status when the API returns an error', async () => {
      const fetchImpl = (async () => new Response('bad creds', { status: 401 })) as unknown as typeof fetch

      await expect(
        createInstallationToken({ jwt: 'JWT', installationId: '789', fetchImpl }),
      ).rejects.toThrow('HTTP 401')
    })
  })

  describe('resolveInstallationId', () => {
    test('should resolve org installation when owner is provided', async () => {
      const fetchImpl = (async (url: string) => {
        if (url.endsWith('/orgs/pleaseai/installation')) {
          return jsonResponse({ id: 456 })
        }
        return new Response('not found', { status: 404 })
      }) as unknown as typeof fetch

      const id = await resolveInstallationId({ jwt: 'JWT', owner: 'pleaseai', fetchImpl })
      expect(id).toBe('456')
    })

    test('should fall back to user installation when org is 404', async () => {
      const fetchImpl = (async (url: string) => {
        if (url.endsWith('/users/amondnet/installation')) {
          return jsonResponse({ id: 999 })
        }
        return new Response('not found', { status: 404 })
      }) as unknown as typeof fetch

      const id = await resolveInstallationId({ jwt: 'JWT', owner: 'amondnet', fetchImpl })
      expect(id).toBe('999')
    })

    test('should auto-select when the app has exactly one installation', async () => {
      const fetchImpl = (async () => jsonResponse([{ id: 42, account: { login: 'solo' } }])) as unknown as typeof fetch

      const id = await resolveInstallationId({ jwt: 'JWT', fetchImpl })
      expect(id).toBe('42')
    })

    test('should throw listing options when multiple installations exist', async () => {
      const fetchImpl = (async () => jsonResponse([
        { id: 1, account: { login: 'a' } },
        { id: 2, account: { login: 'b' } },
      ])) as unknown as typeof fetch

      await expect(resolveInstallationId({ jwt: 'JWT', fetchImpl })).rejects.toThrow('Multiple installations found')
    })

    test('should throw when no installations exist', async () => {
      const fetchImpl = (async () => jsonResponse([])) as unknown as typeof fetch

      await expect(resolveInstallationId({ jwt: 'JWT', fetchImpl })).rejects.toThrow('No installations found')
    })
  })

  describe('resolvePrivateKey', () => {
    test('should read from the environment variable fallback', async () => {
      const key = await resolvePrivateKey({ env: { GH_APP_PRIVATE_KEY: 'PEM-FROM-ENV' } })
      expect(key).toBe('PEM-FROM-ENV')
    })

    test('should read from stdin when path is "-"', async () => {
      const key = await resolvePrivateKey({ path: '-', readStdin: async () => '  PEM-FROM-STDIN  ' })
      expect(key).toBe('PEM-FROM-STDIN')
    })

    test('should throw when stdin is empty', async () => {
      await expect(resolvePrivateKey({ path: '-', readStdin: async () => '   ' })).rejects.toThrow('stdin')
    })

    test('should throw a helpful error when no source is available', async () => {
      await expect(resolvePrivateKey({ env: {} })).rejects.toThrow('Private key required')
    })
  })
})
