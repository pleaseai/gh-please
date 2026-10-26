import { describe, expect, test } from 'bun:test'
import { createGitCredentialCommand, parseCredentialInput } from '../../../src/commands/auth/git-credential'

describe('git-credential command', () => {
  test('should create a command named "git-credential"', () => {
    expect(createGitCredentialCommand().name()).toBe('git-credential')
  })

  describe('parseCredentialInput', () => {
    test('should parse git credential key=value lines into a map', () => {
      const input = 'protocol=https\nhost=github.com\npath=owner/repo.git\n'
      expect(parseCredentialInput(input)).toEqual({
        protocol: 'https',
        host: 'github.com',
        path: 'owner/repo.git',
      })
    })

    test('should keep values containing "=" intact', () => {
      expect(parseCredentialInput('url=https://x?a=b')).toEqual({ url: 'https://x?a=b' })
    })

    test('should ignore blank and malformed lines', () => {
      expect(parseCredentialInput('\nhost=github.com\ngarbage\n\n')).toEqual({ host: 'github.com' })
    })
  })
})
