#!/usr/bin/env bash
#
# Auth-free installer for the gh-please GitHub CLI extension.
#
# Why this exists:
#   `gh extension install pleaseai/gh-please` works without authentication for
#   a single machine, but in CI/Docker the *unauthenticated* GitHub API rate
#   limit (60 req/hour per IP) is quickly exhausted on shared runner IPs. gh
#   then surfaces the resulting HTTP 403 as an authentication-looking error.
#
#   This script bypasses api.github.com entirely. It resolves the release tag
#   via the public `releases/latest` web redirect and downloads the precompiled
#   binary from GitHub's release-download CDN. Neither endpoint is rate-limited
#   like the API nor requires a token, so it works at Docker build time with no
#   credentials baked into the image.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/pleaseai/gh-please/main/scripts/install.sh | bash
#   curl -fsSL .../install.sh | bash -s -- --version github-v0.32.0   # pin a version
#
# Environment overrides:
#   GH_PLEASE_VERSION   Pin a release tag (same as --version).

set -euo pipefail

# --- Constants ---------------------------------------------------------------
readonly OWNER="pleaseai"
readonly REPO="gh-please"
readonly EXT_NAME="gh-please"   # gh extension name -> `gh please`
readonly BIN_NAME="gh-please"   # executable + release asset prefix
readonly HOST="github.com"
readonly RELEASES_URL="https://github.com/${OWNER}/${REPO}/releases"

# --- Output helpers ----------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Working directory for downloads; cleaned up by the EXIT trap. Declared at
# file scope so the trap can reference it after main()'s locals go out of scope.
WORKDIR=""

info() { printf '%b\n' "${YELLOW}==>${NC} $*"; }
ok() { printf '%b\n' "${GREEN}✓${NC} $*"; }
err() { printf '%b\n' "${RED}✗${NC} $*" >&2; }

die() {
  err "$*"
  exit 1
}

# --- Platform detection ------------------------------------------------------
# Maps `uname` output to the `{os}-{arch}` suffix used in release asset names.
detect_platform() {
  local os arch
  case "$(uname -s)" in
    Linux) os="linux" ;;
    Darwin) os="darwin" ;;
    *) die "Unsupported OS: $(uname -s). For Windows use 'gh extension install ${OWNER}/${REPO}'." ;;
  esac

  case "$(uname -m)" in
    x86_64 | amd64) arch="amd64" ;;
    arm64 | aarch64) arch="arm64" ;;
    *) die "Unsupported architecture: $(uname -m)." ;;
  esac

  printf '%s-%s' "$os" "$arch"
}

# --- Tag resolution ----------------------------------------------------------
# Resolves the latest tag from the `releases/latest` redirect (no API call).
resolve_latest_tag() {
  local redirect
  redirect="$(curl -fsS -o /dev/null -w '%{redirect_url}' "${RELEASES_URL}/latest" || true)"
  [ -n "$redirect" ] || die "Could not resolve the latest release tag from ${RELEASES_URL}/latest"
  printf '%s' "${redirect##*/tag/}"
}

# --- Checksum verification ---------------------------------------------------
sha256_of() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$1" | awk '{print $1}'
  else
    die "Neither sha256sum nor shasum is available for checksum verification."
  fi
}

verify_checksum() {
  local binary="$1" checksums="$2" asset="$3"
  local expected actual
  expected="$(awk -v f="$asset" '$2 == f {print $1}' "$checksums")"
  if [ -z "$expected" ]; then
    info "No checksum entry for ${asset}; skipping verification."
    return 0
  fi
  actual="$(sha256_of "$binary")"
  [ "$expected" = "$actual" ] || die "Checksum mismatch for ${asset} (expected ${expected}, got ${actual})."
  ok "Checksum verified."
}

# --- gh data directory -------------------------------------------------------
# Resolves the directory gh uses to store extensions (XDG data, not config).
gh_extensions_dir() {
  printf '%s/gh/extensions' "${XDG_DATA_HOME:-$HOME/.local/share}"
}

write_manifest() {
  local dir="$1" tag="$2" pinned="$3"
  cat >"${dir}/manifest.yml" <<EOF
owner: ${OWNER}
name: ${EXT_NAME}
host: ${HOST}
tag: ${tag}
ispinned: ${pinned}
path: ${dir}/${BIN_NAME}
EOF
}

# --- Main --------------------------------------------------------------------
main() {
  local version="${GH_PLEASE_VERSION:-}"
  local pinned="false"

  while [ $# -gt 0 ]; do
    case "$1" in
      --version)
        version="${2:-}"
        shift 2 || die "--version requires a tag argument."
        ;;
      -h | --help)
        printf 'Usage: install.sh [--version <tag>]\n'
        exit 0
        ;;
      *) die "Unknown argument: $1" ;;
    esac
  done

  command -v curl >/dev/null 2>&1 || die "curl is required but not installed."

  local platform tag asset base binary checksums
  platform="$(detect_platform)"

  if [ -n "$version" ]; then
    tag="$version"
    pinned="true"
  else
    info "Resolving latest release..."
    tag="$(resolve_latest_tag)"
  fi

  asset="${BIN_NAME}_${tag}_${platform}"
  base="${RELEASES_URL}/download/${tag}"
  info "Installing ${EXT_NAME} ${tag} (${platform})..."

  WORKDIR="$(mktemp -d)"
  trap 'rm -rf "${WORKDIR:-}"' EXIT

  binary="${WORKDIR}/${BIN_NAME}"
  checksums="${WORKDIR}/checksums.txt"

  curl -fsSL -o "$binary" "${base}/${asset}" \
    || die "Failed to download ${base}/${asset} (does the release have a ${platform} binary?)."
  curl -fsSL -o "$checksums" "${base}/checksums.txt" \
    || die "Failed to download checksums from ${base}/checksums.txt"

  verify_checksum "$binary" "$checksums" "$asset"

  local dir
  dir="$(gh_extensions_dir)/${EXT_NAME}"
  rm -rf "$dir"
  mkdir -p "$dir"
  install -m 0755 "$binary" "${dir}/${BIN_NAME}"
  write_manifest "$dir" "$tag" "$pinned"

  ok "Installed to ${dir}/${BIN_NAME}"
  info "Run: gh please --version"
}

main "$@"
