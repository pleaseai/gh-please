import type { AuthConfig, InstallationTokenResult } from '../types'
import { readAuthConfig } from './auth-config'
import { createInstallationToken, generateAppJwt, resolvePrivateKey } from './github-app'

/**
 * 영속화된 GitHub App 설정으로부터 새 installation token을 발급한다.
 * installation token은 약 1시간 후 만료되므로, 항상 유효한 토큰이 필요한 경우
 * 매번 이 함수를 호출해 새로 발급한다 (재발급 기반 자동 갱신).
 */
export async function mintTokenFromConfig(
  config: AuthConfig,
  env: Record<string, string | undefined> = process.env,
): Promise<InstallationTokenResult> {
  const privateKey = await resolvePrivateKey({ path: config.privateKeyPath, env })
  const jwt = generateAppJwt({ appId: config.appId, privateKey })
  return createInstallationToken({
    jwt,
    installationId: config.installationId,
    hostname: config.hostname,
  })
}

/**
 * 저장된 설정을 읽어 새 installation token을 발급한다.
 * 설정이 없으면 안내 메시지와 함께 오류를 던진다.
 */
export async function mintTokenFromSavedConfig(
  env: Record<string, string | undefined> = process.env,
): Promise<InstallationTokenResult> {
  const config = readAuthConfig()
  if (!config) {
    throw new Error(
      'No saved GitHub App credentials found. Run `gh please auth login --app-id <id> --private-key <path>` first.',
    )
  }
  return mintTokenFromConfig(config, env)
}
