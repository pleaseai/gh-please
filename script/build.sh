#!/usr/bin/env bash
set -e

echo "🔨 Building gh-extension-please..."

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

# Build for multiple platforms
platforms=("linux-x64" "linux-arm64" "darwin-x64" "darwin-arm64" "windows-x64")

for platform in "${platforms[@]}"; do
  echo "🏗️  Building for $platform..."

  # Parse platform
  os="${platform%-*}"
  arch="${platform#*-}"

  # Set output filename
  if [ "$os" = "windows" ]; then
    output="dist/${platform}/gh-please.exe"
  else
    output="dist/${platform}/gh-please"
  fi

  # Create platform directory
  mkdir -p "dist/${platform}"

  # Build with bun
  bun build src/index.ts \
    --compile \
    --target="bun-${os}-${arch}" \
    --outfile="$output"

  echo "✅ Built $output"
done

echo "🎉 Build complete!"
echo "   Built for: ${platforms[*]}"
