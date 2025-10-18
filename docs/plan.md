     Overview

     Bun/TypeScript 기반 GitHub CLI extension 개발. PR 리뷰 코멘트에 답변을 작성하는 기능 구현.

     Command Syntax

     gh please review-reply <comment-id> --body "reply text"
     gh please review-reply <comment-id> -b "reply text"

     Implementation Steps

     1. Project Setup

     - package.json 생성 (Bun 프로젝트 초기화)
     - TypeScript 설정 (tsconfig.json)
     - 의존성 설치: commander (CLI 파싱), @octokit/rest (GitHub API)
     - src/ 디렉토리 구조 생성

     2. Main Entry Point

     - src/index.ts: CLI 진입점 및 argument parsing
     - --body/-b flag 구현
     - Comment ID validation
     - 현재 PR context 자동 감지 (gh pr view --json number)

     3. GitHub API Integration

     - src/github-api.ts: GitHub API wrapper
     - PR number, owner, repo 정보 추출
     - POST /repos/{owner}/{repo}/pulls/{pull_number}/comments/{comment_id}/replies 호출
     - Error handling (존재하지 않는 comment, 권한 문제 등)

     4. Build & Package

     - gh-extension-please shell script 업데이트 → Bun 실행기로 변경
     - script/build.sh 구현: Bun으로 standalone executable 빌드
     - GitHub Actions workflow 테스트 준비

     5. Documentation

     - README.md 작성: 설치 방법, 사용 예제, API 제한사항
     - Top-level review comment만 지원한다는 제약사항 명시

     File Structure

     gh-extension-please
     ├── src/
     │   ├── index.ts          # CLI entry point
     │   ├── github-api.ts     # GitHub API wrapper
     │   └── types.ts          # TypeScript types
     ├── package.json
     ├── tsconfig.json
     ├── gh-extension-please   # Bun launcher script
     ├── script/build.sh       # Build script
     └── README.md

     Key Features

     ✅ Basic reply functionality✅ Mixed positional/flag arguments✅ Auto-detect current PR context✅ Comprehensive error messages✅ TypeScript type safety