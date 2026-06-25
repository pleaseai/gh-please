import type { InstallationTokenResult, ResolvePrivateKeyOptions } from '../types'
import { createSign } from 'node:crypto'
import { readFileSync } from 'node:fs'

/**
 * GitHub App JWT 만료 시간 (초). GitHub 최대값은 10분이며, 시계 오차를 고려해 9분을 사용한다.
 */
const JWT_EXPIRY_SECONDS = 9 * 60
/**
 * iat 클럭 드리프트 보정값 (초). 발급 시각을 60초 앞당겨 GitHub 시계와의 오차를 흡수한다.
 */
const JWT_CLOCK_DRIFT_SECONDS = 60
/** 기본 private key 환경 변수 이름 */
const DEFAULT_PRIVATE_KEY_ENV = 'GH_APP_PRIVATE_KEY'

/**
 * Base64URL 인코딩 (패딩 없음)
 */
function base64url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input
  return buf.toString('base64url')
}

/**
 * GitHub App 인증용 JWT 생성 파라미터
 */
export interface AppJwtParams {
  /** GitHub App ID 또는 Client ID */
  appId: string
  /** PEM 형식의 App private key */
  privateKey: string
  /** 발급 기준 시각 (Unix 초). 테스트 결정성을 위해 주입 가능 */
  now?: number
}

/**
 * GitHub App private key로 서명한 RS256 JWT를 생성한다.
 * 이 JWT는 installation access token 발급 등 App 수준 API 호출에 사용된다.
 */
export function generateAppJwt(params: AppJwtParams): string {
  const { appId, privateKey } = params
  const now = params.now ?? Math.floor(Date.now() / 1000)

  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iat: now - JWT_CLOCK_DRIFT_SECONDS,
    exp: now + JWT_EXPIRY_SECONDS,
    iss: appId,
  }

  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`
  const signer = createSign('RSA-SHA256')
  signer.update(signingInput)
  signer.end()
  const signature = signer.sign(privateKey)

  return `${signingInput}.${base64url(signature)}`
}

/**
 * 호스트명으로부터 GitHub REST API base URL을 계산한다.
 * github.com은 api.github.com, GitHub Enterprise Server는 https://<host>/api/v3 형식이다.
 */
export function apiBaseUrl(hostname?: string): string {
  if (!hostname || hostname === 'github.com') {
    return 'https://api.github.com'
  }
  return `https://${hostname}/api/v3`
}

/**
 * App JWT로 인증하는 요청의 공통 헤더를 만든다.
 */
function appJwtHeaders(jwt: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${jwt}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'gh-please',
  }
}

/**
 * installation token 발급 파라미터
 */
export interface CreateInstallationTokenParams {
  jwt: string
  installationId: string | number
  hostname?: string
  /** 테스트용 fetch 주입 (기본: 전역 fetch) */
  fetchImpl?: typeof fetch
}

/**
 * App JWT를 사용해 installation access token을 발급한다.
 * 발급된 토큰은 약 1시간 후 만료된다.
 */
export async function createInstallationToken(
  params: CreateInstallationTokenParams,
): Promise<InstallationTokenResult> {
  const { jwt, installationId, hostname, fetchImpl = fetch } = params
  const url = `${apiBaseUrl(hostname)}/app/installations/${installationId}/access_tokens`

  const res = await fetchImpl(url, { method: 'POST', headers: appJwtHeaders(jwt) })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to create installation token (HTTP ${res.status}): ${text.trim()}`)
  }

  const data = await res.json() as { token: string, expires_at: string }
  return { token: data.token, expiresAt: data.expires_at }
}

/**
 * installation 조회 파라미터
 */
export interface ResolveInstallationParams {
  jwt: string
  /** org 또는 user 이름. 지정 시 해당 소유자의 installation을 조회한다 */
  owner?: string
  hostname?: string
  fetchImpl?: typeof fetch
}

/**
 * owner의 installation ID를 조회한다 (org → user 순서로 시도).
 */
async function lookupOwnerInstallation(
  base: string,
  owner: string,
  headers: Record<string, string>,
  fetchImpl: typeof fetch,
): Promise<string> {
  for (const path of [`/orgs/${owner}/installation`, `/users/${owner}/installation`]) {
    const res = await fetchImpl(`${base}${path}`, { headers })
    if (res.ok) {
      const data = await res.json() as { id: number }
      return String(data.id)
    }
    if (res.status !== 404) {
      const text = await res.text()
      throw new Error(`Failed to look up installation for "${owner}" (HTTP ${res.status}): ${text.trim()}`)
    }
  }
  throw new Error(`No installation found for owner "${owner}"`)
}

/**
 * 대상 installation ID를 결정한다.
 * - owner 지정: 해당 소유자의 installation 조회
 * - owner 미지정: App의 installation 목록을 조회해 정확히 1개면 자동 선택, 여러 개면 오류
 */
export async function resolveInstallationId(params: ResolveInstallationParams): Promise<string> {
  const { jwt, owner, hostname, fetchImpl = fetch } = params
  const base = apiBaseUrl(hostname)
  const headers = appJwtHeaders(jwt)

  if (owner) {
    return lookupOwnerInstallation(base, owner, headers, fetchImpl)
  }

  const res = await fetchImpl(`${base}/app/installations`, { headers })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to list installations (HTTP ${res.status}): ${text.trim()}`)
  }

  const installs = await res.json() as Array<{ id: number, account?: { login?: string } }>
  if (!Array.isArray(installs) || installs.length === 0) {
    throw new Error('No installations found for this App')
  }
  if (installs.length > 1) {
    const list = installs.map(i => `  ${i.id} (${i.account?.login ?? 'unknown'})`).join('\n')
    throw new Error(`Multiple installations found; specify --installation-id or --owner:\n${list}`)
  }
  return String(installs[0]!.id)
}

/**
 * 표준 입력에서 전체 내용을 읽는다.
 */
async function defaultReadStdin(): Promise<string> {
  return await new Response(Bun.stdin.stream()).text()
}

/**
 * private key를 우선순위에 따라 해석한다.
 * 1. path === '-' : 표준 입력에서 읽기
 * 2. path 지정    : 파일에서 읽기
 * 3. 환경 변수    : GH_APP_PRIVATE_KEY (기본)
 * 비밀 값을 다루므로 어디에서도 로깅하지 않는다.
 */
export async function resolvePrivateKey(options: ResolvePrivateKeyOptions = {}): Promise<string> {
  const {
    path,
    envVarName = DEFAULT_PRIVATE_KEY_ENV,
    env = process.env,
    readStdin = defaultReadStdin,
  } = options

  if (path === '-') {
    const key = (await readStdin()).trim()
    if (!key) {
      throw new Error('No private key received on stdin')
    }
    return key
  }

  if (path) {
    return readFileSync(path, 'utf8')
  }

  const fromEnv = env[envVarName]
  if (fromEnv && fromEnv.trim()) {
    return fromEnv
  }

  throw new Error(
    `Private key required: pass --private-key <path>, --private-key - (stdin), or set ${envVarName}`,
  )
}
