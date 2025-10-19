# @pleaseai/gh-please

[![CI](https://github.com/pleaseai/gh-please/actions/workflows/ci.yml/badge.svg)](https://github.com/pleaseai/gh-please/actions/workflows/ci.yml)
[![codecov](https://codecov.io/github/pleaseai/gh-please/graph/badge.svg?token=BQKO959X1M)](https://codecov.io/github/pleaseai/gh-please)
[![code style](https://antfu.me/badge-code-style.svg)](https://github.com/antfu/eslint-config)

**PleaseAI**를 위한 GitHub CLI 확장 프로그램 - AI 기반 코드 리뷰 및 이슈 관리 자동화

한국어 | [English](./README.en.md)

## 개요

`@pleaseai/gh-please`는 GitHub CLI를 위한 강력한 확장 프로그램으로, 이슈 및 PR 관리를 향상시킵니다:

### 핵심 기능 (내장)
- **이슈 관리**: Sub-issue 및 의존성 관계 관리
- **PR 관리**: 리뷰 코멘트 답변 및 스레드 해결
- **플러그인 시스템**: 확장 가능한 아키텍처로 커스텀 기능 추가

### AI 기능 (플러그인 필요)
- **코드 리뷰**: AI가 생성한 코멘트와 제안으로 자동화된 PR 리뷰
- **이슈 워크플로우**: 이슈의 분류(triage) → 조사(investigate) → 수정(fix) 워크플로우
- **코드 워크스페이스**: 향상된 개발 워크스페이스 기능

> **v0.3.0 변경사항**: AI 기능이 별도 플러그인으로 분리되었습니다. [마이그레이션 가이드](./docs/MIGRATION_v0.3.md)를 참조하세요.

## 빠른 시작

### 핵심 기능 사용 (플러그인 불필요)

1. **확장 프로그램 설치**

   ```bash
   gh extension install pleaseai/gh-please
   ```

2. **즉시 사용 가능한 명령어**

   ```bash
   # 이슈 관리
   gh please issue sub-issue create 100 --title "서브 태스크"
   gh please issue dependency add 200 --blocked-by 199

   # PR 관리
   gh please pr review-reply 1234567890 -b "수정했습니다!"
   gh please pr resolve 456 --all
   ```

### AI 기능 사용 (플러그인 필요)

1. **AI 플러그인 설치**

   **프리미엄 클라우드 서비스 (권장):**
   ```bash
   gh please plugin install ai --premium
   ```

   **셀프 호스팅:**
   ```bash
   npm install -g @pleaseai/gh-please-ai
   ```

2. **PleaseAI 설정 초기화**

   ```bash
   gh please init
   ```

   이 명령은 코드 리뷰 자동화, 이슈 워크플로우 등에 대한 설정이 포함된 `.please/config.yml` 파일을 생성합니다.

3. **AI 기능 사용 시작**
   ```bash
   gh please ai triage 123
   gh please ai review 456
   ```

> 📖 자세한 내용은 [사용 가능한 플러그인](./docs/AVAILABLE_PLUGINS.md)을 참조하세요.

## Claude Code 통합

Claude Code 플러그인을 사용하면 AI가 자동으로 적절한 `gh please` 명령어를 제안합니다.

### 설치

**회사 내부 마켓플레이스:**
```bash
claude plugin install pleaseai-github
```

**로컬 개발:**
```bash
# 저장소 클론 후
ln -s $(pwd)/.claude-plugin ~/.claude/plugins/pleaseai-github
```

### 사용 예시

Claude에게 자연어로 요청하면 적절한 명령어를 제안합니다:

```
사용자: "이슈 #123에 대한 sub-issue 생성해줘"
Claude: gh please issue sub-issue create 123 --title "..."

사용자: "dependency 추가: #200이 #199에 의해 차단됨"
Claude: gh please issue dependency add 200 --blocked-by 199

사용자: "PR 리뷰 코멘트에 답변"
Claude: gh please pr review-reply <comment-id> --body "..."
```

**포함 기능:**
- AI 워크플로우 가이드 (triage, investigate, fix, review, apply)
- 이슈 관리 패턴 (sub-issue, dependency)
- PR 리뷰 워크플로우 (review-reply, resolve)
- 설정 최적화 가이드 (.please/config.yml)

자세한 내용은 [.claude-plugin/README.md](./.claude-plugin/README.md)를 참조하세요.

## 공통 옵션

모든 명령어는 다른 저장소에서 실행할 수 있도록 `--repo` 옵션을 지원합니다:

```bash
# 현재 디렉토리의 저장소 사용 (기본)
gh please ai triage 123

# 다른 저장소 지정
gh please ai triage 123 --repo owner/repo
gh please ai triage 123 -R owner/repo  # 짧은 형식

# 모든 명령어에서 사용 가능
gh please issue sub-issue list 100 --repo pleaseai/another-repo
gh please pr resolve 456 --all -R owner/repo
```

**참고**: `--repo` 옵션이 없으면 현재 디렉토리의 저장소가 사용됩니다.

## 플러그인 시스템

v0.3.0부터 `gh-please`는 모듈형 플러그인 아키텍처를 사용합니다.

### 플러그인 관리

```bash
# 설치된 플러그인 보기
gh please plugin list

# 플러그인 검색
gh please plugin search [name]

# 플러그인 설치
gh please plugin install <name>

# 플러그인 제거
gh please plugin uninstall <name>
```

### 사용 가능한 플러그인

- **@pleaseai/gh-please-ai** (프리미엄) - AI 기반 코드 리뷰 및 이슈 자동화

더 많은 정보는 [사용 가능한 플러그인](./docs/AVAILABLE_PLUGINS.md)을 참조하세요.

### 플러그인 개발

자체 플러그인을 만들고 싶으신가요? [플러그인 개발 가이드](./docs/PLUGIN_DEVELOPMENT.md)를 확인하세요.

## 주요 기능

### `gh please init` - PleaseAI 설정 초기화

> **플러그인 필요**: 이 명령은 AI 플러그인이 설치되어 있어야 합니다.

모든 PleaseAI 기능에 대한 대화형 설정으로 `.please/config.yml`을 구성합니다:

- 코드 리뷰 자동화 (심각도 임계값, 자동 리뷰, 드래프트 PR 처리)
- 이슈 워크플로우 자동화 (자동 분류, 조사, 수정 워크플로우)
- 코드 워크스페이스 기능
- 언어 설정 (한국어/영어)

```bash
# 대화형 설정
gh please init

# 기본값 사용 (프롬프트 건너뛰기)
gh please init --yes

# 기존 설정 덮어쓰기
gh please init --force
```

### `gh please review-reply` - PR 리뷰 코멘트에 답변

GitHub API를 사용하여 풀 리퀘스트 리뷰 코멘트에 답변을 작성합니다.

**참고**: 이 명령은 **최상위 리뷰 코멘트**에만 답변할 수 있습니다. 답글에 대한 답글은 GitHub API에서 지원하지 않습니다.

## 설치

### 사전 요구사항

- [GitHub CLI (`gh`)](https://cli.github.com/) - 버전 2.0 이상
- [Bun](https://bun.sh) - JavaScript 런타임 및 툴킷

### 확장 프로그램 설치

```bash
gh extension install pleaseai/gh-please
```

### 개발용 설치

```bash
git clone https://github.com/pleaseai/gh-please.git
cd gh-please
bun install
gh extension install .
```

## 사용법

### 리뷰 코멘트에 답변하기

열린 풀 리퀘스트가 있는 저장소로 이동하여 실행:

```bash
# 기본 사용법
gh please review-reply <comment-id> --body "답변 내용"

# 짧은 플래그 사용
gh please review-reply 1234567890 -b "리뷰 감사합니다!"

# 여러 줄 답변
gh please review-reply 1234567890 --body "좋은 지적입니다!

다음 커밋에서 수정하겠습니다."

# stdin에서 파이프
echo "감사합니다!" | gh please review-reply 1234567890
```

### 코멘트 ID 찾기

답변하려는 코멘트 ID를 찾는 방법:

1. **GitHub CLI API 사용**:

   ```bash
   gh api /repos/OWNER/REPO/pulls/PR_NUMBER/comments
   ```

2. **GitHub 웹 UI 사용**:
   - PR로 이동하여 리뷰 코멘트 클릭
   - URL에서 코멘트 ID 확인: `github.com/.../pull/123#discussion_r1234567890`
   - `discussion_r` 다음 숫자 사용 (예: `1234567890`)

3. **gh CLI 사용 (모든 PR 코멘트 나열)**:
   ```bash
   gh pr view --json comments --jq '.comments[] | "\(.id): \(.body)"'
   ```

## PleaseAI 설정

`.please/config.yml` 파일은 모든 PleaseAI 자동화 기능을 제어합니다:

### 코드 리뷰 설정

- **comment_severity_threshold**: 리뷰 코멘트의 최소 심각도 수준 (LOW/MEDIUM/HIGH)
- **max_review_comments**: 최대 리뷰 코멘트 수 (무제한은 -1)
- **auto review**: PR이 열릴 때 자동으로 리뷰
- **include_drafts**: 자동 리뷰에 드래프트 PR 포함

### 이슈 워크플로우 설정

- **Triage**: 타입 라벨링을 통한 자동 또는 수동 이슈 분류
- **Investigate**: AI 지원 버그 조사 (조직 멤버만 옵션)
- **Fix**: PR 생성 및 테스트 실행을 통한 자동화된 수정 구현

### 코드 워크스페이스

- 향상된 개발 워크스페이스 기능 활성화

### 설정 예시

```yaml
code_review:
  disable: false
  comment_severity_threshold: MEDIUM
  max_review_comments: -1
  pull_request_opened:
    help: false
    summary: true
    code_review: true
    include_drafts: true

issue_workflow:
  disable: false
  triage:
    auto: true
    manual: true
    update_issue_type: true
  investigate:
    enabled: true
    org_members_only: true
    auto_on_bug_label: false
  fix:
    enabled: true
    org_members_only: true
    require_investigation: false
    auto_create_pr: true
    auto_run_tests: true

code_workspace:
  enabled: true

ignore_patterns: []
language: ko
```

## 다국어 지원

모든 명령어는 시스템 언어를 자동으로 감지하여 한글 또는 영문 메시지를 출력합니다.

**지원 언어:**
- 한국어 (ko) - 시스템 언어가 한국어로 설정된 경우
- English (en) - 기본값 및 기타 언어

**언어 감지 방식:**
CLI는 다음 환경 변수를 순서대로 확인하여 언어를 자동 감지합니다:
1. `LANG`
2. `LANGUAGE`
3. `LC_ALL`

환경 변수가 `ko`로 시작하면 한글 메시지가 표시되고, 그 외의 경우 영문 메시지가 표시됩니다.

**예시:**
```bash
# 한글 메시지 출력
LANG=ko_KR.UTF-8 gh please ai triage 123
# 출력: 🤖 이슈 #123에 대한 PleaseAI 분류 트리거 중...

# 영문 메시지 출력
LANG=en_US.UTF-8 gh please ai triage 123
# 출력: 🤖 Triggering PleaseAI triage for issue #123...
```

**적용 범위:**
- ✅ 모든 명령어 출력 메시지 (성공, 오류, 진행 상황)
- ✅ 대화형 프롬프트 (`gh please init`)
- ⚠️ GitHub API URL 및 링크는 다국어화되지 않음

## 명령어 참조

### `gh please init`

대화형 설정으로 `.please/config.yml`을 초기화합니다.

**옵션:**

- `-f, --force` - 기존 설정 파일 덮어쓰기
- `-y, --yes` - 프롬프트 건너뛰고 기본 설정 사용

**예시:**

```bash
# 대화형 설정 (첫 설정 시 권장)
gh please init

# 기본값으로 빠른 설정
gh please init --yes

# 기존 설정 덮어쓰기
gh please init --force
```

### `gh please review-reply`

PR 리뷰 코멘트에 답변을 작성합니다.

**인자:**

- `<comment-id>` - 답변할 리뷰 코멘트의 ID (필수)

**옵션:**

- `-b, --body <text>` - 답변 본문 텍스트 (필수, 또는 stdin으로 제공)

**예시:**

```bash
# 간단한 답변
gh please review-reply 1234567890 -b "최신 커밋에서 수정했습니다!"

# 현재 디렉토리 컨텍스트로 답변
# (현재 PR을 자동으로 감지)
cd my-project
git checkout my-feature-branch
gh please review-reply 1234567890 -b "좋은 지적입니다. 리팩토링하겠습니다."

# heredoc을 사용한 여러 줄 답변
gh please review-reply 1234567890 --body "$(cat <<'EOF'
지적해주셔서 감사합니다!

다음과 같이 구현을 업데이트했습니다:
1. 적절한 에러 처리 추가
2. 단위 테스트 포함
3. 문서 업데이트

다른 우려사항이 있으시면 알려주세요.
EOF
)"
```

### AI 명령어

> **플러그인 필요**: 이러한 명령은 AI 플러그인이 설치되어 있어야 합니다.
> 설치: `gh please plugin install ai`

코드 리뷰 및 이슈 관리를 위한 PleaseAI 자동화 워크플로우를 트리거합니다.

#### `gh please ai triage <issue-number>`

이슈를 자동으로 분류하도록 PleaseAI를 트리거합니다 (분류, 라벨 추가 등).

```bash
gh please ai triage 123
```

#### `gh please ai investigate <issue-number>`

버그 또는 이슈를 상세히 조사하도록 PleaseAI를 트리거합니다.

```bash
gh please ai investigate 123
```

#### `gh please ai fix <issue-number>`

이슈에 대한 자동화된 수정을 시도하도록 PleaseAI를 트리거합니다.

```bash
gh please ai fix 123
```

#### `gh please ai review <pr-number>`

풀 리퀘스트에 대한 코드 리뷰를 수행하도록 PleaseAI를 트리거합니다.

```bash
gh please ai review 456
```

#### `gh please ai apply <pr-number>`

풀 리퀘스트에 제안사항을 적용하도록 PleaseAI를 트리거합니다.

```bash
gh please ai apply 456
```

### 이슈 관리 명령어

하위 이슈 및 의존성이 있는 GitHub 이슈를 관리합니다.

#### `gh please issue sub-issue <subcommand> [options]`

이슈 하위 이슈(계층적 이슈 관계)를 관리합니다.

**하위 명령어:**

- `create <parent-issue> --title "..."` - 상위 이슈에 연결된 새 하위 이슈 생성
- `add <parent-issue> <child-issue>` - 기존 이슈를 하위 이슈로 연결
- `remove <parent-issue> <child-issue>` - 상위 이슈에서 하위 이슈 연결 해제
- `list <parent-issue>` - 상위 이슈의 모든 하위 이슈 나열

**예시:**

```bash
# 새 하위 이슈 생성
gh please issue sub-issue create 100 --title "검증 로직 수정" --body "사용자 입력 검증 추가"

# 기존 이슈 연결
gh please issue sub-issue add 100 101
gh please issue sub-issue add 100 102

# 모든 하위 이슈 나열
gh please issue sub-issue list 100

# 하위 이슈 연결 제거
gh please issue sub-issue remove 100 101
```

#### `gh please issue dependency <subcommand> [options]`

"blocked by" 관계를 사용하여 이슈 의존성을 관리합니다.

**하위 명령어:**

- `add <issue> --blocked-by <blocker>` - 이슈가 다른 이슈에 의해 차단됨으로 표시
- `remove <issue> <blocker>` - 차단 의존성 제거
- `list <issue>` - 특정 이슈를 차단하는 모든 이슈 나열

**예시:**

```bash
# 이슈를 차단됨으로 표시
gh please issue dependency add 200 --blocked-by 199

# 차단 이슈 보기
gh please issue dependency list 200

# 차단 관계 제거
gh please issue dependency remove 200 199
```

### PR 관리 명령어

풀 리퀘스트 리뷰 및 스레드를 관리합니다.

#### `gh please pr review-reply <comment-id> --body "..."`

PR 리뷰 코멘트에 답변을 작성합니다. 더 이상 사용되지 않는 `gh please review-reply`를 대체합니다.

**인자:**

- `<comment-id>` - 리뷰 코멘트의 ID (코멘트 URL에서 확인)

**옵션:**

- `-b, --body <text>` - 답변 텍스트 (파이프하지 않는 경우 필수)

**예시:**

```bash
# 직접 답변
gh please pr review-reply 1234567890 --body "최신 커밋에서 수정했습니다!"

# 파일에서 파이프
cat reply.txt | gh please pr review-reply 1234567890

# 여러 줄 답변
gh please pr review-reply 1234567890 --body "$(cat <<'EOF'
좋아 보이지만:

1. 에러 처리를 추가해주세요
2. 엣지 케이스에 대한 단위 테스트 추가

수정 감사합니다!
EOF
)"
```

#### `gh please pr resolve <pr-number> [--thread <id> | --all]`

풀 리퀘스트의 리뷰 스레드를 해결합니다.

**인자:**

- `<pr-number>` - 풀 리퀘스트 번호

**옵션:**

- `--thread <id>` - 특정 스레드 해결
- `--all` - 모든 미해결 스레드 해결

**예시:**

```bash
# 모든 스레드 해결
gh please pr resolve 456 --all

# 특정 스레드 해결
gh please pr resolve 456 --thread MDEyOlB1bGxSZXF1ZXN0UmV2aWV3VGhyZWFk...
```

### 하위 호환성

이전 `gh please review-reply` 명령은 여전히 작동하지만 사용 중단 경고가 표시됩니다. `gh please pr review-reply`로 마이그레이션해주세요.

## API 제한사항

### 최상위 코멘트만 가능

이 확장 프로그램은 GitHub API 엔드포인트를 사용합니다:

```
POST /repos/{owner}/{repo}/pulls/{pull_number}/comments/{comment_id}/replies
```

**중요**: 이 엔드포인트는 `comment_id`로 최상위 리뷰 코멘트만 허용합니다. 답글에 대한 답글을 시도하면 API가 에러를 반환합니다.

**작동하는 것**:

- ✅ 코드의 특정 라인에 대한 리뷰 코멘트에 답변
- ✅ 파일에 대한 리뷰 코멘트에 답변

**작동하지 않는 것**:

- ❌ 답글에 대한 답글 (중첩된 답글)

### 속도 제한

GitHub API에는 속도 제한이 있습니다. 인증된 요청(`gh` CLI 사용)의 경우 일반적으로:

- 사용자-서버 요청의 경우 시간당 5,000건

현재 속도 제한 확인:

```bash
gh api rate_limit
```

## 개발

### 프로젝트 구조

```
@pleaseai/gh-please/
├── src/
│   ├── commands/         # 명령어 구현
│   │   ├── init.ts      # PleaseAI 설정 초기화
│   │   └── review-reply.ts  # PR 코멘트에 답변
│   ├── config/          # 설정 스키마 및 검증
│   │   └── schema.ts    # .please/config.yml용 Zod 스키마
│   ├── lib/             # 재사용 가능한 유틸리티
│   │   ├── github-api.ts    # GitHub API 헬퍼
│   │   ├── validation.ts    # 입력 검증
│   │   └── i18n.ts         # 다국어 지원 (한국어/영어)
│   ├── index.ts         # CLI 진입점
│   └── types.ts         # TypeScript 타입 정의
├── test/
│   ├── commands/        # 명령어 테스트
│   ├── lib/             # 라이브러리 테스트
│   │   ├── github-api.test.ts
│   │   └── validation.test.ts
│   └── fixtures/        # 테스트 데이터
│       └── mock-data.ts
├── script/
│   └── build.sh         # 릴리스용 빌드 스크립트
├── gh-extension-please  # 런처 스크립트
├── package.json
├── tsconfig.json
└── README.md
```

### 빌드

```bash
# 모든 플랫폼용 빌드
./script/build.sh

# 개발용 빌드 (단일 플랫폼)
bun build src/index.ts --outdir dist --target bun --format esm
```

### 로컬 실행

```bash
# bun으로 직접 명령어 실행
bun run src/index.ts init --help
bun run src/index.ts review-reply --help

# 또는 런처 스크립트 사용
./gh-extension-please init --help
./gh-extension-please review-reply --help
```

### 타입 검사

```bash
bun run type-check
```

### 테스트

프로젝트는 포괄적인 다단계 테스트 전략을 포함합니다:

#### 빠른 테스트 명령어

```bash
# 모든 자동화 테스트 실행 (단위 + 통합)
bun run test:all

# 단위 테스트만 실행 (가장 빠름)
bun run test:unit

# 통합 테스트 실행 (CLI 실행)
bun run test:integration

# E2E 테스트 실행 (GITHUB_TEST_TOKEN 필요)
export GITHUB_TEST_TOKEN=ghp_your_token
bun run test:e2e

# 커버리지와 함께 실행
bun run test:coverage

# 개발용 워치 모드
bun run test:watch

# 수동 스모크 테스트 (대화형)
bun run test:manual
```

#### 테스트 레벨

**1. 단위 테스트** (`test/lib/`, `test/commands/`)
- 빠른 실행 (~100ms)
- 격리된 함수 테스트
- GitHub API 호출 모킹
- 13개 테스트 파일에 걸쳐 **87개 테스트 케이스**

**2. 통합 테스트** (`test/integration/cli/`)
- 중간 속도 (~2-5초)
- 전체 CLI 명령어 실행
- GitHub 환경 모킹
- 모든 명령어 그룹 테스트 (AI, issue, PR)

**3. E2E 테스트** (`test/e2e/`) - 선택사항
- 실제 GitHub API 테스트
- `GITHUB_TEST_TOKEN` 필요
- 테스트 후 자동 정리
- 중요 워크플로우 테스트 (하위 이슈, 의존성)

**4. 수동 테스트**
- 자동화된 스모크 테스트 스크립트: `./scripts/manual-test.sh`
- 종합 가이드: `docs/testing/manual-testing-guide.md`

#### 커버리지

| 컴포넌트 | 테스트 | 커버리지 목표 |
|-----------|-------|-----------------|
| 단위 테스트 | 87개 테스트 | 90%+ |
| 통합 | 종합적 | 80%+ |
| E2E | 중요 경로 | 하위 이슈, 의존성 |

자세한 내용은 [테스트 개요](docs/testing/testing-overview.md)를 참조하세요.

## 기여

기여를 환영합니다! 풀 리퀘스트를 자유롭게 제출해주세요.

## 라이선스

MIT

## v0.3.0 히스토리 노트

v0.3.0 이전에는 AI 명령이 메인 코드베이스에 포함되어 있었습니다. 오픈소스 모델을 지원하기 위해 별도 플러그인으로 분리되었습니다.

**Git 히스토리에 포함된 내용:**
- AI 명령 구현은 단순한 GitHub 코멘트 트리거였습니다
- 실제 AI 처리는 서버 측에서 발생합니다
- 트리거는 `/please-triage`, `/please-review` 등의 코멘트만 게시합니다

이는 Git 히스토리에 독점 AI 로직이 포함되지 않고 트리거 메커니즘만 포함되었음을 의미합니다.

### 마이그레이션

v0.2.x에서 업그레이드하는 경우 [마이그레이션 가이드](./docs/MIGRATION_v0.3.md)를 참조하세요.

## 관련 문서

- [플러그인 개발 가이드](./docs/PLUGIN_DEVELOPMENT.md)
- [사용 가능한 플러그인](./docs/AVAILABLE_PLUGINS.md)
- [v0.3.0 마이그레이션 가이드](./docs/MIGRATION_v0.3.md)
- [GitHub CLI 매뉴얼](https://cli.github.com/manual/)
- [GitHub CLI 확장 프로그램 만들기](https://docs.github.com/en/enterprise-cloud@latest/github-cli/github-cli/creating-github-cli-extensions)
- [GitHub REST API - 풀 리퀘스트 리뷰 코멘트](https://docs.github.com/en/rest/pulls/comments)
- [Bun 문서](https://bun.sh/docs)
