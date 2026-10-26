import { Command } from 'commander'
import { passThroughCommand } from '../../lib/gh-passthrough'
import { createGitCredentialCommand } from './git-credential'
import { createAuthLoginCommand } from './login'
import { createAuthTokenCommand } from './token'

/**
 * `gh please auth` 명령 그룹을 생성한다.
 * `gh auth`를 미러링하며, GitHub App installation token 발급/재발급과
 * git credential helper 기능을 추가한다. 등록되지 않은 하위 명령
 * (status, logout, refresh, setup-git 등)은 gh CLI로 패스스루한다.
 */
export function createAuthCommand(): Command {
  const command = new Command('auth')

  command.description('Authenticate gh and gh please with GitHub (supports GitHub App installation tokens)')

  command.addCommand(createAuthLoginCommand())
  command.addCommand(createAuthTokenCommand())
  command.addCommand(createGitCredentialCommand())

  // 등록되지 않은 하위 명령은 gh CLI로 패스스루
  command.allowUnknownOption()
  command.on('command:*', async (_operands) => {
    const subArgs = command.args.length > 0 ? command.args : process.argv.slice(3)
    await passThroughCommand(['auth', ...subArgs])
  })

  return command
}
