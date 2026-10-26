import { Command } from 'commander'
import { mintTokenFromConfig } from '../../lib/app-auth'
import { readAuthConfig } from '../../lib/auth-config'
import { detectSystemLanguage, getAuthMessages } from '../../lib/i18n'

/** GitHub App installation token의 git 사용자명 (고정값) */
const APP_TOKEN_USERNAME = 'x-access-token'

/**
 * git credential 프로토콜 입력(key=value 줄)을 파싱한다.
 */
export function parseCredentialInput(input: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const line of input.split('\n')) {
    const eq = line.indexOf('=')
    if (eq === -1) {
      continue
    }
    const key = line.slice(0, eq)
    if (key) {
      result[key] = line.slice(eq + 1)
    }
  }
  return result
}

/**
 * git credential helper의 `get` 동작을 처리한다.
 * 요청한 host/protocol이 저장된 설정과 일치할 때만 새 토큰을 발급해 인쇄한다.
 * 매 호출마다 새로 발급하므로 git 작업 시 토큰이 투명하게 자동 갱신된다.
 */
async function handleGet(): Promise<void> {
  const input = await new Response(Bun.stdin.stream()).text()
  const request = parseCredentialInput(input)

  const config = readAuthConfig()
  if (!config) {
    throw new Error(
      'No saved GitHub App credentials found. Run `gh please auth login --app-id <id> --private-key <path>` first.',
    )
  }

  // 저장된 호스트(또는 github.com)와 https가 아닌 요청에는 토큰을 제공하지 않는다.
  // 아무것도 출력하지 않으면 git이 다음 credential helper로 넘어간다 → App 토큰이
  // 무관한 호스트로 새어 나가는 것을 방지한다.
  const expectedHost = config.hostname || 'github.com'
  if (request.protocol && request.protocol !== 'https') {
    return
  }
  if (request.host && request.host !== expectedHost) {
    return
  }

  const { token } = await mintTokenFromConfig(config)
  process.stdout.write(`username=${APP_TOKEN_USERNAME}\npassword=${token}\n`)
}

/**
 * `gh please auth git-credential <operation>` 명령을 생성한다.
 * git credential helper 프로토콜을 구현한다. `!gh-please auth git-credential` 형태로
 * git에 등록하면 git이 자격 증명이 필요할 때마다 새 토큰을 발급받는다.
 */
export function createGitCredentialCommand(): Command {
  const command = new Command('git-credential')
    .description('git credential helper providing auto-refreshing GitHub App tokens')
    .argument('<operation>', 'git credential operation: get, store, or erase')
    .action(async (operation: string) => {
      const lang = detectSystemLanguage()
      const msg = getAuthMessages(lang)

      // store/erase는 매번 재발급하므로 영속화할 것이 없다. stdin을 소비하고 종료한다.
      if (operation !== 'get') {
        await new Response(Bun.stdin.stream()).text()
        return
      }

      try {
        await handleGet()
      }
      catch (error) {
        console.error(`${msg.errorPrefix}: ${error instanceof Error ? error.message : msg.unknownError}`)
        process.exit(1)
      }
    })

  return command
}
