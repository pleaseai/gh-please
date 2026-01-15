# Session Summary: Node ID Universal Decoder

## Feature Description
GitHub Node ID를 Database ID, Legacy Node ID, New Node ID 형식 간에 자유롭게 변환하는 기능 구현.
API 호출 없이 로컬에서 직접 디코딩/인코딩하여 빠르고 오프라인에서도 사용 가능.

## Requirements
1. **Node ID 디코딩**: New 형식(MessagePack+Base64)과 Legacy 형식(텍스트 Base64) 모두 지원
2. **Database ID 추출**: Node ID에서 Database ID 직접 추출
3. **API 없이 동작**: 로컬 디코딩으로 빠르고 오프라인 지원
4. **기존 코드 통합**: 현재 id-converter.ts에 기능 확장

## Constraints
- Bun 런타임 사용 (Node.js 아님)
- 기존 isNodeId(), isDatabaseId() 함수와 호환
- MessagePack 디코딩을 위한 의존성 최소화

## Current Phase
**Phase 2: Codebase Exploration** - 완료

## Codebase Analysis Results

### 현재 ID 변환 구현
- **파일**: `src/lib/id-converter.ts` (199 lines)
- **핵심 함수**: `isNodeId()`, `isDatabaseId()`, `toReviewCommentNodeId()`, `toIssueCommentNodeId()`
- **한계**: REST API 호출로 Node ID 조회 → 추가 API 호출 필요

### Node ID 사용 위치 (GraphQL 필수)
- `src/lib/github/review-operations.ts` - 리뷰 코멘트 답글/수정
- `src/lib/github/issue-hierarchy.ts` - 서브이슈, 의존성 관리
- `src/lib/github/graphql-core.ts` - GraphQL 쿼리 실행

### Database ID 사용 위치 (REST API)
- `src/lib/github-api.ts` - REST API 엔드포인트 구성
- `src/types.ts` - 인터페이스 정의

### MessagePack 디코딩 분석 결과
1. **순수 JS 구현 가능**: ~30줄로 GitHub Node ID 디코딩 가능
2. **Bun 지원**: `atob()`, `Buffer.from()` 모두 사용 가능
3. **라이브러리 옵션**: `@msgpack/msgpack` (20KB), `msgpack.js` (2.7KB)
4. **권장**: 순수 JS 구현 (의존성 없음, GitHub ID에 충분)

### 핵심 파일 (읽어야 할 파일)
1. src/lib/id-converter.ts - 기존 ID 변환 유틸리티
2. src/lib/github/graphql-core.ts - GraphQL 코어
3. src/lib/github/review-operations.ts - 리뷰 작업
4. test/lib/id-converter.test.ts - 기존 테스트 패턴
5. docs-dev/adr/0005-id-converter-utility.md - 설계 의사결정

## Key Decisions
- API 없이 로컬 디코딩 방식 선택 (사용자 확인 완료)
- 순수 JS 구현 선택 (의존성 0, ~50줄 코드)

## Architecture Design

### 선택된 접근 방식: 순수 JavaScript 구현

**구조:**
```
src/lib/
├── id-converter.ts        # 기존 파일 (확장)
└── node-id-decoder.ts     # 새 파일 (핵심 디코딩 로직)
```

**핵심 함수:**
1. `decodeNodeId(nodeId)` - Node ID 디코딩 (New/Legacy 형식 자동 감지)
2. `extractDatabaseId(nodeId)` - Database ID만 추출
3. `getNodeIdType(nodeId)` - 타입 문자열 반환

**MessagePack 디코딩 범위:**
- fixarray (0x90-0x9f): 배열 헤더
- positive fixint (0x00-0x7f): 작은 정수
- uint32 (0xce): 4바이트 정수

**Node ID Prefix 매핑:**
```typescript
const PREFIX_MAP = {
  I_: 'Issue',
  PR_: 'PullRequest',
  IC_: 'IssueComment',
  PRRC_: 'PullRequestReviewComment',
  PRRT_: 'PullRequestReviewThread',
  R_: 'Repository',
  // ... 추가 가능
}
```

## Reference
- Greptile Blog: https://www.greptile.com/blog/github-ids
- 기존 코드: src/lib/id-converter.ts
