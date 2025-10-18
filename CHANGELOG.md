# Changelog

## [0.3.0](https://github.com/pleaseai/gh-please/compare/github-v0.2.0...github-v0.3.0) (2025-10-18)


### Features

* add --repo option to all commands for cross-repository operations ([37a1d35](https://github.com/pleaseai/gh-please/commit/37a1d35a84b12d57121a6088b6684085fe156d44))
* add system language-based i18n support for all commands ([d68847c](https://github.com/pleaseai/gh-please/commit/d68847c9d99c4a6a14b503ef76ef4e6c9409e4e3))


### Documentation

* add --repo option documentation to README files ([795581c](https://github.com/pleaseai/gh-please/commit/795581c03881da17d7b94b5cf8657401458e1002))
* add bilingual documentation (Korean/English) ([22c0edd](https://github.com/pleaseai/gh-please/commit/22c0edd293b0fb86198cbb6448f91a79e677aa93))
* change default README to Korean ([dd6a7e1](https://github.com/pleaseai/gh-please/commit/dd6a7e13f42ccd2e0ba8c606c1144b1ba736e330))

## [0.2.0](https://github.com/pleaseai/github/compare/github-v0.1.0...github-v0.2.0) (2025-10-18)


### Features

* add GraphQL and REST API client implementations for issue management ([c7edf07](https://github.com/pleaseai/github/commit/c7edf0741303b70c184853122af15145fdcec559))
* add init command to generate .please/config.yml ([92f7c5e](https://github.com/pleaseai/github/commit/92f7c5e086a52c6f5fb5fddbd7028a5f77be9812))
* add interactive configuration with @clack/prompts and i18n support ([b5d995e](https://github.com/pleaseai/github/commit/b5d995efb13527c12793c7ddcf8bc86a58b1fd44))
* implement command expansion for v0.2.0 ([a35e700](https://github.com/pleaseai/github/commit/a35e700cf664401ffe68179fdb97955218a69301))
* implement GraphQL API layer for GitHub issue and PR management ([74f3b69](https://github.com/pleaseai/github/commit/74f3b699f7e5512975a09dbf01d4271ffaed449f))
* PR 리뷰 댓글 답변 기능 구현 ([eee9e53](https://github.com/pleaseai/github/commit/eee9e53e350000408bb2297340f11882737a8984))
* **test:** enable LCOV coverage generation with Codecov integration ([0bde2e6](https://github.com/pleaseai/github/commit/0bde2e652286f166d097a5a60fcd695083cbb7cc))


### Bug Fixes

* **ci:** correct GitHub Actions syntax for secret checking ([0f52ff3](https://github.com/pleaseai/github/commit/0f52ff35f50bfc999b755f8db19a58df03854e17))
* **lint:** disable regexp rules for bash pattern compatibility ([e43ee6b](https://github.com/pleaseai/github/commit/e43ee6b9deb46fe1e00cbcd0d4120ca76189ae4a))
* refactor integration test mocking to use GH_PATH injection ([fa61246](https://github.com/pleaseai/github/commit/fa612469e50a4339c5de1e4ddf099d8f5bfd40c3))
* resolve lint errors and improve test scripts ([a9b007e](https://github.com/pleaseai/github/commit/a9b007e7b1a196e7fdbbc795cbec97a4a734c7df))
* **sub-issue:** add null check for regex capture group ([74043aa](https://github.com/pleaseai/github/commit/74043aa6160bcef12296ba591aeff560192817c2))
* **test:** convert \d+ to [0-9]+ for bash regex compatibility ([9fb74ed](https://github.com/pleaseai/github/commit/9fb74ed2f55389a2cfbe21bd0dc56691ff6d434d))
* **test:** fix all integration test failures - 63/63 passing ([2432d9f](https://github.com/pleaseai/github/commit/2432d9f500ea3da3ad45353510076263235ae806))
* **test:** fix bash regex pattern quoting in mock generator ([383a6e0](https://github.com/pleaseai/github/commit/383a6e09ffda6cdd9f5b39daa82d368b934c78a1))
* **test:** restore working directory after init tests to fix coverage generation ([7e7612a](https://github.com/pleaseai/github/commit/7e7612a81fc59514e383ccaeb8aedf8d1d2b3b73))
* **test:** simplify coverage generation by removing unnecessary wrapper script ([447a35b](https://github.com/pleaseai/github/commit/447a35b8f2ab4a28556541adf5e82e02968b01d9))
* **test:** update integration test patterns and assertions ([df6ec19](https://github.com/pleaseai/github/commit/df6ec198b36107e726f08d5c5842bc667bdf8d54))
* update all integration test calls to pass GH_PATH env var ([44db15f](https://github.com/pleaseai/github/commit/44db15f44caad4831cbbdae97e81d6d91aab5f45))


### Documentation

* add architecture and planning documents for command expansion ([f8d5f64](https://github.com/pleaseai/github/commit/f8d5f64930791c0c6d73bcd7cffc85e4b3e7ace6))
* add issue workflow documentation ([b192f17](https://github.com/pleaseai/github/commit/b192f1756741cb25d171166daf4f8fdf259ae659))
* enhance testing, documentation, and cleanup for v0.2.0 release ([eb60934](https://github.com/pleaseai/github/commit/eb609341694371cf7b1a5e62402f74be65f67fbd))
* README에 테스트 섹션 추가 ([1ea8381](https://github.com/pleaseai/github/commit/1ea8381c980297289b81296ca57bd80c7dc3f369))
* update CLAUDE.md with GraphQL implementation details ([e9b377f](https://github.com/pleaseai/github/commit/e9b377f11bf92034649e7256c12bbc630b0ebe43))
* update CLAUDE.md with v0.2.0 command structure ([70b33fb](https://github.com/pleaseai/github/commit/70b33fb208a112f4ae6b5cfbe71a1c09ecf9e733))
* update Codecov badge with authentication token ([741cf08](https://github.com/pleaseai/github/commit/741cf0817199cd396b5813d2e373f3685e5bd537))
