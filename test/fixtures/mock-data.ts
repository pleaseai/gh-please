import type { PrInfo, ReviewComment } from '../../src/types'

export const mockPrInfo: PrInfo = {
  number: 123,
  owner: 'testowner',
  repo: 'testrepo',
}

export const mockTopLevelComment: ReviewComment = {
  id: 987654321,
  body: 'This needs to be refactored',
  user: { login: 'reviewer' },
  path: 'src/index.ts',
  line: 42,
  diff_hunk: '@@ -40,5 +40,5 @@',
  created_at: '2024-01-01T12:00:00Z',
}

export const mockReplyComment: ReviewComment = {
  id: 987654322,
  body: 'I agree with the review',
  user: { login: 'author' },
  path: 'src/index.ts',
  line: null,
  diff_hunk: '@@ -40,5 +40,5 @@',
  created_at: '2024-01-01T12:30:00Z',
}

export const mockGhPrViewOutput = {
  number: 123,
  owner: { login: 'testowner' },
  repository: { name: 'testrepo' },
}
