import { Command } from 'commander'
import { mintTokenFromSavedConfig } from '../../lib/app-auth'
import { detectSystemLanguage, getAuthMessages } from '../../lib/i18n'

/** GitHub App installation token의 git 사용자명 (고정값) */
const APP_TOKEN_USERNAME = 'x-access-token'

/**
 * git credential helper의 `get` 동작을 처리한다.
 * 저장된 설정으로 새 토큰을 발급해 git credential 프로토콜 형식으로 인쇄한다.
 * 매 호출마다 새로 발급하므로 git 작업 시 토큰이 투명하게 자동 갱신된다.
 */
async function handleGet(): Promise<void> {
  // git이 stdin으로 보낸 속성을 소비한다 (값은 사용하지 않음)
  await new Response(Bun.stdin.stream()).text()

  const { token } = await mintTokenFromSavedConfig()
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
