# Release Process

This document explains how to create a release for the `gh-please` extension.

## Prerequisites

- Push access to the repository
- GitHub CLI (`gh`) installed and authenticated
- All tests passing (`bun test`)

## Build System

The extension uses `bun compile` to create standalone executables for multiple platforms:

- **Linux**: amd64, arm64
- **macOS**: amd64 (Intel), arm64 (Apple Silicon)
- **Windows**: amd64

### Build Script

The build script (`script/build.sh`) receives the release tag as an argument and creates executables with the naming convention required by `gh-extension-precompile`:

```
dist/gh-please_{version}_{os}-{arch}{ext}
```

**Example output:**
```
dist/gh-please_v0.2.0_linux-amd64
dist/gh-please_v0.2.0_linux-arm64
dist/gh-please_v0.2.0_darwin-amd64
dist/gh-please_v0.2.0_darwin-arm64
dist/gh-please_v0.2.0_windows-amd64.exe
```

### Testing Build Locally

```bash
# Test the build script
./script/build.sh v0.2.0-test

# Verify outputs
ls -lh dist/

# Test an executable
./dist/gh-please_v0.2.0-test_linux-amd64 --version

# Clean up
rm -f dist/gh-please_v0.2.0-test_*
```

## Release Steps

### 1. Prepare Release

Ensure all changes are committed and pushed:

```bash
# Run tests
bun test

# Type check
bun run type-check

# Lint
bun run lint
```

### 2. Create Release Tag

Create and push a version tag:

```bash
# Create tag (follow semantic versioning)
git tag v0.2.0

# Push tag to trigger release workflow
git push origin v0.2.0
```

### 3. Automated Release

When a tag is pushed:

1. GitHub Actions workflow `.github/workflows/release.yml` triggers
2. Bun is installed via `oven-sh/setup-bun@v2`
3. Build script `script/build.sh` is executed with the tag name
4. Executables are compiled for all platforms
5. `gh-extension-precompile` creates a GitHub release with:
   - Release notes
   - Platform-specific executables as assets
   - Checksums

### 4. Verify Release

After the workflow completes:

```bash
# View releases
gh release list

# View specific release
gh release view v0.2.0

# Test installation
gh extension install pleaseai/github
```

## Version Management

The version is managed in two places:

1. **package.json** - `"version": "0.2.0"`
2. **Git tags** - `v0.2.0`

Update `package.json` before creating a release tag.

## Rollback

If a release has issues:

```bash
# Delete remote tag
git push --delete origin v0.2.0

# Delete local tag
git tag -d v0.2.0

# Delete GitHub release
gh release delete v0.2.0
```

## Troubleshooting

### Build Fails

Check the GitHub Actions logs:

```bash
gh run list --workflow=release.yml
gh run view <run-id>
```

### Missing Executables

Ensure `script/build.sh`:
- Has execute permissions (`chmod +x script/build.sh`)
- Outputs files in `dist/` directory
- Uses correct naming convention

### Installation Issues

Users can manually download and install:

```bash
# Download release
gh release download v0.2.0 -p "gh-please_v0.2.0_linux-amd64"

# Make executable
chmod +x gh-please_v0.2.0_linux-amd64

# Install manually
gh extension install .
```

## Platform Support

| Platform | Architecture | Bun Target | Output Name |
|----------|-------------|------------|-------------|
| Linux | amd64 | bun-linux-x64 | `gh-please_{version}_linux-amd64` |
| Linux | arm64 | bun-linux-arm64 | `gh-please_{version}_linux-arm64` |
| macOS | amd64 (Intel) | bun-darwin-x64 | `gh-please_{version}_darwin-amd64` |
| macOS | arm64 (Apple Silicon) | bun-darwin-arm64 | `gh-please_{version}_darwin-arm64` |
| Windows | amd64 | bun-windows-x64 | `gh-please_{version}_windows-amd64.exe` |

## References

- [GitHub CLI Extensions Documentation](https://docs.github.com/en/github-cli/github-cli/creating-github-cli-extensions)
- [gh-extension-precompile Action](https://github.com/cli/gh-extension-precompile)
- [Bun Compilation](https://bun.sh/docs/bundler/executables)
