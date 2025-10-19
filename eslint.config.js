import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  ignores: [
    // Ignore Claude Code plugin documentation
    '.claude-plugin/**',
  ],
}, {
  rules: {
    // CLI 도구 특성상 console 사용 필요
    'no-console': 'off',
    // Bun 런타임에서는 global process/buffer 사용이 일반적
    'node/prefer-global/process': 'off',
    'node/prefer-global/buffer': 'off',
    // GraphQL 코드 블록 포맷팅 충돌 회피
    'format/prettier': 'off',
    // Zod의 상수와 타입은 같은 이름을 공유하는 정상적인 패턴
    'ts/no-redeclare': 'off',
    // 테스트 파일에서 require 사용
    'ts/no-require-imports': 'off',
    // GraphQL 스키마 문서의 공백 무시
    'no-irregular-whitespace': 'off',
  },
})
