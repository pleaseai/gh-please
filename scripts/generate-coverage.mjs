#!/usr/bin/env bun
/**
 * Generate coverage report with LCOV format
 * Uses bunfig.toml configuration with absolute path for coverageDir
 * to avoid issues with process.chdir() in init tests
 */

import { $ } from 'bun'

console.log('🧪 Running tests with coverage...\n')

// Run Bun test with coverage (uses bunfig.toml config)
await $`bun test test/lib test/commands --coverage`.quiet()

console.log('\n✅ Coverage report generated successfully!')
console.log('📁 Reports saved to: ./coverage')
console.log('   - LCOV: ./coverage/lcov.info')
console.log('   - Ready for Codecov upload')
