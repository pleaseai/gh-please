# @pleaseai/gh-please

[![npm version](https://badge.fury.io/js/@pleaseai%2Fgh-please.svg)](https://badge.fury.io/js/@pleaseai%2Fgh-please)
[![CI](https://github.com/pleaseai/gh-please/actions/workflows/ci.yml/badge.svg)](https://github.com/pleaseai/gh-please/actions/workflows/ci.yml)
[![codecov](https://codecov.io/github/pleaseai/gh-please/graph/badge.svg?token=BQKO959X1M)](https://codecov.io/github/pleaseai/gh-please)
[![code style](https://antfu.me/badge-code-style.svg)](https://github.com/antfu/eslint-config)

GitHub CLI 확장 프로그램 - LLM을 위한 GitHub 도구

한국어 | [English](./README.md)

## 개요

`@pleaseai/gh-please`는 GitHub CLI를 위한 강력한 확장 프로그램으로, 이슈 및 PR 관리를 향상시킵니다.

### 핵심 기능 (내장)
- **gh CLI Passthrough**: 모든 GitHub CLI 명령어를 gh-please를 통해 사용 가능, 선택적 TOON/JSON 형식 지원
- **이슈 관리**: 이슈 타입, Sub-issue 및 의존성 관계, 워크트리 기반 개발 워크플로우
- **PR 관리**: 리뷰 코멘트 답변, 스레드 해결, 코멘트 편집
- **LLM 친화적 출력**: 모든 명령어에서 JSON, TOON (58.9% 토큰 절감) 형식 지원
- **다국어 지원**: 한글/영문 자동 감지
- **플러그인 시스템**: 확장 가능한 아키텍처

### 최신 업데이트 (v0.18.0)
- 🚀 **gh CLI Passthrough** - gh-please를 통해 모든 100+ GitHub CLI 명령어 사용 가능
- ✨ **TOON 형식 지원** - 모든 리스트 명령어에서 LLM 친화적 출력을 위한 58.9% 토큰 절감
- ✨ **자동 형식 변환** - 모든 gh 명령어 출력을 TOON 또는 JSON 형식으로 변환
- ✨ **ID 변환 유틸리티** - 코멘트 작업에서 Database ID와 Node ID 모두 지원
- ✨ **PR 리뷰 스레드 목록** - Node ID와 복사 가능한 resolve 명령어 표시
- ✨ **E2E 테스팅** - 포괄적인 종단간 테스트 커버리지 (26개 테스트, 100% 통과율)
- ✨ **코멘트 관리** - Issue/PR 코멘트 리스트 조회 및 편집

## 빠른 시작

### 설치

```bash
gh extension install pleaseai/gh-please
```

### 5분 안에 시작하기

```bash
# 이슈 관리
gh please issue create --title "버그 수정" --type Bug
gh please issue sub-issue create 100 --title "서브 태스크"
gh please issue dependency add 200 --blocked-by 199
gh please issue develop 123  # 워크트리 자동 생성

# 이슈 타입
gh please issue type list
gh please issue type set 123 --type Feature
gh please issue type remove 123

# PR 관리
gh please pr review reply 1234567890 -b "수정했습니다!"
gh please pr review thread list 456              # Node ID와 함께 스레드 목록 표시
gh please pr review thread list 456 --unresolved-only
gh please pr review thread resolve 456 --all

# 코멘트 관리
gh please issue comment list 123 --format json
gh please pr comment edit 987654321 --body "업데이트된 내용"
```

## 주요 기능

### 🔄 gh CLI Passthrough

gh-please는 패스스루를 통해 **모든** GitHub CLI 명령어를 자동으로 지원합니다:

```bash
# 모든 gh 명령어가 gh-please를 통해 작동
gh please repo view
gh please workflow list
gh please release create v1.0.0

# TOON 형식으로 출력 변환 (58.9% 토큰 절감)
gh please issue list --format toon
gh please pr checks 123 --format toon
gh please workflow list --format toon

# 자동화를 위한 JSON 출력
gh please pr list --format json
gh please repo view --format json
```

**작동 방식:**
- 등록되지 않은 명령어는 자동으로 gh CLI로 전달
- `--format toon`은 JSON 출력을 TOON 형식으로 변환 (58.9% 토큰 절감)
- `--format json`은 JSON 출력 유지
- 형식 플래그 없음 → gh CLI의 원본 테이블 출력 유지
- `--json` 플래그를 지원하는 모든 gh 명령어에서 작동

**장점:**
- ✅ **완전한 gh CLI 커버리지** - 모든 100+ gh 명령어 사용 가능
- ✅ **LLM 친화적** - AI/자동화에 최적화된 TOON 형식
- ✅ **자동 업데이트** - 새로운 gh CLI 기능이 즉시 작동
- ✅ **학습 곡선 없음** - 익숙한 gh 명령어 사용

[Passthrough 문서 →](docs/ko/features/gh-cli-passthrough.md)

### 이슈 개발 워크플로우

```bash
# 이슈에 대한 격리된 워크스페이스 생성
gh please issue develop 123
# → ~/.please/worktrees/repo/feat-123-feature 생성

# 작업 후 정리
gh please issue cleanup
```

[워크플로우 상세 가이드 →](docs/content/4.workflows/1.issue-workflow.md)

### 이슈 타입 관리

```bash
# 타입과 함께 이슈 생성
gh please issue create --title "로그인 버그" --type Bug

# 사용 가능한 이슈 타입 목록
gh please issue type list
gh please issue type list --json name,color

# 이슈 타입 설정/수정
gh please issue type set 123 --type Feature

# 이슈 타입 제거
gh please issue type remove 123
```

### Sub-Issue 관리

```bash
# 계층적 이슈 구조
gh please issue sub-issue create 100 --title "작업 1"
gh please issue sub-issue list 100 --format markdown
```

### PR 리뷰 워크플로우

```bash
# 피드백 대응
gh please pr review reply <comment-id> -b "커밋 abc123에서 수정"

# 모든 스레드 해결
gh please pr review thread resolve 456 --all
```

[PR 리뷰 가이드 →](docs/content/4.workflows/2.pr-review-workflow.md)

### LLM 친화적 출력

```bash
# 사람이 읽기 좋은 형식 (기본값)
gh please issue sub-issue list 123

# LLM 처리용 TOON 형식 (58.9% 토큰 절감)
gh please issue sub-issue list 123 --format toon
gh please pr review thread list 456 --format toon

# 스크립트 및 자동화용 JSON
gh please issue sub-issue list 123 --format json
gh please pr list --state open --format json

# 패스스루 명령어에서도 작동
gh please workflow list --format toon
gh please repo view --format json
```

## 📚 문서

### 시작하기
- [설치 가이드](./docs/content/ko/1.guide/1.getting-started.md)
- [5분 퀵스타트](./docs/content/ko/1.guide/2.quick-start.md)

### 기능 가이드
- [gh CLI Passthrough](docs/ko/features/gh-cli-passthrough.md) - TOON/JSON 형식으로 모든 GitHub CLI 명령어 사용
- [이슈 관리](./docs/content/ko/2.features/1.issue-management.md) - Sub-issue, 의존성, 개발 워크플로우
- [PR 관리](./docs/content/ko/2.features/2.pr-management.md) - 리뷰 답변, 스레드 해결
- [LLM 친화적 출력](./docs/content/ko/2.features/3.output-formats.md) - 자동화를 위한 JSON, TOON 형식
- [플러그인 시스템](./docs/content/ko/2.features/4.plugin-system.md) - 확장 기능

### 워크플로우
- [이슈 개발 워크플로우](./docs/content/ko/4.workflows/1.issue-workflow.md)
- [PR 리뷰 워크플로우](./docs/content/ko/4.workflows/2.pr-review-workflow.md)

### 고급 주제
- [다국어 지원 (i18n)](./docs/content/ko/5.advanced/1.i18n.md)
- [API 제한사항](./docs/content/ko/5.advanced/2.api-limitations.md)

## 공통 옵션

모든 명령어는 `--repo` 옵션을 지원합니다:

```bash
# 현재 디렉토리 (기본)
gh please issue sub-issue list 123

# 다른 저장소 지정
gh please issue sub-issue list 123 --repo owner/repo
gh please pr review reply <id> -b "text" -R owner/repo
```

## Claude Code 통합

Claude Code 플러그인을 사용하면 AI가 자동으로 적절한 명령어를 제안합니다.

### 설치

```bash
# 회사 내부 마켓플레이스
claude plugin install pleaseai-github

# 로컬 개발
ln -s $(pwd)/.claude-plugin ~/.claude/plugins/pleaseai-github
```

### 사용 예시

```
사용자: "이슈 #123에 대한 sub-issue 생성해줘"
Claude: gh please issue sub-issue create 123 --title "..."

사용자: "PR 리뷰 코멘트에 답변"
Claude: gh please pr review reply <comment-id> --body "..."
```

자세한 내용은 [.claude-plugin/README.md](./.claude-plugin/README.md)를 참조하세요.

## 플러그인 시스템

v0.3.0부터 모듈형 플러그인 아키텍처를 사용합니다.

```bash
# 플러그인 관리
gh please plugin list
gh please plugin install <name>
gh please plugin uninstall <name>
```

**사용 가능한 플러그인:**
- **@pleaseai/gh-please-ai** (프리미엄) - AI 기반 코드 리뷰 및 이슈 자동화

[플러그인 가이드 →](docs/content/2.features/4.plugin-system.md) | [플러그인 개발 →](./docs/PLUGIN_DEVELOPMENT.md)

## 개발

### 사전 요구사항

- [GitHub CLI (`gh`)](https://cli.github.com/) - 버전 2.0 이상
- [Bun](https://bun.sh) - JavaScript 런타임

### 개발용 설치

```bash
git clone https://github.com/pleaseai/gh-please.git
cd gh-please
bun install
gh extension install .
```

### 개발 명령어

```bash
# 빌드
bun run build

# 프로덕션 빌드 (최적화된 실행 파일)
bun run build:prod

# 타입 검사
bun run type-check

# 린트 (자동 수정)
bun run lint:fix

# 테스트
bun test
bun run test:unit         # 단위 테스트만
bun run test:integration  # 통합 테스트
bun run test:e2e          # 종단간 테스트 (GITHUB_TOKEN 필요)
bun run test:coverage     # 커버리지와 함께
```

### 품질 검사

커밋 전 필수 실행:

```bash
bun run lint:fix && bun run type-check && bun test
```

## 📚 문서

### 사용자 문서
- **[docs/](./docs/)** - Docus 기반 문서 사이트 (English + 한국어)
  - `/en` - 영문 문서
  - `/ko` - 한글 문서
  - 로컬 실행: `cd docs && bun run dev`

### 개발 문서
- **[docs-dev/](./docs-dev/)** - 내부 개발 문서
  - [개발 표준](./docs-dev/STANDARDS.md) - 코딩 규칙 및 필수 규칙
  - [커밋 컨벤션](./docs-dev/commit-convention.md) - Conventional Commits
  - [테스트 가이드](./docs-dev/TESTING.md) - 테스트 모범 사례
  - [TDD 워크플로우](./docs-dev/TDD.md) - Red-Green-Refactor
  - [ADR](./docs-dev/adr/) - Architecture Decision Records
  - [플러그인 개발](./docs-dev/PLUGIN_DEVELOPMENT.md) - 플러그인 개발 가이드
  - [릴리스 프로세스](./docs-dev/RELEASE.md) - 릴리스 절차

## 기여

기여를 환영합니다! 개발 문서를 참조하세요:

## 라이선스

MIT
