#!/usr/bin/env bun

/**
 * Update GitHub CLI Field Definitions
 *
 * This script extracts available JSON fields from GitHub CLI commands
 * and generates a TypeScript file with field mappings for use in
 * TOON/JSON format conversion.
 *
 * The script now includes runtime validation to detect and filter
 * deprecated GraphQL fields that cause failures.
 *
 * Usage:
 *   bun run scripts/update-gh-fields.ts
 *   npm run update-fields
 *
 * Output:
 *   src/lib/gh-fields.generated.ts
 */

import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

interface CommandConfig {
  command: string
  subcommand: string
  testId: string
  description: string
}

interface DeprecatedFieldInfo {
  field: string
  reason: string
}

// Commands to extract fields from
const COMMANDS: CommandConfig[] = [
  {
    command: 'issue',
    subcommand: 'view',
    testId: '1', // Generic test ID
    description: 'Issue view command',
  },
  {
    command: 'issue',
    subcommand: 'list',
    testId: '--limit 1', // List commands need --limit flag, not an ID
    description: 'Issue list command',
  },
  {
    command: 'pr',
    subcommand: 'view',
    testId: '1', // Generic test ID
    description: 'Pull request view command',
  },
  {
    command: 'pr',
    subcommand: 'list',
    testId: '--limit 1', // List commands need --limit flag, not an ID
    description: 'Pull request list command',
  },
  {
    command: 'repo',
    subcommand: 'view',
    testId: 'pleaseai/gh-please', // Valid repo format
    description: 'Repository view command',
  },
  {
    command: 'repo',
    subcommand: 'list',
    testId: '--limit 1', // List commands need --limit flag
    description: 'Repository list command',
  },
  {
    command: 'release',
    subcommand: 'view',
    testId: 'latest', // Use 'latest' tag
    description: 'Release view command',
  },
  // Phase 2.2 commands
  {
    command: 'label',
    subcommand: 'list',
    testId: '--limit 1', // List commands need --limit flag
    description: 'Label list command (Phase 2.2)',
  },
  {
    command: 'secret',
    subcommand: 'list',
    testId: '', // No args needed for secret list
    description: 'Secret list command (Phase 2.2)',
  },
  {
    command: 'variable',
    subcommand: 'list',
    testId: '', // No args needed for variable list
    description: 'Variable list command (Phase 2.2)',
  },
  {
    command: 'search',
    subcommand: 'repos',
    testId: 'test --limit 1', // Search requires a query
    description: 'Search repos command (Phase 2.2)',
  },
  {
    command: 'search',
    subcommand: 'issues',
    testId: 'test --limit 1', // Search requires a query
    description: 'Search issues command (Phase 2.2)',
  },
  {
    command: 'search',
    subcommand: 'prs',
    testId: 'test --limit 1', // Search requires a query
    description: 'Search PRs command (Phase 2.2)',
  },
]

/**
 * Execute a gh CLI command and capture output
 */
function executeGhCommand(args: string[]): { stdout: string, stderr: string, exitCode: number } {
  try {
    const stdout = execSync(`gh ${args.join(' ')}`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    return { stdout, stderr: '', exitCode: 0 }
  }
  catch (error: any) {
    return {
      stdout: error.stdout?.toString() || '',
      stderr: error.stderr?.toString() || '',
      exitCode: error.status || 1,
    }
  }
}

/**
 * Check if a field list causes GraphQL deprecation errors or failures
 */
function hasDeprecationError(stderr: string): boolean {
  const lowerStderr = stderr.toLowerCase()
  const deprecationIndicators = [
    'deprecated',
    'being deprecated',
    'projects (classic)',
    'sunset',
    'no longer supported',
  ]

  return deprecationIndicators.some(indicator =>
    lowerStderr.includes(indicator),
  )
}

/**
 * Validate fields by executing actual gh command
 * Returns true if fields are valid, false if they cause errors
 */
function validateFields(
  command: string,
  subcommand: string,
  fields: string[],
  testId: string,
): boolean {
  const result = executeGhCommand([
    command,
    subcommand,
    testId,
    '--json',
    fields.join(','),
  ])

  // Check for both exit code and deprecation warnings
  if (result.exitCode !== 0) {
    return false
  }

  if (hasDeprecationError(result.stderr)) {
    return false
  }

  return true
}

/**
 * Binary search to identify valid fields
 * Recursively splits the field list to find problematic fields
 */
function binarySearchValidFields(
  command: string,
  subcommand: string,
  fields: string[],
  testId: string,
  depth = 0,
): string[] {
  // Base cases
  if (fields.length === 0) {
    return []
  }
  if (fields.length === 1) {
    return validateFields(command, subcommand, fields, testId) ? fields : []
  }

  // Test all fields first
  if (validateFields(command, subcommand, fields, testId)) {
    return fields
  }

  // Split and test each half
  const mid = Math.floor(fields.length / 2)
  const leftFields = fields.slice(0, mid)
  const rightFields = fields.slice(mid)

  const indent = '  '.repeat(depth + 1)
  console.log(`${indent}🔍 Testing ${leftFields.length} + ${rightFields.length} fields...`)

  const validLeft = binarySearchValidFields(command, subcommand, leftFields, testId, depth + 1)
  const validRight = binarySearchValidFields(command, subcommand, rightFields, testId, depth + 1)

  return [...validLeft, ...validRight]
}

/**
 * Extract available fields from gh CLI error message and validate them
 */
function extractAndValidateFields(
  command: string,
  subcommand: string,
  testId: string,
): { validFields: string[], deprecatedFields: DeprecatedFieldInfo[] } {
  console.log(`📡 Extracting fields for: gh ${command} ${subcommand}`)

  // Step 1: Extract all available fields from error message
  const result = executeGhCommand([command, subcommand, testId, '--json', 'invalidfield'])

  if (!result.stderr.includes('Available fields:')) {
    throw new Error(`Failed to extract fields for ${command} ${subcommand}\nStderr: ${result.stderr}`)
  }

  const allFields = result.stderr
    .split('Available fields:')[1]
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.includes(':') && !line.includes('Unknown'))

  console.log(`   ✅ Found ${allFields.length} fields`)

  // Step 2: Validate fields
  console.log(`   🔍 Validating fields...`)

  const validFields = binarySearchValidFields(command, subcommand, allFields, testId)

  // Step 3: Identify deprecated fields
  const deprecatedFields: DeprecatedFieldInfo[] = []
  const validFieldsSet = new Set(validFields)
  const invalidFields = allFields.filter(f => !validFieldsSet.has(f))

  for (const field of invalidFields) {
    // Test individual field to get specific error
    const fieldResult = executeGhCommand([
      command,
      subcommand,
      testId,
      '--json',
      field,
    ])

    let reason = 'Unknown error'
    if (hasDeprecationError(fieldResult.stderr)) {
      // Extract deprecation message
      const lines = fieldResult.stderr.split('\n')
      const deprecationLine = lines.find(line =>
        [
          'deprecated',
          'being deprecated',
          'Projects (classic)',
          'sunset',
          'no longer supported',
        ].some(indicator => line.toLowerCase().includes(indicator.toLowerCase())),
      )
      reason = deprecationLine?.trim() || 'Deprecated'
    }
    else if (fieldResult.exitCode !== 0) {
      // Try to extract meaningful error from stderr
      const errorLines = fieldResult.stderr.split('\n').filter(line => line.trim())
      reason = errorLines[0]?.trim() || 'GraphQL error'
    }

    deprecatedFields.push({ field, reason })
  }

  // Step 4: Report results
  if (deprecatedFields.length > 0) {
    console.log(`   ⚠️  Filtered ${deprecatedFields.length} deprecated/invalid fields:`)
    for (const { field, reason } of deprecatedFields) {
      console.log(`      - ${field}: ${reason}`)
    }
  }

  console.log(`   ✅ Valid fields: ${validFields.length}`)

  return { validFields, deprecatedFields }
}

/**
 * Get current gh CLI version
 */
function getGhVersion(): string {
  try {
    const result = execSync('gh version', { encoding: 'utf-8' })
    const match = result.match(/gh version ([\d.]+)/)
    return match ? match[1] : 'unknown'
  }
  catch {
    return 'unknown'
  }
}

/**
 * Generate TypeScript file with field mappings
 */
function generateFieldsFile(
  fieldMappings: Record<string, string>,
  deprecationLog: Record<string, DeprecatedFieldInfo[]>,
): void {
  const ghVersion = getGhVersion()
  const timestamp = new Date().toISOString().split('T')[0]

  // Generate deprecation comment section
  let deprecationComment = ''
  const hasDeprecations = Object.values(deprecationLog).some(list => list.length > 0)

  if (hasDeprecations) {
    deprecationComment = '\n * Deprecated/invalid fields filtered during generation:\n'
    for (const [commandKey, fields] of Object.entries(deprecationLog)) {
      if (fields.length > 0) {
        deprecationComment += ` *   ${commandKey}:\n`
        for (const { field, reason } of fields) {
          deprecationComment += ` *     - ${field}: ${reason}\n`
        }
      }
    }
  }

  const content = `// Auto-generated by scripts/update-gh-fields.ts
// DO NOT EDIT MANUALLY - Run: bun run update-fields
//
// Last updated: ${timestamp}
// gh CLI version: ${ghVersion}

/**
 * GitHub CLI JSON field mappings for view and list commands.
 *
 * These field definitions are used to inject --json <fields> when users
 * request TOON or JSON format conversion.
 *
 * Both view commands (issue view, pr view) and list commands (issue list, pr list)
 * require explicit field specification when using --json flag.${deprecationComment} */
export const GH_JSON_FIELDS: Record<string, string> = {
${Object.entries(fieldMappings)
  .map(([key, value]) => `  '${key}': '${value}',`)
  .join('\n')}
}
`

  const outputPath = join(process.cwd(), 'src', 'lib', 'gh-fields.generated.ts')
  writeFileSync(outputPath, content, 'utf-8')

  console.log(`\n✅ Generated: ${outputPath}`)
  console.log(`   gh CLI version: ${ghVersion}`)
  console.log(`   Commands: ${Object.keys(fieldMappings).length}`)
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  console.log('🚀 Updating GitHub CLI field definitions...\n')

  // Check gh CLI authentication
  const authCheck = executeGhCommand(['auth', 'status'])
  if (authCheck.exitCode !== 0) {
    console.error('❌ GitHub CLI is not authenticated. Run: gh auth login')
    process.exit(1)
  }

  const fieldMappings: Record<string, string> = {}
  const deprecationLog: Record<string, DeprecatedFieldInfo[]> = {}

  // Extract and validate fields for each command
  for (const config of COMMANDS) {
    try {
      const { validFields, deprecatedFields } = extractAndValidateFields(
        config.command,
        config.subcommand,
        config.testId,
      )

      const commandKey = `${config.command} ${config.subcommand}`
      fieldMappings[commandKey] = validFields.join(',')
      deprecationLog[commandKey] = deprecatedFields
    }
    catch (error: any) {
      console.error(`❌ Error processing ${config.command} ${config.subcommand}:`)
      console.error(`   ${error.message}`)
      process.exit(1)
    }
  }

  // Generate TypeScript file
  try {
    generateFieldsFile(fieldMappings, deprecationLog)
    console.log('\n✨ Field definitions updated successfully!')
    console.log('\n💡 Next steps:')
    console.log('   1. Review changes: git diff src/lib/gh-fields.generated.ts')
    console.log('   2. Test integration: bun test test/lib/gh-passthrough.test.ts')
    console.log('   3. Commit if changes exist: git add src/lib/gh-fields.generated.ts')
  }
  catch (error: any) {
    console.error('❌ Error generating fields file:')
    console.error(`   ${error.message}`)
    process.exit(1)
  }
}

// Run main function
main().catch((error) => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})
