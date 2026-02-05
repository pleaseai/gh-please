import { describe, expect, test } from 'bun:test'
import {
  createWorktree,
  createWorktreeFromRepo,
  fetchBranch,
  getLinkedBranch,
  listWorktrees,
  removeWorktree,
  startDevelopWorkflow,
} from '../../src/lib/git-workflow'

describe('getLinkedBranch', () => {
  test('should export getLinkedBranch function', () => {
    expect(typeof getLinkedBranch).toBe('function')
  })
})

describe('startDevelopWorkflow', () => {
  test('should export startDevelopWorkflow function', () => {
    expect(typeof startDevelopWorkflow).toBe('function')
  })
})

describe('createWorktree', () => {
  test('should export createWorktree function', () => {
    expect(typeof createWorktree).toBe('function')
  })
})

describe('createWorktreeFromRepo', () => {
  test('should export createWorktreeFromRepo function', () => {
    expect(typeof createWorktreeFromRepo).toBe('function')
  })
})

describe('fetchBranch', () => {
  test('should export fetchBranch function', () => {
    expect(typeof fetchBranch).toBe('function')
  })
})

describe('listWorktrees', () => {
  test('should export listWorktrees function', () => {
    expect(typeof listWorktrees).toBe('function')
  })
})

describe('removeWorktree', () => {
  test('should export removeWorktree function', () => {
    expect(typeof removeWorktree).toBe('function')
  })
})
