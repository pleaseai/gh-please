# ADR 0008: `auth login` with GitHub App Installation Token Support

**Status**: Proposed
**Date**: 2026-06-25
**Author**: Development Team

## Context

`gh please` passes `auth` commands through to the native `gh` CLI today, so
`gh please auth login` already behaves like `gh auth login` (browser flow,
`--with-token`, etc.). However, the native `gh auth login` only supports
**user** authentication (OAuth or a personal access token). It has **no support
for authenticating as a GitHub App installation**.

GitHub App installation tokens are the recommended credential for automation
(CI, bots, server-to-server) because they are:

1. **Scoped** to a single installation (one org/user account) and its granted
   permissions
2. **Short-lived** (~1 hour), reducing blast radius if leaked
3. **Auditable** as the App rather than a human user

The gap: there is no first-class CLI path to mint an installation token and feed
it into the `gh` credential store, and—because the token expires hourly—no
ergonomic way to keep it fresh.

Minting an installation token requires:

1. Signing a short-lived **RS256 JWT** with the App's private key (`iss` = App
   ID, `exp` ≤ 10 min)
2. Resolving the target **installation ID** (directly, by owner, or
   auto-selected when the App has a single installation)
3. Exchanging the JWT at `POST /app/installations/{id}/access_tokens`

## Decision

Register an explicit `auth` command group that **mirrors `gh auth login`** for
all standard flows and **adds a GitHub App installation-token mode**. Since the
tokens are short-lived, also provide **re-mint** primitives so callers can always
obtain a valid token without an OAuth-style refresh.

### Command surface

| Command | Behavior |
|---------|----------|
| `gh please auth login` (no App flags) | Mirror `gh auth login` exactly (stdio inherited for interactive flows) |
| `gh please auth login --app-id … --private-key …` | Mint an installation token; store via `gh auth login --with-token` (or `--print-token`); persist App config for re-mint |
| `gh please auth token` | Re-mint a fresh token from saved App config (else mirror `gh auth token`) |
| `gh please auth git-credential <op>` | git credential helper that mints a fresh token per `get` (transparent auto-refresh) |
| `gh please auth <other>` | Passthrough to `gh auth <other>` (status, logout, refresh, …) |

### Key design choices

1. **Mirror by raw forwarding, not re-parsing.** When no `--app-id` is present,
   the original `process.argv` tail is forwarded verbatim to `gh auth login`
   with inherited stdio. This guarantees 100% fidelity with the native command
   (including flags we never declared) and preserves interactive TTY prompts.

2. **No new runtime dependency for crypto.** The RS256 JWT is signed with Bun's
   built-in `node:crypto` (`createSign('RSA-SHA256')`). No `jsonwebtoken` or
   similar dependency is added.

3. **Token delivery is store-by-default, print-on-demand.** The default pipes the
   token to `gh auth login --with-token` so the whole `gh`/`gh please` toolchain
   uses it. `--print-token` emits the raw token to stdout for CI
   (`export GH_TOKEN=$(gh please auth login … --print-token)`).

4. **"Auto-refresh" = re-mint, not OAuth refresh.** Installation tokens cannot be
   refreshed; they must be regenerated from the App credentials. We persist the
   App config (App ID, resolved installation ID, hostname, and a **path
   reference** to the private key) to `~/.please/auth.json` and re-mint on demand:
   - `gh please auth token` for explicit/CI re-mint
   - `gh please auth git-credential` as a git credential helper, giving
     transparent per-operation refresh for `git push`/`fetch` without a daemon.

5. **Secrets are never persisted.** `auth.json` stores only a `privateKeyPath`
   reference (or relies on the `GH_APP_PRIVATE_KEY` env var); the PEM contents are
   never written to disk by gh-please. The file is created with `0600`
   permissions. When the key was supplied via stdin (`--private-key -`), no
   config is persisted because there is nothing safe to reference for re-mint.

6. **Installation resolution is layered.** Explicit `--installation-id` wins;
   otherwise `--owner` looks up `/orgs/{owner}/installation` then
   `/users/{owner}/installation`; otherwise the single installation is
   auto-selected, and ambiguity is reported with the candidate list.

### Private key sources (precedence)

1. `--private-key -` → read PEM from stdin
2. `--private-key <path>` → read PEM from file
3. `GH_APP_PRIVATE_KEY` env var → PEM contents

## Alternatives Considered

- **Pure passthrough only (do nothing).** Rejected: `gh` cannot mint App tokens,
  which is the entire point of the request.
- **Store credentials and run a background refresh daemon.** Rejected for v1: a
  long-running process is fragile for a CLI; the git credential helper provides
  transparent refresh without one. Can be added later behind a `--watch` flag.
- **Add a JWT library dependency.** Rejected: `node:crypto` covers RS256 signing
  with zero new dependencies and a smaller bundle.
- **Use `gh api` for the JWT-authenticated calls.** Rejected: `gh api` injects the
  stored user token, not our App JWT. We call the REST API directly via `fetch`
  with the JWT as a Bearer token.

## Consequences

**Positive**
- First-class GitHub App auth that integrates with the existing `gh` credential
  store and the whole `gh please` toolchain.
- True transparent auto-refresh for git operations with no daemon.
- No new dependencies; works on GitHub.com and GitHub Enterprise Server.

**Negative / Trade-offs**
- `gh please auth token` is context-dependent (App re-mint vs. native mirror),
  which is slightly less predictable than a single behavior.
- Re-mint requires the private key to remain available at the recorded path or
  env var; stdin-supplied keys are one-shot and not auto-refreshable.

## Implementation

- `src/lib/github-app.ts` — JWT signing, installation resolution, token exchange,
  private key resolution
- `src/lib/auth-config.ts` — `~/.please/auth.json` read/write (`0600`, no secrets)
- `src/lib/app-auth.ts` — re-mint orchestration from saved config
- `src/commands/auth/{index,login,token,git-credential}.ts` — command surface
- Tests: `test/lib/github-app.test.ts`, `test/lib/auth-config.test.ts`,
  `test/commands/auth/*`

## Related

- ADR 0007 — gh CLI Passthrough (auth subcommands fall through to `gh`)
- `docs-dev/AUTH_WORKFLOW.md` — usage workflow
- [GitHub docs: Authenticating as a GitHub App installation](https://docs.github.com/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app-installation)
