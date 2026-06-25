import type { AuthConfig } from '../types'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

/** 설정 디렉터리 (~/.please) */
function configDir(): string {
  return join(homedir(), '.please')
}

/**
 * GitHub App 인증 설정 파일 경로를 반환한다.
 */
export function getAuthConfigPath(): string {
  return join(configDir(), 'auth.json')
}

/**
 * 영속화된 GitHub App 인증 설정을 읽는다. 없거나 손상된 경우 null을 반환한다.
 */
export function readAuthConfig(path: string = getAuthConfigPath()): AuthConfig | null {
  if (!existsSync(path)) {
    return null
  }
  try {
    const raw = readFileSync(path, 'utf8')
    const parsed = JSON.parse(raw) as Partial<AuthConfig>
    if (!parsed.appId || !parsed.installationId) {
      return null
    }
    return parsed as AuthConfig
  }
  catch {
    return null
  }
}

/**
 * GitHub App 인증 설정을 영속화한다.
 * 비밀 값(private key)은 저장하지 않으며, 파일은 소유자 전용(0600) 권한으로 기록한다.
 */
export function writeAuthConfig(config: AuthConfig, path: string = getAuthConfigPath()): void {
  const dir = dirname(path)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true, mode: 0o700 })
  }
  writeFileSync(path, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 })
}
