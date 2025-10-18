#!/usr/bin/env bash
set -e

# Get version from tag (first argument) or default to v0.0.0-dev
VERSION="${1:-v0.0.0-dev}"

echo "🔨 Building gh-extension-please ${VERSION}..."

# Check if bun is available
if ! type -p bun >/dev/null; then
  echo "❌ Error: bun is not installed" >&2
  echo "   Install bun from https://bun.sh" >&2
  exit 1
fi

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Install dependencies
echo "📦 Installing dependencies..."
bun install

# Create dist directory
mkdir -p dist

# Platform mappings: bun target -> github naming
declare -A platforms=(
  ["linux-x64"]="linux-amd64"
  ["linux-arm64"]="linux-arm64"
  ["darwin-x64"]="darwin-amd64"
  ["darwin-arm64"]="darwin-arm64"
  ["windows-x64"]="windows-amd64"
)

for bun_target in "${!platforms[@]}"; do
  gh_platform="${platforms[$bun_target]}"
  echo "🏗️  Building for ${gh_platform}..."

  # Parse bun target
  os="${bun_target%-*}"
  arch="${bun_target#*-}"

  # Set output filename according to gh-extension-precompile requirements:
  # dist/gh-my-ext_{version}_{os}-{arch}{ext}
  if [ "$os" = "windows" ]; then
    output="dist/gh-please_${VERSION}_${gh_platform}.exe"
  else
    output="dist/gh-please_${VERSION}_${gh_platform}"
  fi

  # Build with bun compile
  bun build src/index.ts \
    --compile \
    --target="bun-${os}-${arch}" \
    --outfile="$output"

  echo "✅ Built $output"
done

echo "🎉 Build complete!"
echo "   Version: ${VERSION}"
echo "   Built for: ${!platforms[@]}"
