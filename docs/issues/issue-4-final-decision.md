# Issue #4: 최종 기술 선택 - GraphQL 단일 접근

## 🎯 핵심 발견사항 (업데이트)

### GraphQL API 지원 기능 (최신 확인)

| 기능 | GraphQL API | REST API | 비고 |
|------|-------------|----------|------|
| **Sub-issues** | ✅ addSubIssue, removeSubIssue | ✅ POST/DELETE | 둘 다 지원 |
| **Review threads** | ✅ resolveReviewThread | ❌ 미지원 | **GraphQL만** |
| **Issue dependencies** | ✅ addBlockedBy, removeBlockedBy | ✅ POST/DELETE | 둘 다 지원 |
| **ID 타입** | Node ID (문자열) | DB ID (숫자) | 둘 다 변환 필요 |

### 🌟 결론: **GraphQL 단일 접근 가능!**

모든 필요한 기능이 GraphQL로 지원됩니다:
- ✅ Sub-issues
- ✅ Review threads
- ✅ Issue dependencies (blocked_by)

## 최종 권장사항: GraphQL Only

### 📋 아키텍처

```
src/lib/github-graphql.ts  (핵심 GraphQL 클라이언트)
│
├─ 기본 실행 함수
│  └─ executeGraphQL(query, variables, features?)
│
├─ ID 변환 유틸리티
│  ├─ getIssueNodeId(owner, repo, number) → Node ID
│  └─ getPrNodeId(owner, repo, number) → Node ID
│
├─ Sub-issue 관리
│  ├─ createSubIssue(parentNodeId, title, body?)
│  ├─ addSubIssue(parentNodeId, childNodeId)
│  ├─ removeSubIssue(parentNodeId, childNodeId)
│  └─ listSubIssues(parentNodeId)
│
├─ Review Thread 관리
│  ├─ resolveReviewThread(threadNodeId)
│  └─ listReviewThreads(prNodeId)
│
└─ Issue Dependency 관리
   ├─ addBlockedBy(issueNodeId, blockerNodeId)
   ├─ removeBlockedBy(issueNodeId, blockerNodeId)
   └─ listBlockedBy(issueNodeId)

src/lib/github-api.ts  (기존 + 공통 유틸리티)
│
├─ 기존 함수들
│  ├─ getCurrentPrInfo()
│  ├─ getReviewComment()
│  └─ createReviewReply()
│
└─ 추가 유틸리티
   ├─ getRepoInfo() → { owner, repo }
   ├─ createIssueComment(owner, repo, issue, body)
   └─ createPrComment(owner, repo, pr, body)

src/lib/please-trigger.ts  (PleaseAI 트리거)
│
├─ buildTriggerComment(type) → "/please {type}"
└─ triggerPleaseAI(type, owner, repo, number)

src/types.ts  (타입 정의)
```

### ❌ 제거된 파일

~~`src/lib/github-rest.ts`~~ - 더 이상 필요 없음!

## GraphQL만 사용하는 이유

### ✅ 장점

1. **단일 API 클라이언트**
   - 하나의 executeGraphQL 함수만 관리
   - 일관된 에러 처리 패턴
   - 단일 ID 타입 (Node ID)

2. **단일 요청으로 복합 작업**
   ```graphql
   # 예: Sub-issue 생성 + Dependency 추가를 한 번에
   mutation {
     createIssue(...) { ... }
     addSubIssue(...) { ... }
     addBlockedBy(...) { ... }
   }
   ```

3. **필요한 데이터만 조회**
   - Over-fetching 없음
   - 네트워크 효율성

4. **타입 안전성**
   - GraphQL 스키마 기반 타입 체크
   - Introspection으로 자동 문서화

5. **향후 확장성**
   - Projects API (GraphQL 우선)
   - Discussions API
   - 새로운 기능들이 GraphQL 먼저 출시되는 추세

### ⚠️ 주의사항

1. **GraphQL Features 헤더**
   - Sub-issues: `GraphQL-Features: sub_issues` 필수
   - 테스트에서 검증 필요

2. **Node ID 변환 필수**
   - Issue number → Node ID 변환 함수 필요
   - 캐싱 고려 (동일 issue 반복 조회 시)

3. **쿼리 복잡도**
   - Mutation 작성이 REST보다 verbose
   - 하지만 타입 안전성으로 상쇄

## 상세 구현 사양

### 1. GraphQL 기본 실행 함수

```typescript
/**
 * GraphQL 쿼리/뮤테이션 실행
 *
 * @param query - GraphQL 쿼리/뮤테이션 문자열
 * @param variables - 변수 객체
 * @param features - GraphQL Features 헤더 (예: ['sub_issues'])
 * @returns GraphQL 응답 데이터
 */
export async function executeGraphQL(
  query: string,
  variables: Record<string, any> = {},
  features?: string[]
): Promise<any> {
  const args = ["api", "graphql"];

  // GraphQL Features 헤더 추가
  if (features && features.length > 0) {
    args.push("-H", `GraphQL-Features: ${features.join(", ")}`);
  }

  // 쿼리 추가
  args.push("-f", `query=${query}`);

  // 변수 추가
  for (const [key, value] of Object.entries(variables)) {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    args.push("-F", `${key}=${serialized}`);
  }

  const proc = Bun.spawn(["gh", ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const output = await new Response(proc.stdout).text();
  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    const error = await new Response(proc.stderr).text();
    throw new Error(`GraphQL query failed: ${error.trim()}`);
  }

  const result = JSON.parse(output);

  // GraphQL 에러 체크
  if (result.errors) {
    const errorMessages = result.errors.map((e: any) => e.message).join(", ");
    throw new Error(`GraphQL errors: ${errorMessages}`);
  }

  return result.data;
}
```

### 2. Node ID 변환 함수

```typescript
/**
 * Issue number → Node ID 변환
 */
export async function getIssueNodeId(
  owner: string,
  repo: string,
  issueNumber: number
): Promise<string> {
  const query = `
    query($owner: String!, $repo: String!, $number: Int!) {
      repository(owner: $owner, name: $repo) {
        issue(number: $number) {
          id
        }
      }
    }
  `;

  const data = await executeGraphQL(query, { owner, repo, number: issueNumber });

  if (!data.repository?.issue) {
    throw new Error(`Issue #${issueNumber} not found in ${owner}/${repo}`);
  }

  return data.repository.issue.id;
}

/**
 * PR number → Node ID 변환
 */
export async function getPrNodeId(
  owner: string,
  repo: string,
  prNumber: number
): Promise<string> {
  const query = `
    query($owner: String!, $repo: String!, $number: Int!) {
      repository(owner: $owner, name: $repo) {
        pullRequest(number: $number) {
          id
        }
      }
    }
  `;

  const data = await executeGraphQL(query, { owner, repo, number: prNumber });

  if (!data.repository?.pullRequest) {
    throw new Error(`PR #${prNumber} not found in ${owner}/${repo}`);
  }

  return data.repository.pullRequest.id;
}
```

### 3. Sub-issue 관리

```typescript
/**
 * Sub-issue 추가
 */
export async function addSubIssue(
  parentNodeId: string,
  childNodeId: string
): Promise<void> {
  const mutation = `
    mutation($parentId: ID!, $childId: ID!) {
      addSubIssue(input: {issueId: $parentId, subIssueId: $childId}) {
        issue {
          id
          title
        }
        subIssue {
          id
          number
          title
        }
      }
    }
  `;

  await executeGraphQL(
    mutation,
    { parentId: parentNodeId, childId: childNodeId },
    ["sub_issues"]
  );
}

/**
 * Sub-issue 제거
 */
export async function removeSubIssue(
  parentNodeId: string,
  childNodeId: string
): Promise<void> {
  const mutation = `
    mutation($parentId: ID!, $childId: ID!) {
      removeSubIssue(input: {issueId: $parentId, subIssueId: $childId}) {
        issue {
          id
          title
        }
      }
    }
  `;

  await executeGraphQL(
    mutation,
    { parentId: parentNodeId, childId: childNodeId },
    ["sub_issues"]
  );
}

/**
 * Sub-issue 목록 조회
 */
export async function listSubIssues(
  parentNodeId: string
): Promise<Array<{
  number: number
  title: string
  state: string
  nodeId: string
}>> {
  const query = `
    query($issueId: ID!) {
      node(id: $issueId) {
        ... on Issue {
          subIssues(first: 100) {
            nodes {
              id
              number
              title
              state
            }
          }
        }
      }
    }
  `;

  const data = await executeGraphQL(query, { issueId: parentNodeId }, ["sub_issues"]);

  if (!data.node?.subIssues) {
    return [];
  }

  return data.node.subIssues.nodes.map((issue: any) => ({
    number: issue.number,
    title: issue.title,
    state: issue.state,
    nodeId: issue.id,
  }));
}
```

### 4. Issue Dependency 관리

```typescript
/**
 * "Blocked by" 의존성 추가
 * @param issueNodeId - 차단당할 이슈의 Node ID
 * @param blockingIssueNodeId - 차단할 이슈의 Node ID
 */
export async function addBlockedBy(
  issueNodeId: string,
  blockingIssueNodeId: string
): Promise<void> {
  const mutation = `
    mutation($issueId: ID!, $blockingIssueId: ID!) {
      addBlockedBy(input: {issueId: $issueId, blockingIssueId: $blockingIssueId}) {
        issue {
          id
          title
        }
        blockingIssue {
          id
          number
          title
        }
      }
    }
  `;

  await executeGraphQL(mutation, {
    issueId: issueNodeId,
    blockingIssueId: blockingIssueNodeId
  });
}

/**
 * "Blocked by" 의존성 제거
 * @param issueNodeId - 차단당한 이슈의 Node ID
 * @param blockingIssueNodeId - 제거할 차단 이슈의 Node ID
 */
export async function removeBlockedBy(
  issueNodeId: string,
  blockingIssueNodeId: string
): Promise<void> {
  const mutation = `
    mutation($issueId: ID!, $blockingIssueId: ID!) {
      removeBlockedBy(input: {issueId: $issueId, blockingIssueId: $blockingIssueId}) {
        issue {
          id
          title
        }
        blockingIssue {
          id
          title
        }
      }
    }
  `;

  await executeGraphQL(mutation, {
    issueId: issueNodeId,
    blockingIssueId: blockingIssueNodeId
  });
}

/**
 * "Blocked by" 목록 조회
 */
export async function listBlockedBy(
  issueNodeId: string
): Promise<Array<{
  number: number
  title: string
  state: string
  nodeId: string
}>> {
  const query = `
    query($issueId: ID!) {
      node(id: $issueId) {
        ... on Issue {
          blockedBy(first: 100) {
            nodes {
              id
              number
              title
              state
            }
          }
        }
      }
    }
  `;

  const data = await executeGraphQL(query, { issueId: issueNodeId });

  if (!data.node?.blockedBy) {
    return [];
  }

  return data.node.blockedBy.nodes.map((issue: any) => ({
    number: issue.number,
    title: issue.title,
    state: issue.state,
    nodeId: issue.id,
  }));
}
```

### 5. Review Thread 관리

```typescript
/**
 * Review thread 해결
 */
export async function resolveReviewThread(
  threadNodeId: string
): Promise<void> {
  const mutation = `
    mutation($threadId: ID!) {
      resolveReviewThread(input: {threadId: $threadId}) {
        thread {
          id
          isResolved
        }
      }
    }
  `;

  await executeGraphQL(mutation, { threadId: threadNodeId });
}

/**
 * PR의 review thread 목록 조회
 */
export async function listReviewThreads(
  prNodeId: string
): Promise<Array<{
  id: string
  nodeId: string
  isResolved: boolean
  path: string
  line: number | null
}>> {
  const query = `
    query($prId: ID!) {
      node(id: $prId) {
        ... on PullRequest {
          reviewThreads(first: 100) {
            nodes {
              id
              isResolved
              path
              line
            }
          }
        }
      }
    }
  `;

  const data = await executeGraphQL(query, { prId: prNodeId });

  if (!data.node?.reviewThreads) {
    return [];
  }

  return data.node.reviewThreads.nodes.map((thread: any) => ({
    id: thread.id,
    nodeId: thread.id,
    isResolved: thread.isResolved,
    path: thread.path,
    line: thread.line,
  }));
}
```

## 타입 정의

```typescript
// src/types.ts

export interface IssueInfo {
  number: number
  owner: string
  repo: string
  nodeId?: string
}

export interface SubIssue {
  number: number
  title: string
  state: 'OPEN' | 'CLOSED'
  nodeId: string
}

export interface BlockedByIssue {
  number: number
  title: string
  state: 'OPEN' | 'CLOSED'
  nodeId: string
}

export interface ReviewThread {
  id: string
  nodeId: string
  isResolved: boolean
  path: string
  line: number | null
}

export type PleaseTriggerType = 'triage' | 'investigate' | 'fix' | 'review' | 'apply'
```

## 구현 순서 (업데이트)

### Phase 1: GraphQL 기반 구조 (2시간)
1. ✅ 문서 작성 완료
2. `src/lib/github-graphql.ts` 생성
   - `executeGraphQL()` 구현 + 테스트
   - `getIssueNodeId()`, `getPrNodeId()` 구현 + 테스트

### Phase 2: Sub-issue 관리 (1-2시간)
3. `addSubIssue()` 구현 + 테스트
4. `removeSubIssue()` 구현 + 테스트
5. `listSubIssues()` 구현 + 테스트

### Phase 3: Issue Dependency 관리 (1-2시간)
6. `addBlockedBy()` 구현 + 테스트
7. `removeBlockedBy()` 구현 + 테스트
8. `listBlockedBy()` 구현 + 테스트

### Phase 4: Review Thread 관리 (1시간)
9. `resolveReviewThread()` 구현 + 테스트
10. `listReviewThreads()` 구현 + 테스트

### Phase 5: 공통 유틸리티 (1시간)
11. `github-api.ts` 확장
    - `getRepoInfo()` 구현 + 테스트
    - `createIssueComment()`, `createPrComment()` 구현 + 테스트

### Phase 6: PleaseAI 트리거 (30분)
12. `please-trigger.ts` 생성
    - `buildTriggerComment()` 구현 + 테스트
    - `triggerPleaseAI()` 구현 + 테스트

### Phase 7: 타입 정의 및 통합 (30분)
13. `types.ts` 확장
14. 전체 통합 테스트

### Phase 8: 문서화 및 최종 검증 (1시간)
15. CLAUDE.md 업데이트
16. 테스트 커버리지 확인 (>90%)
17. 최종 리뷰

**총 예상 시간**: 7-9시간

## 테스트 전략

### 1. 단위 테스트
```typescript
describe("github-graphql", () => {
  describe("executeGraphQL", () => {
    test("should execute query with features header", async () => {
      // GraphQL Features 헤더 검증
    });

    test("should handle GraphQL errors", async () => {
      // 에러 응답 처리 검증
    });
  });

  describe("ID conversion", () => {
    test("should convert issue number to node ID", async () => {
      const nodeId = await getIssueNodeId("owner", "repo", 123);
      expect(nodeId).toMatch(/^I_kwDO/);
    });
  });

  describe("Sub-issues", () => {
    test("should add sub-issue with correct mutation", async () => {
      // addSubIssue 검증
    });
  });

  describe("Dependencies", () => {
    test("should add blocked_by relationship", async () => {
      // addBlockedBy 검증
    });
  });
});
```

### 2. 통합 테스트
- 실제 테스트 저장소 사용
- CI/CD에서 실행
- 전체 워크플로우 검증

### 3. 커버리지 목표
- **전체**: 90% 이상
- **핵심 함수**: 100% (executeGraphQL, ID 변환)

## 성공 기준

- [x] GraphQL vs REST 비교 분석 완료
- [x] GraphQL 단일 접근 결정
- [ ] GraphQL client 11개 함수 구현
- [ ] PleaseAI trigger 2개 함수 구현
- [ ] GitHub API 3개 함수 확장
- [ ] 타입 정의 5개 추가
- [ ] 테스트 커버리지 90% 이상
- [ ] 모든 테스트 통과
- [ ] 문서화 완료

## 참고 자료

- [GitHub GraphQL API - Mutations](https://docs.github.com/en/graphql/reference/mutations)
- [GitHub GraphQL API - addBlockedBy](https://docs.github.com/ko/graphql/reference/mutations#addblockedby)
- [GitHub GraphQL API - addSubIssue](https://docs.github.com/en/graphql/reference/mutations#addsubissue)
- [GitHub GraphQL API - resolveReviewThread](https://docs.github.com/en/graphql/reference/mutations#resolvereviewthread)