# Authentication Workflow

`gh please auth` mirrors `gh auth` and adds **GitHub App installation token**
support, including re-mint and transparent git auto-refresh.

See `docs-dev/adr/0008-auth-github-app-installation-tokens.md` for the design
rationale.

## Mirroring `gh auth login`

With no App flags, `gh please auth login` behaves exactly like `gh auth login`
(interactive browser flow, `--with-token`, `--web`, etc.). All other `auth`
subcommands (`status`, `logout`, `refresh`) pass through to `gh`. (`--setup-git`
is a flag on `gh please auth login`, not a standalone subcommand.)

```bash
gh please auth login                 # interactive, same as gh auth login
gh please auth login --web
gh please auth login --with-token < mytoken.txt
gh please auth status
```

## GitHub App installation tokens

GitHub App installation tokens are scoped, short-lived (~1 hour) credentials
ideal for CI and automation. You need:

- **App ID** (or Client ID)
- **Private key** (`.pem`) generated for the App
- A target **installation** (the org/user where the App is installed)

### One-time login (store in gh)

```bash
# Explicit installation
gh please auth login --app-id 123456 \
  --private-key ./app.private-key.pem \
  --installation-id 789

# Auto-resolve installation from an org/user
gh please auth login --app-id 123456 \
  --private-key ./app.private-key.pem \
  --owner pleaseai

# Auto-select when the App has exactly one installation
gh please auth login --app-id 123456 \
  --private-key ./app.private-key.pem
```

This mints a token, stores it via `gh auth login --with-token`, and saves the
App config to `~/.please/auth.json` (so it can be re-minted later). The private
key value is **never** stored — only a path reference.

### Private key sources

| Source | How |
|--------|-----|
| File | `--private-key ./app.pem` |
| Stdin | `--private-key -` (e.g. `cat app.pem \| gh please auth login … --private-key -`) |
| Env var | set `GH_APP_PRIVATE_KEY` to the PEM contents, omit `--private-key` |

> Note: a key supplied via stdin is one-shot and cannot be auto-refreshed (no
> path to re-read), so config is not persisted in that case.

### Print the token (CI)

Use `--print-token` to emit the raw token to stdout instead of storing it:

```bash
export GH_TOKEN=$(gh please auth login --app-id 123456 \
  --private-key ./app.pem --installation-id 789 --print-token)
```

## Token auto-refresh (re-mint)

Installation tokens expire after ~1 hour and **cannot be OAuth-refreshed** — they
must be re-minted from the App credentials. After a one-time login, two paths
keep you fresh:

### 1. `gh please auth token` — re-mint on demand

```bash
# Always returns a valid token, freshly minted from saved App config
export GH_TOKEN=$(gh please auth token)
```

If no App config is saved, this mirrors native `gh auth token`.

### 2. git credential helper — transparent refresh for git

Configure once (or pass `--setup-git` during login):

```bash
git config --global credential.https://github.com.helper '!gh-please auth git-credential'
# or:
gh please auth login --app-id 123456 --private-key ./app.pem --owner pleaseai --setup-git
```

Now `git push` / `git fetch` mint a fresh installation token automatically on
every operation — no expiry to manage, no daemon.

## GitHub Enterprise Server

Pass `--hostname` to target a GHES instance (API base becomes
`https://<host>/api/v3`):

```bash
gh please auth login --app-id 123456 --private-key ./app.pem \
  --owner my-org --hostname github.example.com
```

## How it works

```text
--private-key ──▶ resolvePrivateKey ──▶ generateAppJwt (RS256, node:crypto)
                                              │
                          ┌───────────────────┴───────────────────┐
                          ▼                                        ▼
              resolveInstallationId                    createInstallationToken
        (--installation-id / --owner / auto)     POST /app/installations/{id}/access_tokens
                          │                                        │
                          └──────────────┬─────────────────────────┘
                                         ▼
                    store via gh --with-token   OR   --print-token (stdout)
                                         │
                          persist ~/.please/auth.json (0600, no secret)
                                         │
                          re-mint:  auth token  /  auth git-credential
```

## Security notes

- The App private key value is never written to disk by gh-please; only a path
  reference is stored in `~/.please/auth.json` (mode `0600`).
- Tokens are short-lived by design; prefer re-mint (`auth token` / git helper)
  over long-term storage.
- Treat printed tokens like passwords — they grant the App installation's
  permissions until expiry.
