/**
 * Comprehensive tests for git-workflow-worktree.ts
 *
 * These tests verify git command arguments and error handling by mocking
 * the runGitCommand function. Run with:
 *   bun test test/lib/git-workflow-worktree.test.ts --preload test/lib/git-workflow-worktree.preload.ts
 */
import { afterEach, describe, expect, test } from 'bun:test'
import {
  createWorktree,
  createWorktreeFromRepo,
  listWorktrees,
  removeWorktree,
} from '../../src/lib/git-workflow-worktree'
import {
  mockRunGitCommand,
  mockWarnWithFollowup,
} from './git-workflow-worktree.preload'

afterEach(() => {
  mockRunGitCommand.mockClear()
  mockWarnWithFollowup.mockClear()
})

describe('createWorktree (bare repo)', () => {
  test('should call git worktree add with correct arguments', async () => {
    mockRunGitCommand.mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' })

    await createWorktree('/path/to/bare.git', 'feature-branch', '/tmp/worktree')

    expect(mockRunGitCommand).toHaveBeenCalledWith([
      'git',
      '-C',
      '/path/to/bare.git',
      'worktree',
      'add',
      '/tmp/worktree',
      'feature-branch',
    ])
  })

  test('should throw error when git worktree add fails', async () => {
    mockRunGitCommand.mockResolvedValueOnce({
      exitCode: 1,
      stdout: '',
      stderr: 'fatal: worktree already exists',
    })

    expect(createWorktree('/path/to/bare.git', 'feature', '/tmp/wt'))
      .rejects
      .toThrow('Failed to create worktree: fatal: worktree already exists')
  })

  test('should expand tilde in target path', async () => {
    const originalHome = process.env.HOME
    process.env.HOME = '/home/testuser'

    mockRunGitCommand.mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' })

    await createWorktree('/path/to/bare.git', 'branch', '~/worktrees/test')

    expect(mockRunGitCommand).toHaveBeenCalledWith([
      'git',
      '-C',
      '/path/to/bare.git',
      'worktree',
      'add',
      '/home/testuser/worktrees/test',
      'branch',
    ])

    process.env.HOME = originalHome
  })

  test('should throw error when HOME is undefined and path starts with tilde', async () => {
    const originalHome = process.env.HOME
    delete process.env.HOME

    try {
      expect(createWorktree('/path/to/bare.git', 'branch', '~/worktrees/test'))
        .rejects
        .toThrow('Cannot expand ~: HOME environment variable is not set')
    }
    finally {
      process.env.HOME = originalHome
    }
  })
})

describe('createWorktreeFromRepo (cloned repo)', () => {
  test('should fetch with explicit refspec to update remote-tracking branch', async () => {
    // Step 1: Fetch succeeds
    mockRunGitCommand.mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' })
    // Step 2: Branch update succeeds
    mockRunGitCommand.mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' })
    // Step 3: Branch exists check
    mockRunGitCommand.mockResolvedValueOnce({ exitCode: 0, stdout: 'abc123', stderr: '' })
    // Step 4: Worktree add succeeds
    mockRunGitCommand.mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' })
    // Step 5: Set upstream tracking succeeds
    mockRunGitCommand.mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' })

    await createWorktreeFromRepo('/path/to/.git', 'feature-123', '/tmp/worktree')

    // Verify fetch uses explicit refspec
    expect(mockRunGitCommand.mock.calls[0]).toEqual([[
      'git',
      '--git-dir',
      '/path/to/.git',
      'fetch',
      'origin',
      'feature-123:refs/remotes/origin/feature-123',
    ]])

    // Verify local branch update with -f flag
    expect(mockRunGitCommand.mock.calls[1]).toEqual([[
      'git',
      '--git-dir',
      '/path/to/.git',
      'branch',
      '-f',
      'feature-123',
      'refs/remotes/origin/feature-123',
    ]])
  })

  test('should use existing local branch when it exists', async () => {
    mockRunGitCommand.mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' }) // fetch
    mockRunGitCommand.mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' }) // branch -f
    mockRunGitCommand.mockResolvedValueOnce({ exitCode: 0, stdout: 'abc123', stderr: '' }) // branch exists
    mockRunGitCommand.mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' }) // worktree add
    mockRunGitCommand.mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' }) // set upstream

    await createWorktreeFromRepo('/path/to/.git', 'existing-branch', '/tmp/wt')

    // Worktree add should use existing branch (no -b flag)
    expect(mockRunGitCommand.mock.calls[3]).toEqual([[
      'git',
      '--git-dir',
      '/path/to/.git',
      'worktree',
      'add',
      '/tmp/wt',
      'existing-branch',
    ]])
  })

  test('should create new branch from origin when local branch does not exist', async () => {
    mockRunGitCommand.mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' }) // fetch
    mockRunGitCommand.mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' }) // branch -f
    mockRunGitCommand.mockResolvedValueOnce({ exitCode: 1, stdout: '', stderr: 'fatal: not found' }) // branch not exists
    mockRunGitCommand.mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' }) // worktree add
    mockRunGitCommand.mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' }) // set upstream

    await createWorktreeFromRepo('/path/to/.git', 'new-branch', '/tmp/wt')

    // Worktree add should create new branch with -b flag
    expect(mockRunGitCommand.mock.calls[3]).toEqual([[
      'git',
      '--git-dir',
      '/path/to/.git',
      'worktree',
      'add',
      '-b',
      'new-branch',
      '/tmp/wt',
      'origin/new-branch',
    ]])
  })

  test('should warn when fetch fails (not local-only branch)', async () => {
    mockRunGitCommand.mockResolvedValueOnce({
      exitCode: 1,
      stdout: '',
      stderr: 'fatal: network error',
    }) // fetch fails
    mockRunGitCommand.mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' }) // branch -f
    mockRunGitCommand.mockResolvedValueOnce({ exitCode: 0, stdout: 'abc123', stderr: '' }) // branch exists
    mockRunGitCommand.mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' }) // worktree add
    mockRunGitCommand.mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' }) // set upstream

    await createWorktreeFromRepo('/path/to/.git', 'branch', '/tmp/wt')

    // Should warn about fetch failure
    expect(mockWarnWithFollowup).toHaveBeenCalledWith(
      'Could not fetch latest changes from remote: fatal: network error',
      'Proceeding with local branch state. Your worktree may not have the latest remote changes.',
    )
  })

  test('should not warn when fetch fails due to local-only branch', async () => {
    mockRunGitCommand.mockResolvedValueOnce({
      exitCode: 1,
      stdout: '',
      stderr: 'fatal: couldn\'t find remote ref local-only-branch',
    }) // fetch fails - local only
    mockRunGitCommand.mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' }) // branch -f
    mockRunGitCommand.mockResolvedValueOnce({ exitCode: 0, stdout: 'abc123', stderr: '' }) // branch exists
    mockRunGitCommand.mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' }) // worktree add
    mockRunGitCommand.mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' }) // set upstream

    await createWorktreeFromRepo('/path/to/.git', 'local-only-branch', '/tmp/wt')

    // Should NOT warn for local-only branches
    expect(mockWarnWithFollowup).not.toHaveBeenCalled()
  })

  test('should warn when branch update fails (not local-only)', async () => {
    mockRunGitCommand.mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' }) // fetch succeeds
    mockRunGitCommand.mockResolvedValueOnce({
      exitCode: 1,
      stdout: '',
      stderr: 'fatal: Unable to create lock file',
    }) // branch -f fails (lock file error)
    mockRunGitCommand.mockResolvedValueOnce({ exitCode: 0, stdout: 'abc123', stderr: '' }) // branch exists
    mockRunGitCommand.mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' }) // worktree add
    mockRunGitCommand.mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' }) // set upstream

    await createWorktreeFromRepo('/path/to/.git', 'branch', '/tmp/wt')

    // Should warn about branch update failure
    expect(mockWarnWithFollowup).toHaveBeenCalledWith(
      'Could not update local branch \'branch\': fatal: Unable to create lock file',
      'The worktree will be created, but may not have the latest remote changes.',
    )
  })

  test('should not warn when branch update fails due to local-only branch', async () => {
    mockRunGitCommand.mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' }) // fetch succeeds
    mockRunGitCommand.mockResolvedValueOnce({
      exitCode: 1,
      stdout: '',
      stderr: 'fatal: not a valid object name',
    }) // branch -f fails (local-only - remote ref doesn't exist)
    mockRunGitCommand.mockResolvedValueOnce({ exitCode: 0, stdout: 'abc123', stderr: '' }) // branch exists
    mockRunGitCommand.mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' }) // worktree add
    mockRunGitCommand.mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' }) // set upstream

    await createWorktreeFromRepo('/path/to/.git', 'local-branch', '/tmp/wt')

    // Should NOT warn for local-only branches
    expect(mockWarnWithFollowup).not.toHaveBeenCalled()
  })

  test('should warn when upstream tracking setup fails', async () => {
    mockRunGitCommand.mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' }) // fetch
    mockRunGitCommand.mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' }) // branch -f
    mockRunGitCommand.mockResolvedValueOnce({ exitCode: 0, stdout: 'abc123', stderr: '' }) // branch exists
    mockRunGitCommand.mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' }) // worktree add
    mockRunGitCommand.mockResolvedValueOnce({
      exitCode: 1,
      stdout: '',
      stderr: 'fatal: no upstream configured',
    }) // set upstream fails

    await createWorktreeFromRepo('/path/to/.git', 'branch', '/tmp/wt')

    expect(mockWarnWithFollowup).toHaveBeenCalledWith(
      'Could not set upstream tracking: fatal: no upstream configured',
      'You may need to run: git push --set-upstream origin branch',
    )
  })

  test('should throw error when worktree add fails', async () => {
    mockRunGitCommand.mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' }) // fetch
    mockRunGitCommand.mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' }) // branch -f
    mockRunGitCommand.mockResolvedValueOnce({ exitCode: 0, stdout: 'abc123', stderr: '' }) // branch exists
    mockRunGitCommand.mockResolvedValueOnce({
      exitCode: 1,
      stdout: '',
      stderr: 'fatal: worktree already in use',
    }) // worktree add fails

    expect(createWorktreeFromRepo('/path/to/.git', 'branch', '/tmp/wt'))
      .rejects
      .toThrow('Failed to create worktree at \'/tmp/wt\' for branch \'branch\': fatal: worktree already in use')
  })
})

describe('listWorktrees', () => {
  test('should parse porcelain output correctly', async () => {
    const porcelainOutput = `worktree /path/to/main
HEAD abc123def456
branch refs/heads/main

worktree /path/to/feature
HEAD def456abc789
branch refs/heads/feature-123

worktree /path/to/detached
HEAD 111222333444
detached

worktree /path/to/prunable
HEAD 555666777888
branch refs/heads/old-branch
prunable
`
    mockRunGitCommand.mockResolvedValueOnce({
      exitCode: 0,
      stdout: porcelainOutput,
      stderr: '',
    })

    const result = await listWorktrees('/path/to/bare.git')

    expect(result).toHaveLength(4)
    expect(result[0]).toEqual({
      path: '/path/to/main',
      branch: 'main',
      commit: 'abc123def456',
      prunable: false,
    })
    expect(result[1]).toEqual({
      path: '/path/to/feature',
      branch: 'feature-123',
      commit: 'def456abc789',
      prunable: false,
    })
    expect(result[2]).toEqual({
      path: '/path/to/detached',
      branch: 'detached',
      commit: '111222333444',
      prunable: false,
    })
    expect(result[3]).toEqual({
      path: '/path/to/prunable',
      branch: 'old-branch',
      commit: '555666777888',
      prunable: true,
    })
  })

  test('should return empty array and warn when git worktree list fails', async () => {
    mockRunGitCommand.mockResolvedValueOnce({
      exitCode: 1,
      stdout: '',
      stderr: 'fatal: not a git repository',
    })

    const result = await listWorktrees('/invalid/path')

    expect(result).toEqual([])
    expect(mockWarnWithFollowup).toHaveBeenCalledWith(
      'Could not list worktrees for /invalid/path: fatal: not a git repository',
      'Worktree listing may be incomplete. Check if the repository path is correct.',
    )
  })

  test('should handle worktree paths with spaces', async () => {
    const porcelainOutput = `worktree /path/with spaces/worktree
HEAD abc123
branch refs/heads/main
`
    mockRunGitCommand.mockResolvedValueOnce({
      exitCode: 0,
      stdout: porcelainOutput,
      stderr: '',
    })

    const result = await listWorktrees('/path/to/bare.git')

    expect(result[0]?.path).toBe('/path/with spaces/worktree')
  })
})

describe('removeWorktree', () => {
  test('should call git worktree remove with correct path', async () => {
    mockRunGitCommand.mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' })

    await removeWorktree('/path/to/worktree')

    expect(mockRunGitCommand).toHaveBeenCalledWith([
      'git',
      'worktree',
      'remove',
      '/path/to/worktree',
    ])
  })

  test('should throw error when removal fails', async () => {
    mockRunGitCommand.mockResolvedValueOnce({
      exitCode: 1,
      stdout: '',
      stderr: 'fatal: worktree has uncommitted changes',
    })

    expect(removeWorktree('/path/to/worktree'))
      .rejects
      .toThrow('Failed to remove worktree: fatal: worktree has uncommitted changes')
  })
})
