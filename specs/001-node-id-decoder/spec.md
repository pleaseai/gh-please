# Node ID Universal Decoder

## Summary
GitHub Node ID를 로컬에서 디코딩하여 Database ID를 추출하고, 다양한 Node ID 형식(Legacy, New)을 모두 지원하는 유틸리티 함수 구현.

## Background
GitHub의 모든 객체는 두 가지 ID를 가진다:
- **Database ID**: 정수형 (예: `2475899260`)
- **Node ID**: Base64 인코딩된 문자열 (예: `PRRC_kwDOL4aMSs6Tkzl8`)

현재 gh-please의 id-converter.ts는 REST API를 호출하여 Node ID를 조회한다. 이 방식은 추가 API 호출이 필요하고, 오프라인에서 사용할 수 없다.

## Goals
1. Node ID에서 Database ID를 API 호출 없이 로컬에서 추출
2. Legacy Node ID 형식(Base64 텍스트)과 New 형식(MessagePack) 모두 지원
3. 기존 id-converter.ts 함수들과 통합

## Non-Goals
- Node ID 생성/인코딩 (현재는 디코딩만)
- GraphQL API 변경
- 사용자 인터페이스(CLI) 변경

## Requirements

### Functional Requirements

#### FR1: New Node ID 디코딩
- 형식: `PREFIX_kwDO...` (MessagePack + Base64)
- 추출 데이터: `[version, repository_id, object_id]`
- Database ID = object_id (배열의 마지막 요소)

#### FR2: Legacy Node ID 디코딩
- 형식: `MDEwOlJlcG9zaXRvcnkxMzkwOTUzNzc=` (텍스트 Base64)
- 디코딩 결과: `010:Repository139095377`
- Database ID = 문자열에서 숫자 추출

#### FR3: Prefix 검증
- 지원 Prefix: `I_`, `PR_`, `IC_`, `PRRC_`, `PRRT_`, `R_` 등
- 알 수 없는 Prefix는 에러 발생

#### FR4: 기존 함수 통합
- `toReviewCommentNodeId()`: 먼저 로컬 디코딩 시도, 실패 시 기존 API 호출
- `toIssueCommentNodeId()`: 동일한 패턴 적용

### Non-Functional Requirements

#### NFR1: 의존성 최소화
- 외부 MessagePack 라이브러리 없이 순수 JS로 구현
- Bun 내장 API(atob, Buffer) 활용

#### NFR2: 성능
- 디코딩은 동기식, 즉시 반환 (API 호출 없음)
- 메모리 할당 최소화

#### NFR3: 하위 호환성
- 기존 함수 시그니처 유지
- 기존 테스트 통과

## API Design

```typescript
// 새로운 함수
export function decodeNodeId(nodeId: string): DecodedNodeId
export function extractDatabaseId(nodeId: string): number
export function getNodeIdType(nodeId: string): string | null

// 타입 정의
export interface DecodedNodeId {
  type: string // 'Issue', 'PullRequest', 'IssueComment', etc.
  prefix: string // 'I_', 'PR_', 'IC_', 'PRRC_', etc.
  databaseId: number // 추출된 Database ID
  format: 'new' | 'legacy'
  repositoryId?: number // New 형식에서만 존재
  raw: number[] // New 형식의 원시 배열 [version, repoId, objectId]
}
```

## Test Cases

### TC1: New Format Decoding
```typescript
decodeNodeId('PRRC_kwDOL4aMSs6Tkzl8')
// → { type: 'PullRequestReviewComment', prefix: 'PRRC_', databaseId: 2475899260, ... }
```

### TC2: Legacy Format Decoding
```typescript
decodeNodeId('MDEwOlJlcG9zaXRvcnkxMzkwOTUzNzc=')
// → { type: 'Repository', databaseId: 139095377, format: 'legacy' }
```

### TC3: Invalid Node ID
```typescript
decodeNodeId('invalid')
// → throws Error('Invalid Node ID format')
```

### TC4: Database ID Extraction
```typescript
extractDatabaseId('IC_kwDOABC123')
// → 123456789 (number)
```

## Edge Cases

1. **빈 문자열**: 에러 발생
2. **Database ID 입력**: 에러 발생 (숫자는 Node ID가 아님)
3. **손상된 Base64**: 에러 발생
4. **알 수 없는 Prefix**: 에러 발생 (또는 null 반환)
5. **매우 큰 Database ID**: BigInt 고려 필요 (현재는 Number로 충분)

## References
- [Greptile Blog: GitHub IDs](https://www.greptile.com/blog/github-ids)
- [MessagePack Specification](https://github.com/msgpack/msgpack/blob/master/spec.md)
- [GitHub Global Node IDs](https://docs.github.com/en/graphql/guides/migrating-graphql-global-node-ids)
