import { Command } from 'commander'
import { mintTokenFromConfig } from '../../lib/app-auth'
import { readAuthConfig } from '../../lib/auth-config'
import { executeGhCommand } from '../../lib/gh-passthrough'
import { detectSystemLanguage, getAuthMessages } from '../../lib/i18n'

/**
 * 저장된 App 설정이 없을 때 네이티브 `gh auth token`으로 패스스루한다.
 * 원본 인자(예: --hostname)를 그대로 전달해 미러링 동작을 유지한다.
 */
async function mirrorGhAuthToken(): Promise<never> {
  const argv = process.argv
  const idx = argv.indexOf('auth')
  const args = idx >= 0 ? argv.slice(idx) : ['auth', 'token']

  const result = await executeGhCommand(args)
  if (result.stdout) {
    process.stdout.write(result.stdout)
  }
  if (result.stderr) {
    process.stderr.write(result.stderr)
  }
  process.exit(result.exitCode)
}

/**
 * `gh please auth token` 명령을 생성한다.
 * 저장된 GitHub App 설정이 있으면 새 installation token을 발급해 표준 출력으로 인쇄하고
 * (`export GH_TOKEN=$(gh please auth token)`), 없으면 네이티브 `gh auth token`을 미러링한다.
 */
export function createAuthTokenCommand(): Command {
  const command = new Command('token')
    .description('Mint a fresh GitHub App installation token from saved credentials, or mirror `gh auth token`')
    .allowUnknownOption()
    .action(async () => {
      const lang = detectSystemLanguage()
      const msg = getAuthMessages(lang)

      const config = readAuthConfig()
      if (!config) {
        await mirrorGhAuthToken()
        return
      }

      try {
        const { token } = await mintTokenFromConfig(config)
        process.stdout.write(token)
      }
      catch (error) {
        console.error(`${msg.errorPrefix}: ${error instanceof Error ? error.message : msg.unknownError}`)
        process.exit(1)
      }
    })

  return command
}
