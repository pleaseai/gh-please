import { describe, expect, test } from 'bun:test'
import {
  createWorktree,
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
