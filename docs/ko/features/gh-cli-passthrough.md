# gh CLI Passthrough

gh-please는 passthrough를 통해 **모든** GitHub CLI 명령어를 자동으로 지원합니다. 명시적으로 등록되지 않은 명령어도 사용할 수 있습니다.

## 개요

gh-please가 인식하지 못하는 명령어(예: `issue`, `pr`, `plugin`이 아닌 명령어)를 실행하면, 자동으로 네이티브 `gh` CLI로 전달됩니다. 이를 통해 다음과 같은 이점을 얻을 수 있습니다:

- ✅ **완전한 gh CLI 커버리지** - gh-please를 통해 100개 이상의 gh 명령어 접근 가능
- ✅ **자동 업데이트** - 새로운 gh CLI 기능이 즉시 작동
- ✅ **TOON 형식 지원** - 모든 gh 출력을 TOON 형식으로 변환 가능
- ✅ **학습 곡선 없음** - 익숙한 gh 명령어 그대로 사용

## 기본 사용법

### 기본 동작

기본적으로 passthrough 명령어는 gh CLI의 원본 출력 형식(사람이 읽기 쉬운 테이블)을 유지합니다:

```bash
# 저장소 정보 보기 (포맷된 테이블 출력)
gh please repo view

# 워크플로우 실행 목록 (컬러 테이블 출력)
gh please workflow list

# 릴리스 정보 보기 (포맷된 상세 정보)
gh please release view v1.0.0
```

**출력**: `gh <명령어>`를 직접 실행한 것과 동일 - 포맷된 테이블, 컬러, 진행 표시기 포함

## 구조화된 출력 형식

### TOON 형식

gh CLI 출력을 TOON 형식(탭 구분, LLM 최적화)으로 변환:

```bash
# TOON 형식으로 이슈 목록 보기
gh please issue list --format toon

# TOON 형식으로 열린 PR 목록 보기
gh please pr list --format toon --state open

# TOON 형식으로 저장소 상세 정보 보기
gh please repo view --format toon
```

**예시 출력**:
```
number  title          state   author
123     TOON 지원 추가 OPEN    monalisa
124     버그 수정      CLOSED  octocat
```

### JSON 형식

기계가 읽을 수 있는 JSON 출력 얻기:

```bash
# JSON으로 이슈 목록 보기
gh please issue list --format json

# 특정 필드만 포함하여 JSON으로 PR 목록 보기
gh please pr list --state open --json number,title,author
```

**예시 출력**:
```json
[
  {
    "number": 123,
    "title": "TOON 지원 추가",
    "state": "OPEN",
    "author": {
      "login": "monalisa"
    }
  }
]
```

### JMESPath 쿼리 지원 (Phase 1.5)

`--query` 플래그를 사용하여 JMESPath 쿼리로 출력을 필터링하고 변환할 수 있습니다:

```bash
# 드래프트 릴리스 필터링
gh please release list --query '[?isDraft]'

# 최신 릴리스만 가져오기
gh please release list --query '[?isLatest]'

# 열린 이슈만 필터링
gh please issue list --query "[?state=='OPEN']"

# 특정 필드 추출
gh please release view v1.0.0 --query 'tagName'

# 복잡한 변환
gh please issue list --query '[?state==`OPEN`].{number:number,title:title}'
```

**예시 출력** (드래프트 릴리스 필터링):
```
[0	]:
```
_드래프트 릴리스가 없어서 빈 배열 반환_

**예시 출력** (최신 릴리스):
```
[1	]{createdAt	isDraft	isLatest	isPrerelease	name	publishedAt	tagName}:
  "2025-11-01T10:39:16Z"	false	true	false	"github: v0.25.0"	"2025-11-01T10:39:26Z"	github-v0.25.0
```

**일반적인 쿼리 패턴**:

```bash
# 불리언 필드로 필터링
--query '[?isDraft]'                    # 드래프트 릴리스
--query '[?!isDraft]'                   # 드래프트가 아닌 릴리스

# 문자열 비교로 필터링
--query "[?state=='OPEN']"              # 열린 이슈/PR
--query "[?author.login=='octocat']"    # 작성자로 필터링

# 단일 필드 추출
--query 'tagName'                       # 릴리스에서 태그 이름 가져오기
--query 'items[0].number'               # 첫 번째 항목 번호 가져오기

# 특정 필드 투영
--query '[].{id:number,title:title}'    # 사용자 정의 객체 구조 생성
--query '[?state==`OPEN`].[number,title]'  # 배열의 배열

# 필터 조합
--query '[?isDraft && isPrerelease]'    # 드래프트 AND 프리릴리스
--query '[?isDraft || isPrerelease]'    # 드래프트 OR 프리릴리스
```

**JMESPath 리소스**:
- [JMESPath 튜토리얼](https://jmespath.org/tutorial.html)
- [JMESPath 사양](https://jmespath.org/specification.html)
- [JMESPath 예제](https://jmespath.org/examples.html)

## 명령어 우선순위

gh-please의 등록된 명령어가 passthrough보다 우선합니다:

```bash
# gh-please 구현 사용 (서브 이슈, TOON 기본값 등 향상된 기능)
gh please issue sub-issue list 123

# gh-please 구현 사용 (리뷰 답변, 스레드 해결)
gh please pr review reply 456 -b "잘했어요!"

# passthrough 사용 (gh-please에 등록되지 않은 명령어)
gh please repo view
gh please workflow list
```

**등록된 명령어**:
- `issue` - 서브 이슈 및 의존성을 포함한 이슈 관리
- `pr` - 리뷰 기능을 포함한 풀 리퀘스트 관리
- `plugin` - 플러그인 관리 시스템

**기타 모든 명령어**: 자동으로 gh CLI로 passthrough

## 형식 변환 세부사항

### 작동 방식

`--format toon` 또는 `--format json`을 사용하면:

1. gh-please가 gh 명령어에 `--json` 플래그 추가
2. gh CLI가 구조화된 JSON 데이터 반환
3. gh-please가 JSON을 요청된 형식(TOON 또는 JSON)으로 변환
4. 선택한 형식으로 출력 표시

### 지원되는 명령어

형식 변환은 `--json` 플래그를 지원하는 모든 gh 명령어에서 작동합니다. 대부분의 gh 명령어가 지원하며, 다음이 포함됩니다:

- ✅ `issue list`, `issue view`
- ✅ `pr list`, `pr view`, `pr checks`
- ✅ `repo list`, `repo view`
- ✅ `workflow list`, `workflow view`
- ✅ `release list`, `release view`
- ✅ 그 외 다수...

### 지원되지 않는 명령어

일부 gh 명령어는 `--json`을 지원하지 않습니다:

```bash
# 다음 명령어들은 --json을 지원하지 않음
gh please auth status --format toon  # 오류: 플래그 미지원
gh please repo clone owner/repo --format toon  # 오류: 플래그 미지원
```

**오류 메시지**:
```
❌ 오류: 이 명령어는 구조화된 출력을 지원하지 않습니다.
--format 플래그 없이 실행해 보세요: gh please <명령어>
```

## 예제

### 저장소 작업

```bash
# 현재 저장소 보기 (포맷된 테이블)
gh please repo view

# TOON 형식으로 저장소 보기
gh please repo view --format toon

# 내 저장소 목록
gh please repo list --limit 10

# TOON 형식으로 저장소 목록
gh please repo list --limit 10 --format toon
```

### 워크플로우 작업

```bash
# 워크플로우 실행 목록
gh please workflow list

# TOON 형식으로 워크플로우 실행 목록
gh please workflow list --format toon

# 특정 워크플로우 실행 보기
gh please workflow view 12345

# JSON 형식으로 워크플로우 실행 보기
gh please workflow view 12345 --format json
```

### 릴리스 작업

```bash
# 릴리스 목록
gh please release list

# TOON 형식으로 릴리스 목록
gh please release list --format toon

# JMESPath로 드래프트 릴리스 필터링
gh please release list --query '[?isDraft]'

# 최신 릴리스만 가져오기
gh please release list --query '[?isLatest]'

# 특정 릴리스 보기
gh please release view v1.0.0

# 릴리스 보기 및 태그 이름 추출
gh please release view v1.0.0 --query 'tagName'

# TOON 형식으로 릴리스 보기
gh please release view v1.0.0 --format toon

# 릴리스 생성 (형식 변환 불필요)
gh please release create v1.0.0 --title "v1.0.0"
```

### 체크 실행

```bash
# PR 체크 보기
gh please pr checks 123

# TOON 형식으로 PR 체크 보기
gh please pr checks 123 --format toon
```

## 오류 처리

### 알 수 없는 명령어

잘못된 명령어를 제공하면 gh CLI의 오류 메시지가 표시됩니다:

```bash
gh please invalid-command
```

**출력**:
```
unknown command "invalid-command" for "gh"
```

### 형식 변환 오류

형식 변환이 실패하면 도움이 되는 오류 메시지가 표시됩니다:

```bash
# 명령어가 --json을 지원하지 않음
gh please auth status --format toon
```

**출력**:
```
❌ 오류: 이 명령어는 구조화된 출력을 지원하지 않습니다.
--format 플래그 없이 실행해 보세요: gh please auth status
```

### JSON 파싱 오류

gh CLI가 잘못된 JSON을 반환하는 경우:

```bash
gh please some-command --format toon
```

**출력**:
```
❌ 오류: gh CLI의 JSON 출력을 파싱할 수 없습니다.
실행한 명령어와 함께 이 문제를 보고해 주세요.
```

## 제한사항

1. **--json 지원 필요**: 형식 변환은 `--json` 플래그를 지원하는 명령어에서만 작동
2. **플러그인 명령어**: 플러그인이 추가한 명령어는 passthrough가 아님 (등록된 명령어)
3. **종료 코드**: gh CLI 종료 코드가 보존됨 (0이 아닌 종료는 실행 중단)
4. **대화형 명령어**: 대화형 명령어(예: `gh auth login`)는 작동하지만 TOON/JSON으로 변환 불가

## 팁

### Passthrough를 사용할 때

✅ **다음의 경우 passthrough 사용**:
- gh-please에 구현되지 않은 gh CLI 기능이 필요한 경우
- 자동화/LLM 통합을 위해 TOON 형식이 필요한 경우
- 모든 것에 단일 명령어 접두사(`gh please`)를 선호하는 경우

❌ **다음의 경우 네이티브 gh 사용**:
- 대화형 기능(인증, 프롬프트)이 필요한 경우
- 성능이 중요한 경우 (passthrough는 약 10ms 오버헤드 추가)
- 짧은 명령어를 선호하는 경우 (`gh` vs `gh please`)

### jq와 결합

TOON 또는 JSON 출력을 다른 도구로 파이프할 수 있습니다:

```bash
# 열린 PR을 가져와서 jq로 필터링
gh please pr list --state open --format json | jq '.[].number'

# 이슈를 가져와서 스크립트로 처리
gh please issue list --format toon | awk -F'\t' '{print $1}'
```

### 자동화 스크립트

Passthrough는 자동화에 완벽합니다:

```bash
#!/bin/bash
# TOON 형식으로 모든 열린 이슈 가져오기
issues=$(gh please issue list --state open --format toon)

# TOON 출력 파싱 (탭 구분)
echo "$issues" | while IFS=$'\t' read -r number title state; do
  echo "이슈 #$number 처리 중: $title"
done
```

## 참고

- [GitHub CLI 매뉴얼](https://cli.github.com/manual/) - 전체 gh CLI 문서
- [출력 포맷팅](https://cli.github.com/manual/gh_help_formatting) - gh CLI 형식 옵션
- [TOON 형식 ADR](../../docs-dev/adr/0006-toon-output-format.md) - TOON 형식 명세 및 이점
- [JSON 출력 ADR](../../docs-dev/adr/0003-json-output-implementation.md) - JSON 출력 구현 세부사항
