import type { AuthConfig, InstallationTokenResult } from '../types'
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
