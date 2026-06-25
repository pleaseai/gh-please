import { describe, expect, test } from 'bun:test'
import { buildGitHelperCommand, createAuthLoginCommand } from '../../../src/commands/auth/login'

describe('auth login command', () => {
  test('should export createAuthLoginCommand function', () => {
    expect(typeof createAuthLoginCommand).toBe('function')
  })

  test('should create a command named "login"', () => {
    expect(createAuthLoginCommand().name()).toBe('login')
  })

  test('should document the GitHub App and mirror behavior', () => {
    expect(createAuthLoginCommand().description()).toContain('GitHub App')
  })

  test('should expose the App installation token options', () => {
    const help = createAuthLoginCommand().helpInformation()
    for (const flag of ['--app-id', '--private-key', '--installation-id', '--owner', '--hostname', '--print-token', '--setup-git']) {
      expect(help).toContain(flag)
    }
  })

  describe('buildGitHelperCommand', () => {
    test('should target github.com by default', () => {
      const cmd = buildGitHelperCommand()
      expect(cmd).toContain('credential.https://github.com.helper')
      expect(cmd).toContain('!gh-please auth git-credential')
    })

    test('should target a custom hostname for GHES', () => {
      expect(buildGitHelperCommand('github.example.com')).toContain('credential.https://github.example.com.helper')
    })
  })
})
