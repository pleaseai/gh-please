# Changelog

## [0.19.0](https://github.com/pleaseai/gh-please/compare/github-v0.18.0...github-v0.19.0) (2025-10-30)


### Features

* implement gh CLI passthrough with TOON format support ([#97](https://github.com/pleaseai/gh-please/issues/97)) ([e65da0c](https://github.com/pleaseai/gh-please/commit/e65da0c7cd1bf43799621cabd502e0e5a3343469))


### Documentation

* add gh CLI passthrough with TOON and JSON format support ([b3a07e2](https://github.com/pleaseai/gh-please/commit/b3a07e2e87773e75001492c3bca67b0a065d6b70))
* Added EN/KR documentation for passthrough, TOON format, and usage ([b3a07e2](https://github.com/pleaseai/gh-please/commit/b3a07e2e87773e75001492c3bca67b0a065d6b70))

## [0.18.0](https://github.com/pleaseai/gh-please/compare/github-v0.17.0...github-v0.18.0) (2025-10-30)


### Features

* add TOON format support to all list commands ([#91](https://github.com/pleaseai/gh-please/issues/91)) ([110e285](https://github.com/pleaseai/gh-please/commit/110e28523047fe24f6841bd08706e7dc8ba098b8)), closes [#90](https://github.com/pleaseai/gh-please/issues/90)

## [0.17.0](https://github.com/pleaseai/gh-please/compare/github-v0.16.0...github-v0.17.0) (2025-10-30)


### Features

* add TOON output format for LLM token optimization ([#87](https://github.com/pleaseai/gh-please/issues/87)) ([19c0f3d](https://github.com/pleaseai/gh-please/commit/19c0f3dc490e5b05b0c18bcfb31df9de65d7a73b))

## [0.16.0](https://github.com/pleaseai/gh-please/compare/github-v0.15.0...github-v0.16.0) (2025-10-28)


### Features

* add issue type support for gh issue create command ([#83](https://github.com/pleaseai/gh-please/issues/83)) ([eec44e0](https://github.com/pleaseai/gh-please/commit/eec44e03dda69cdec436a485e2d223e5a238b31e))


### Documentation

* add issue type commands to documentation ([efd481b](https://github.com/pleaseai/gh-please/commit/efd481b39bbb761bb662c3c8457de9b37ba67287))

## [0.15.0](https://github.com/pleaseai/gh-please/compare/github-v0.14.0...github-v0.15.0) (2025-10-26)


### Features

* add --json output to plugin list and search commands ([#77](https://github.com/pleaseai/gh-please/issues/77)) ([381d491](https://github.com/pleaseai/gh-please/commit/381d49150269c2d88aed39e7f327a5c6db2796ab))


### Bug Fixes

* correct GraphQL query for review comment thread lookup ([#81](https://github.com/pleaseai/gh-please/issues/81)) ([b30ce57](https://github.com/pleaseai/gh-please/commit/b30ce5747c8f468419df4312e0b5e3bfe43b440c))

## [0.14.0](https://github.com/pleaseai/gh-please/compare/github-v0.13.0...github-v0.14.0) (2025-10-25)


### Features

* implement --json output flag for list commands ([#75](https://github.com/pleaseai/gh-please/issues/75)) ([7db0cef](https://github.com/pleaseai/gh-please/commit/7db0cef87d91e22c7420602cef82eec28bf855cc))
* implement JSON output format for CLI commands with field selection ([40ef909](https://github.com/pleaseai/gh-please/commit/40ef909c6afa9af4dd1d3722cc8d28e5b0e4ce29))


### Bug Fixes

* **config:** change bot response language from Korean to English ([3fd0f59](https://github.com/pleaseai/gh-please/commit/3fd0f593f928462ff4cc241a489b7852735c5516))
* replace deprecated GraphQL API for PR review replies ([#73](https://github.com/pleaseai/gh-please/issues/73)) ([fdf12a8](https://github.com/pleaseai/gh-please/commit/fdf12a83dc7737cdb4507cba63a4c4ab6b7f9ec3))

## [0.13.0](https://github.com/pleaseai/gh-please/compare/github-v0.12.0...github-v0.13.0) (2025-10-24)


### Features

* Add ID converter utility to support Node ID input and general review comments ([#69](https://github.com/pleaseai/gh-please/issues/69)) ([5b4421f](https://github.com/pleaseai/gh-please/commit/5b4421f4c78924125e75ae709e515e1bdbfc7da5))

## [0.12.0](https://github.com/pleaseai/gh-please/compare/github-v0.11.0...github-v0.12.0) (2025-10-23)


### Features

* add E2E tests for PR review threads and comment management ([#66](https://github.com/pleaseai/gh-please/issues/66)) ([1975793](https://github.com/pleaseai/gh-please/commit/197579362902e30cba5c489bf26353c4d81eaa3d))


### Bug Fixes

* improve E2E test infrastructure and move to manual-only workflow ([#64](https://github.com/pleaseai/gh-please/issues/64)) ([4b261e7](https://github.com/pleaseai/gh-please/commit/4b261e7e6eb35c0e5120505b858a3ff4279c6619))


### Documentation

* update documentation to v0.11.0 with latest features ([#67](https://github.com/pleaseai/gh-please/issues/67)) ([280bd85](https://github.com/pleaseai/gh-please/commit/280bd85253e25e9de31030520b041b1e5b1a0cf9))

## [0.11.0](https://github.com/pleaseai/gh-please/compare/github-v0.10.0...github-v0.11.0) (2025-10-23)


### Features

* add pr review thread list command with Node IDs ([#62](https://github.com/pleaseai/gh-please/issues/62)) ([978ef1e](https://github.com/pleaseai/gh-please/commit/978ef1e4b39ed07fb86a1b03c0898586342cc93c))

## [0.10.0](https://github.com/pleaseai/gh-please/compare/github-v0.9.0...github-v0.10.0) (2025-10-23)


### Features

* export lib and types for plugin consumption ([3a8751b](https://github.com/pleaseai/gh-please/commit/3a8751bd7f6138ffc86203cfe80473d14c7016ce))


### Documentation

* add npm version badge to README files ([cc7ddf0](https://github.com/pleaseai/gh-please/commit/cc7ddf044d17b9ca3df536c1c2b6616f4c0f2d18))

## [0.9.0](https://github.com/pleaseai/gh-please/compare/github-v0.8.0...github-v0.9.0) (2025-10-23)


### Features

* Add LLM-friendly output formats (Markdown/XML) - Phases 1-3 ([#53](https://github.com/pleaseai/gh-please/issues/53)) ([c90cf3b](https://github.com/pleaseai/gh-please/commit/c90cf3b53ca578c69a5e71f8654ac7d1be7836bc))
* automate npm publish in release workflow ([#59](https://github.com/pleaseai/gh-please/issues/59)) ([18af496](https://github.com/pleaseai/gh-please/commit/18af496a15853369405baa5f7ae8614205e5f26b)), closes [#35](https://github.com/pleaseai/gh-please/issues/35)


### Bug Fixes

* revert package-name to 'github' in release-please config ([d598b38](https://github.com/pleaseai/gh-please/commit/d598b38d7942f9baf9a6d45227bd3a90aebe5471)), closes [#60](https://github.com/pleaseai/gh-please/issues/60) [#55](https://github.com/pleaseai/gh-please/issues/55)


### Documentation

* fix component resolution errors and restructure documentation ([#56](https://github.com/pleaseai/gh-please/issues/56)) ([b3ce1f9](https://github.com/pleaseai/gh-please/commit/b3ce1f9bb1db6a50543d1dda9384a9a82cab2a6c))
* fix documentation links to include language prefix ([#58](https://github.com/pleaseai/gh-please/issues/58)) ([d42ae13](https://github.com/pleaseai/gh-please/commit/d42ae137e307762ed33257fc881ed880525c5b62))

## [0.8.0](https://github.com/pleaseai/gh-please/compare/github-v0.7.0...github-v0.8.0) (2025-10-21)


### Features

* add comment list commands for issues and PRs ([#52](https://github.com/pleaseai/gh-please/issues/52)) ([d4832c9](https://github.com/pleaseai/gh-please/commit/d4832c9b5023b2d991f5838e6086fc7414af9145))
* change clone and worktree locations to ~/.please/ subdirectories ([#54](https://github.com/pleaseai/gh-please/issues/54)) ([e3a686c](https://github.com/pleaseai/gh-please/commit/e3a686c1bd29e0c49b9479f5aa9755ea5f800e8d)), closes [#49](https://github.com/pleaseai/gh-please/issues/49)


### Documentation

* add ADR for LLM-friendly output formats ([854ab94](https://github.com/pleaseai/gh-please/commit/854ab94b201e897eab1ea12197bb5c8c905c74c0))

## [0.7.0](https://github.com/pleaseai/gh-please/compare/github-v0.6.1...github-v0.7.0) (2025-10-21)


### Features

* implement comment edit commands ([#44](https://github.com/pleaseai/gh-please/issues/44)) ([54145b2](https://github.com/pleaseai/gh-please/commit/54145b2cec2dba0509c7373e04617e93fe28d02c))


### Documentation

* add ADR for PR review command structure refactoring ([3a637bc](https://github.com/pleaseai/gh-please/commit/3a637bc67f61f1dff69174f501e97043b1587e63)), closes [#46](https://github.com/pleaseai/gh-please/issues/46)

## [0.6.1](https://github.com/pleaseai/gh-please/compare/github-v0.6.0...github-v0.6.1) (2025-10-19)


### Bug Fixes

* use GraphQL API for linked branches query instead of text parsing ([a55f07a](https://github.com/pleaseai/gh-please/commit/a55f07af70c04f0f758cf78827cee16caaf8861a))


### Documentation

* emphasize bun run lint:fix requirement in development workflow ([b626c98](https://github.com/pleaseai/gh-please/commit/b626c986f5d06f95ee45631d1d9240caae83b22e))

## [0.6.0](https://github.com/pleaseai/gh-please/compare/github-v0.5.0...github-v0.6.0) (2025-10-19)


### Features

* load version from package.json dynamically in CLI ([226ad84](https://github.com/pleaseai/gh-please/commit/226ad841c15003ab4e70d2be3c4432bcc3c3fae0))


### Bug Fixes

* improve branch selection UX and prevent duplicate worktree creation ([1a24ad9](https://github.com/pleaseai/gh-please/commit/1a24ad90ac8cbd35a899e892b110a6ae1283ed9b))

## [0.5.0](https://github.com/pleaseai/gh-please/compare/github-v0.4.2...github-v0.5.0) (2025-10-19)


### Features

* add branch selection prompt for issue develop command ([0822132](https://github.com/pleaseai/gh-please/commit/08221321a8a5c69d745581ff8e87ab70e40fef8c))


### Bug Fixes

* resolve TypeScript type errors in develop command ([653136a](https://github.com/pleaseai/gh-please/commit/653136ad34265ece950bf53d8cd333a7565d4a6e))
* simplify regex pattern to pass eslint lint rule ([5fdff06](https://github.com/pleaseai/gh-please/commit/5fdff06cf8c78750026fc89729c24dd2c2e55533))

## [0.4.2](https://github.com/pleaseai/gh-please/compare/github-v0.4.1...github-v0.4.2) (2025-10-19)


### Bug Fixes

* support --repo flag in issue develop command ([1c7267b](https://github.com/pleaseai/gh-please/commit/1c7267b023c624db26217d9bb83e0454981db789))

## [0.4.1](https://github.com/pleaseai/gh-please/compare/github-v0.4.0...github-v0.4.1) (2025-10-19)


### Bug Fixes

* use git command instead of gh in isInGitRepo function ([ea3f4ec](https://github.com/pleaseai/gh-please/commit/ea3f4eca978fbac671898468a2f8c242e82e06ca))

## [0.4.0](https://github.com/pleaseai/gh-please/compare/github-v0.3.0...github-v0.4.0) (2025-10-19)


### Features

* add AI plugin as git submodule ([#21](https://github.com/pleaseai/gh-please/issues/21)) ([55ffe08](https://github.com/pleaseai/gh-please/commit/55ffe085ff1948e24af13f3b13a8edc828426f83)), closes [#16](https://github.com/pleaseai/gh-please/issues/16)
* Add Claude Code plugin for gh-please extension ([a2d365e](https://github.com/pleaseai/gh-please/commit/a2d365e8b20cf1e1ee5d4f467141955e5ebcd420)), closes [#12](https://github.com/pleaseai/gh-please/issues/12)
* Build Plugin System Infrastructure ([#20](https://github.com/pleaseai/gh-please/issues/20)) ([2098893](https://github.com/pleaseai/gh-please/commit/2098893a74143454ca2b1e97c85b12d05179e8b4))
* implement gh CLI authentication utilities ([bbcb1dd](https://github.com/pleaseai/gh-please/commit/bbcb1ddcc287d880a8cbb99e9233fe0e80b0d4a2)), closes [#25](https://github.com/pleaseai/gh-please/issues/25)
* implement gh CLI authentication utilities (Issue [#25](https://github.com/pleaseai/gh-please/issues/25)) ([d4202c0](https://github.com/pleaseai/gh-please/commit/d4202c03a7f6b452e0bbbbcf66e37354bacbfd74))
* implement issue develop workflow with worktree support ([#37](https://github.com/pleaseai/gh-please/issues/37)) ([a670873](https://github.com/pleaseai/gh-please/commit/a6708733e14f05f1a67f15701e11b8df6a890683))
* implement premium plugin installer ([7f0fcc0](https://github.com/pleaseai/gh-please/commit/7f0fcc02fd17184af2cba06731d684eb7ed19ffc))
* implement tarball extraction utilities ([#32](https://github.com/pleaseai/gh-please/issues/32)) ([c3680ba](https://github.com/pleaseai/gh-please/commit/c3680ba2c4292ee849e410077374cf73d156be33))
* improve plugin install command UX ([#28](https://github.com/pleaseai/gh-please/issues/28)) ([#34](https://github.com/pleaseai/gh-please/issues/34)) ([3b32486](https://github.com/pleaseai/gh-please/commit/3b324868f918609f7126ed96dd1d8bc44ad3b0d7))


### Bug Fixes

* correct GitHub CLI fields for PR info parsing ([8d9df5f](https://github.com/pleaseai/gh-please/commit/8d9df5f032c1ae98f5bed2f486072d4b8ab6e522))
* resolve lint errors from eslint auto-fix ([151a663](https://github.com/pleaseai/gh-please/commit/151a663cbcc52bc4fd397eeb33084b19c37863a0))
* simplify gh-cli tests to avoid timeout issues ([d29fa39](https://github.com/pleaseai/gh-please/commit/d29fa39030da38d32db674216e440ddbf69f3ef3))


### Documentation

* Update Documentation for Plugin System ([#23](https://github.com/pleaseai/gh-please/issues/23)) ([cb996a9](https://github.com/pleaseai/gh-please/commit/cb996a9d28416440c8ad08d47510fd7ed7c2cdf8))

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
