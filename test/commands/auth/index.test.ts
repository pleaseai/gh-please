import { describe, expect, test } from 'bun:test'
import { createAuthCommand } from '../../../src/commands/auth'
import { createGitCredentialCommand } from '../../../src/commands/auth/git-credential'
import { createAuthTokenCommand } from '../../../src/commands/auth/token'

describe('auth command group', () => {
  test('should create a command named "auth"', () => {
    expect(createAuthCommand().name()).toBe('auth')
  })

  test('should register login, token, and git-credential subcommands', () => {
    const names = createAuthCommand().commands.map(c => c.name())
    expect(names).toContain('login')
    expect(names).toContain('token')
    expect(names).toContain('git-credential')
  })

  test('should mention GitHub App support in its description', () => {
    expect(createAuthCommand().description()).toContain('GitHub App')
  })
})

describe('auth token command', () => {
  test('should create a command named "token"', () => {
    expect(createAuthTokenCommand().name()).toBe('token')
  })

  test('should describe minting from saved credentials', () => {
    expect(createAuthTokenCommand().description()).toContain('installation token')
  })
})

describe('auth git-credential command', () => {
  test('should create a command named "git-credential"', () => {
    expect(createGitCredentialCommand().name()).toBe('git-credential')
  })

  test('should require an operation argument', () => {
    expect(createGitCredentialCommand().usage()).toContain('operation')
  })
})
