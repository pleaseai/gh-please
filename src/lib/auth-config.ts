import type { AuthConfig } from '../types'
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
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
    // 필수 필드가 비어있지 않은 문자열인지 검증한다. 손상된 설정(잘못된 타입/빈 값)은
    // null로 처리해 이후 단계에서 런타임 오류가 나는 대신 "손상 => null" 계약을 지킨다.
    if (typeof parsed.appId !== 'string' || parsed.appId.trim() === ''
      || typeof parsed.installationId !== 'string' || parsed.installationId.trim() === '') {
      return null
    }
    if (parsed.privateKeyPath !== undefined && typeof parsed.privateKeyPath !== 'string') {
      return null
    }
    if (parsed.hostname !== undefined && typeof parsed.hostname !== 'string') {
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
  // mode 옵션은 파일/디렉터리를 새로 만들 때만 적용된다. 이미 존재하던 경우
  // 권한이 그대로 남으므로, 매 쓰기마다 명시적으로 0700/0600을 강제한다.
  chmodSync(dir, 0o700)
  chmodSync(path, 0o600)
}
