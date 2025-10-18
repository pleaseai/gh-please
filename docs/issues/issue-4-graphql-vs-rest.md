# GraphQL vs REST API 비교 분석

Issue #4 구현을 위한 기술 선택 분석 문서

## 핵심 발견사항

### ⚠️ 중요: 둘 다 DB ID 필요

- **REST API**: `sub_issue_id`는 issue number가 **아니라** DB ID (`id` 필드)
- **GraphQL API**: `issueId`는 node ID 사용
- **결론**: 어느 방식을 사용하든 **issue number → ID 변환 필수**

### ID 변환 방법

#### REST API로 DB ID 얻기
```bash
# Issue 정보 조회
gh api /repos/owner/repo/issues/123

# Response에서 id 필드 사용
{
  "id": 3000028010,        # ← 이것이 sub_issue_id에 필요한 DB ID
  "node_id": "I_kwDO...",  # ← GraphQL에서 사용
  "number": 123,           # ← URL에 표시되는 번호
  ...
}
```

#### GraphQL로 Node ID 얻기
```graphql
query {
  repository(owner: "owner", name: "repo") {
    issue(number: 123) {
      id  # ← node ID (GraphQL용)
    }
  }
}
```

## 세부 비교표

### 1. Sub-issue 관리

| 기능 | REST API | GraphQL API |
|------|----------|-------------|
| **Add sub-issue** | `POST /repos/{owner}/{repo}/issues/{issue}/sub_issues`<br>`-f sub_issue_id={DB_ID}` | `mutation { addSubIssue(input: {issueId: $parentNodeId, subIssueId: $childNodeId}) }` |
| **Remove sub-issue** | `DELETE /repos/{owner}/{repo}/issues/{issue}/sub_issues/{sub_issue}` | `mutation { removeSubIssue(...) }` |
| **List sub-issues** | `GET /repos/{owner}/{repo}/issues/{issue}/sub_issues` | `query { repository { issue { subIssues { nodes { ... } } } } }` |
| **Get parent** | `GET /repos/{owner}/{repo}/issues/{issue}/parent` | GraphQL 쿼리로 가능 |
| **ID 타입** | DB ID (숫자, 예: 3000028010) | Node ID (문자열, 예: I_kwDO...) |
| **특수 헤더** | 없음 (표준 GitHub API 헤더만) | `-H "GraphQL-Features: sub_issues"` 필수 |

### 2. Review Thread 관리

| 기능 | REST API | GraphQL API |
|------|----------|-------------|
| **Resolve thread** | ❌ 지원 안 됨 | ✅ `mutation { resolveReviewThread(input: {threadId: $id}) }` |
| **List threads** | `GET /repos/{owner}/{repo}/pulls/{pr}/comments` (간접) | ✅ `query { repository { pullRequest { reviewThreads { ... } } } }` |
| **특이사항** | PR comments API로 대체 가능하나 thread 개념 없음 | Thread 단위 직접 관리 가능 |

### 3. Issue Dependencies

| 기능 | REST API | GraphQL API |
|------|----------|-------------|
| **Add dependency** | ✅ `POST /repos/{owner}/{repo}/issues/{issue}/dependencies` | ❌ 지원 안 됨 |
| **Remove dependency** | ✅ `DELETE /repos/{owner}/{repo}/issues/{issue}/dependencies/{blocker}` | ❌ 지원 안 됨 |
| **List dependencies** | ✅ `GET /repos/{owner}/{repo}/issues/{issue}/dependencies` | ❌ 지원 안 됨 |
| **특이사항** | 2025년 8월 출시 (최신 기능) | GraphQL 미지원 |

## 각 방식의 장단점

### GraphQL API

#### 장점 ✅
1. **단일 요청으로 여러 데이터 조회** - 네트워크 효율성
2. **정확한 필드만 요청** - 불필요한 데이터 전송 없음
3. **Review thread 직접 관리** - REST는 불가능
4. **타입 시스템** - 강력한 타입 체크
5. **스키마 자동 문서화** - Introspection 지원

#### 단점 ❌
1. **특수 헤더 필요** - `GraphQL-Features: sub_issues`
2. **Node ID 변환 필요** - Issue number → Node ID
3. **쿼리 작성 복잡도** - REST보다 학습 곡선 높음
4. **Issue dependencies 미지원** - REST로만 가능
5. **캐싱 어려움** - HTTP 캐시 활용 불가

### REST API

#### 장점 ✅
1. **Issue dependencies 지원** - GraphQL 불가능
2. **HTTP 캐싱** - 표준 HTTP 캐시 활용
3. **익숙한 패턴** - 기존 코드와 일관성
4. **단순한 엔드포인트** - URL 기반, 예측 가능
5. **특수 헤더 불필요** - 표준 GitHub API 헤더만

#### 단점 ❌
1. **여러 요청 필요** - 데이터 조합 시
2. **과다 데이터 전송** - 필요 없는 필드도 포함
3. **Review thread 미지원** - GraphQL로만 가능
4. **DB ID 변환 필요** - Issue number → DB ID

## 권장 사항

### 📋 우리 프로젝트 요구사항 분석

| 기능 | 필요 여부 | 최적 API |
|------|-----------|----------|
| Sub-issue 생성/추가/조회 | ✅ 필수 | REST/GraphQL 둘 다 가능 (동일한 복잡도) |
| Review thread 해결 | ✅ 필수 | **GraphQL만 가능** |
| Issue dependencies | ✅ 필수 | **REST만 가능** |
| PleaseAI 트리거 (댓글) | ✅ 필수 | REST (기존 패턴) |

### 🎯 결론: **하이브리드 접근**

```
┌─────────────────────────────────────────────────┐
│ github-graphql.ts (GraphQL 전용)                │
├─────────────────────────────────────────────────┤
│ ✅ Review thread 관리 (resolve, list)          │
│ ✅ Sub-issue 관리 (create, add, list)          │
│ ✅ Node ID 변환 유틸리티                       │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ github-rest.ts (REST 전용)                      │
├─────────────────────────────────────────────────┤
│ ✅ Issue dependencies (add, remove, list)      │
│ ✅ DB ID 변환 유틸리티                         │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ github-api.ts (공통 유틸리티)                   │
├─────────────────────────────────────────────────┤
│ ✅ Repo 정보 조회                              │
│ ✅ 댓글 생성 (issue/PR)                        │
│ ✅ 기존 PR 관련 함수들                         │
└─────────────────────────────────────────────────┘
```

### 🤔 Sub-issue는 GraphQL vs REST?

**분석**:
- **공통**: 둘 다 ID 변환 필요 (issue number → DB ID/Node ID)
- **REST 장점**: 특수 헤더 불필요, 기존 패턴과 일관성
- **GraphQL 장점**: Review thread와 동일한 패턴, 단일 클라이언트

**권장**: **GraphQL 사용**

**이유**:
1. Review thread도 GraphQL 필수이므로 **GraphQL 클라이언트 어차피 필요**
2. Sub-issue + Review thread를 **단일 GraphQL 요청**으로 조합 가능
3. 향후 확장성 (Projects API 등도 GraphQL 우선)
4. ID 변환 로직을 **한 곳에만 구현** (Node ID 변환)

## 최종 구현 계획

### 파일별 책임

#### `src/lib/github-graphql.ts`
```typescript
// ID 변환
export async function getIssueNodeId(owner, repo, number): string
export async function getPrNodeId(owner, repo, number): string

// Sub-issue (GraphQL 사용)
export async function createSubIssue(parentNodeId, title, body?)
export async function addSubIssue(parentNodeId, childNodeId)
export async function listSubIssues(parentNodeId)

// Review thread (GraphQL만 가능)
export async function resolveReviewThread(threadNodeId)
export async function listReviewThreads(prNodeId)

// 내부 유틸
async function executeGraphQL(query, variables, features?)
```

#### `src/lib/github-rest.ts`
```typescript
// ID 변환 (REST용)
export async function getIssueDbId(owner, repo, number): number

// Issue dependencies (REST만 가능)
export async function addIssueDependency(owner, repo, issue, blockedBy)
export async function removeIssueDependency(owner, repo, issue, blocker)
export async function listIssueDependencies(owner, repo, issue)

// 내부 유틸
async function executeRestApi(method, endpoint, body?)
```

#### `src/lib/github-api.ts`
```typescript
// 기존 함수들...
export async function getCurrentPrInfo()
export async function getReviewComment()
export async function createReviewReply()

// 추가 유틸리티
export async function getRepoInfo(): { owner, repo }
export async function createIssueComment(owner, repo, issue, body)
export async function createPrComment(owner, repo, pr, body)
```

## 구현 세부사항

### ID 변환 함수

#### GraphQL - Node ID 변환
```typescript
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

  const result = await executeGraphQL(query, { owner, repo, number: issueNumber });
  return result.repository.issue.id; // Node ID 반환
}
```

#### REST - DB ID 변환
```typescript
export async function getIssueDbId(
  owner: string,
  repo: string,
  issueNumber: number
): Promise<number> {
  const endpoint = `/repos/${owner}/${repo}/issues/${issueNumber}`;

  const proc = Bun.spawn(
    ["gh", "api", "-H", "Accept: application/vnd.github+json", endpoint],
    { stdout: "pipe", stderr: "pipe" }
  );

  const output = await new Response(proc.stdout).text();
  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    const error = await new Response(proc.stderr).text();
    throw new Error(`Failed to get issue DB ID: ${error.trim()}`);
  }

  const issue = JSON.parse(output);
  return issue.id; // DB ID 반환 (숫자)
}
```

### Sub-issue 추가 (GraphQL)

```typescript
export async function addSubIssue(
  parentNodeId: string,
  childNodeId: string
): Promise<void> {
  const mutation = `
    mutation($parentId: ID!, $childId: ID!) {
      addSubIssue(input: {issueId: $parentId, subIssueId: $childId}) {
        issue {
          title
        }
        subIssue {
          number
          title
        }
      }
    }
  `;

  await executeGraphQL(
    mutation,
    { parentId: parentNodeId, childId: childNodeId },
    ["sub_issues"] // GraphQL Features 헤더
  );
}
```

### Issue Dependency 추가 (REST)

```typescript
export async function addIssueDependency(
  owner: string,
  repo: string,
  issueNumber: number,
  blockedByNumber: number
): Promise<void> {
  // 1. blockedBy issue의 DB ID 얻기
  const blockedByDbId = await getIssueDbId(owner, repo, blockedByNumber);

  // 2. Dependency 추가
  const endpoint = `/repos/${owner}/${repo}/issues/${issueNumber}/dependencies`;

  const proc = Bun.spawn(
    [
      "gh", "api",
      "--method", "POST",
      "-H", "Accept: application/vnd.github+json",
      "-H", "X-GitHub-Api-Version: 2022-11-28",
      endpoint,
      "-f", `blocked_by=${blockedByDbId}` // DB ID 사용
    ],
    { stdout: "pipe", stderr: "pipe" }
  );

  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    const error = await new Response(proc.stderr).text();
    throw new Error(`Failed to add dependency: ${error.trim()}`);
  }
}
```

## 테스트 전략

### 1. ID 변환 테스트
```typescript
describe("ID conversion", () => {
  test("getIssueNodeId should return GraphQL node ID", async () => {
    const nodeId = await getIssueNodeId("owner", "repo", 123);
    expect(nodeId).toMatch(/^I_kwDO/); // Node ID 패턴
  });

  test("getIssueDbId should return numeric DB ID", async () => {
    const dbId = await getIssueDbId("owner", "repo", 123);
    expect(typeof dbId).toBe("number");
    expect(dbId).toBeGreaterThan(0);
  });
});
```

### 2. API 통합 테스트
- 실제 GitHub 저장소로 테스트 (테스트 전용 repo 생성)
- CI/CD에서 실제 gh CLI 사용
- 로컬에서는 mock 데이터 사용

## 리스크 및 대응

| 리스크 | 영향도 | 대응 방안 |
|--------|--------|-----------|
| GraphQL Features 헤더 누락 | 높음 | 테스트에서 검증, 에러 메시지 명확화 |
| ID 변환 실패 | 높음 | Retry 로직, 명확한 에러 메시지 |
| API Rate Limit | 중간 | 429 에러 처리, 지수 백오프 |
| gh CLI 버전 차이 | 낮음 | 최소 버전 요구사항 문서화 |

## 참고 자료

- [GitHub REST API - Sub-issues](https://docs.github.com/en/rest/issues/sub-issues)
- [GitHub GraphQL API - Mutations](https://docs.github.com/en/graphql/reference/mutations)
- [GitHub REST API - Issue Dependencies](https://docs.github.com/en/rest/issues/issue-dependencies)
- [Comparing GitHub's REST and GraphQL APIs](https://docs.github.com/en/rest/about-the-rest-api/comparing-githubs-rest-api-and-graphql-api)
- [Create GitHub issue hierarchy using the API](https://jessehouwing.net/create-github-issue-hierarchy-using-the-api/)