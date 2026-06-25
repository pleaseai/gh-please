import type { AuthMessages } from '../../lib/i18n'
import type { AppLoginOptions, AuthConfig } from '../../types'
import { Command } from 'commander'
import { writeAuthConfig } from '../../lib/auth-config'
import { createInstallationToken, generateAppJwt, resolveInstallationId, resolvePrivateKey } from '../../lib/github-app'
import { detectSystemLanguage, getAuthMessages } from '../../lib/i18n'

/** 테스트에서 gh 명령을 주입할 수 있도록 환경 변수 또는 기본값을 사용한다 */
function getGhCommand(): string {
  return process.env.GH_PATH || 'gh'
}

/**
 * 표준 `gh auth login` 동작을 그대로 미러링한다 (대화형 브라우저/토큰 플로우).
 * stdio를 상속해 TTY 기반 프롬프트가 정상 동작하도록 한다.
 */
async function mirrorGhAuthLogin(): Promise<never> {
  const argv = process.argv
  const idx = argv.indexOf('auth')
  const args = idx >= 0 ? argv.slice(idx) : ['auth', 'login']

  const proc = Bun.spawn([getGhCommand(), ...args], {
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  })
  const exitCode = await proc.exited
  process.exit(exitCode)
}

/**
 * 발급한 토큰을 `gh auth login --with-token`으로 파이프해 gh 자격 증명 저장소에 저장한다.
 */
async function storeTokenInGh(token: string, hostname?: string): Promise<void> {
  const args = ['auth', 'login', '--with-token']
  if (hostname) {
    args.push('--hostname', hostname)
  }
  const proc = Bun.spawn([getGhCommand(), ...args], {
    stdin: 'pipe',
    stdout: 'pipe',
    stderr: 'pipe',
  })
  proc.stdin.write(token)
  await proc.stdin.end()

  const exitCode = await proc.exited
  if (exitCode !== 0) {
    const error = await new Response(proc.stderr).text()
    throw new Error(`gh auth login --with-token failed: ${error.trim()}`)
  }
}

/** git credential helper 등록용 git config 명령 문자열을 만든다 */
export function buildGitHelperCommand(hostname?: string): string {
  const host = hostname || 'github.com'
  return `git config --global credential.https://${host}.helper '!gh-please auth git-credential'`
}

/** git credential helper를 전역 git 설정에 등록한다 */
async function setupGitHelper(hostname?: string): Promise<void> {
  const host = hostname || 'github.com'
  const proc = Bun.spawn(
    ['git', 'config', '--global', `credential.https://${host}.helper`, '!gh-please auth git-credential'],
    { stdout: 'pipe', stderr: 'pipe' },
  )
  const exitCode = await proc.exited
  if (exitCode !== 0) {
    const error = await new Response(proc.stderr).text()
    throw new Error(`Failed to configure git credential helper: ${error.trim()}`)
  }
}

/**
 * GitHub App installation token 플로우를 실행한다.
 * private key로 JWT를 만들고 installation token을 발급한 뒤, 저장 또는 인쇄한다.
 * 재발급을 위해 App 설정(비밀 값 제외)을 영속화한다.
 */
async function runAppLogin(options: AppLoginOptions, msg: AuthMessages): Promise<void> {
  const privateKey = await resolvePrivateKey({ path: options.privateKey })
  const appId = options.appId!
  const jwt = generateAppJwt({ appId, privateKey })

  let installationId = options.installationId
  if (!installationId) {
    console.error(msg.resolvingInstallation)
    installationId = await resolveInstallationId({ jwt, owner: options.owner, hostname: options.hostname })
  }

  console.error(msg.mintingToken)
  const { token, expiresAt } = await createInstallationToken({ jwt, installationId, hostname: options.hostname })

  // 재발급(자동 갱신) 가능하도록 설정을 저장한다. private key 경로일 때만 영속화 가능.
  if (options.privateKey && options.privateKey !== '-') {
    const config: AuthConfig = { appId, installationId, privateKeyPath: options.privateKey }
    if (options.hostname) {
      config.hostname = options.hostname
    }
    writeAuthConfig(config)
  }

  if (options.printToken) {
    process.stdout.write(token)
    console.error(msg.tokenExpiresAt(expiresAt))
    return
  }

  await storeTokenInGh(token, options.hostname)
  console.log(msg.appLoginSuccess(installationId, expiresAt))

  if (options.setupGit) {
    await setupGitHelper(options.hostname)
    console.log(msg.gitHelperConfigured(options.hostname || 'github.com'))
  }
  else {
    console.log(msg.gitHelperHint(buildGitHelperCommand(options.hostname)))
  }
}

/**
 * `gh please auth login` 명령을 생성한다.
 * App 플래그가 없으면 `gh auth login`을 미러링하고, 있으면 installation token 플로우를 실행한다.
 */
export function createAuthLoginCommand(): Command {
  const command = new Command('login')
    .description('Authenticate with GitHub (mirrors `gh auth login`, adds GitHub App installation token support)')
    .option('--app-id <id>', 'GitHub App ID or Client ID (enables App installation token mode)')
    .option('--private-key <path>', 'Path to App private key PEM (use \'-\' for stdin, or set GH_APP_PRIVATE_KEY)')
    .option('--installation-id <id>', 'Target installation ID')
    .option('--owner <owner>', 'Org or user to auto-resolve the installation from')
    .option('--hostname <host>', 'GitHub hostname (for GitHub Enterprise Server)')
    .option('--print-token', 'Print the installation token to stdout instead of storing it')
    .option('--setup-git', 'Configure git credential helper for transparent token auto-refresh')
    .allowUnknownOption()
    .allowExcessArguments()
    .action(async (options: AppLoginOptions) => {
      const lang = detectSystemLanguage()
      const msg = getAuthMessages(lang)

      if (!options.appId) {
        await mirrorGhAuthLogin()
        return
      }

      try {
        await runAppLogin(options, msg)
      }
      catch (error) {
        console.error(`${msg.errorPrefix}: ${error instanceof Error ? error.message : msg.unknownError}`)
        process.exit(1)
      }
    })

  return command
}
