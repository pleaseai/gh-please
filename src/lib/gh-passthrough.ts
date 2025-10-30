import type { OutputFormat } from '@pleaseai/cli-toolkit/output'
import type { Language } from '../types'
import { outputData } from '@pleaseai/cli-toolkit/output'
import { GH_JSON_FIELDS } from './gh-fields.generated'
import { detectSystemLanguage, getPassthroughMessages } from './i18n'

/**
 * Result from executing a gh CLI command
 */
export interface PassthroughResult {
  stdout: string
  stderr: string
  exitCode: number
}

/**
 * Format detection result
 */
export interface FormatDetection {
  format: OutputFormat | null
  cleanArgs: string[]
}

/**
 * Execute gh CLI command and return stdout, stderr, and exit code
 *
 * @param args - Arguments to pass to gh CLI
 * @returns Promise with stdout, stderr, and exit code
 *
 * @example
 * ```typescript
 * const result = await executeGhCommand(['issue', 'list'])
 * console.log(result.stdout)
 * ```
 */
export async function executeGhCommand(args: string[]): Promise<PassthroughResult> {
  try {
    const proc = Bun.spawn(['gh', ...args], {
      stdout: 'pipe',
      stderr: 'pipe',
    })

    const stdout = await new Response(proc.stdout).text()
    const stderr = await new Response(proc.stderr).text()
    const exitCode = await proc.exited

    return { stdout, stderr, exitCode }
  }
  catch (error) {
    // Handle spawn failures with helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('ENOENT') || error.message.includes('not found')) {
        throw new Error(
          'GitHub CLI (gh) not found. Please install it from https://cli.github.com/',
        )
      }
      if (error.message.includes('EACCES') || error.message.includes('permission denied')) {
        throw new Error(
          'Permission denied executing gh CLI. Please check file permissions.',
        )
      }
    }
    // Re-throw with context
    throw new Error(
      `Failed to execute gh command: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

/**
 * Detect if format conversion is needed and extract format flag
 *
 * Supports both --format toon and --format=toon syntax.
 *
 * @param args - Command arguments
 * @returns Format and cleaned arguments
 *
 * @example
 * ```typescript
 * shouldConvertToStructuredFormat(['issue', 'list', '--format', 'toon'])
 * // { format: 'toon', cleanArgs: ['issue', 'list'] }
 *
 * shouldConvertToStructuredFormat(['issue', 'list'])
 * // { format: null, cleanArgs: ['issue', 'list'] }
 * ```
 */
export function shouldConvertToStructuredFormat(args: string[]): FormatDetection {
  const cleanArgs: string[] = []
  let format: OutputFormat | null = null

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (!arg)
      continue

    // Handle --format=value syntax
    if (arg.startsWith('--format=')) {
      const value = arg.split('=')[1]
      if (value === 'toon' || value === 'json') {
        format = value
      }
      continue
    }

    // Handle --format value syntax
    if (arg === '--format') {
      const nextArg = args[i + 1]
      if (nextArg && (nextArg === 'toon' || nextArg === 'json')) {
        format = nextArg
        i++ // Skip next arg (the format value)
      }
      else if (nextArg) {
        // Skip invalid format value too
        i++
      }
      continue
    }

    cleanArgs.push(arg)
  }

  return { format, cleanArgs }
}

/**
 * Inject --json flag to gh command args for format conversion
 *
 * Uses generated field mappings when available for view commands.
 * Falls back to plain --json for unmapped commands (like list commands).
 *
 * Note: Creates a new array without mutating the original args.
 *
 * @param args - Command arguments
 * @returns Args with --json and optional fields injected at the end
 *
 * @example
 * ```typescript
 * // View command with field mapping
 * injectJsonFlag(['issue', 'view', '123'])
 * // Returns: ['issue', 'view', '123', '--json', 'assignees,author,body,...']
 *
 * // List command without field mapping (fallback)
 * injectJsonFlag(['issue', 'list'])
 * // Returns: ['issue', 'list', '--json']
 * ```
 */
export function injectJsonFlag(args: string[]): string[] {
  const commandKey = args.slice(0, 2).join(' ') // e.g., "issue view"
  const fields = GH_JSON_FIELDS[commandKey]

  if (fields) {
    // Use generated fields for mapped commands (view commands)
    return [...args, '--json', fields]
  }

  // Fallback for unmapped commands (list commands work without fields)
  return [...args, '--json']
}

/**
 * Main passthrough command orchestration
 *
 * Executes gh CLI command with optional format conversion.
 *
 * @param args - Command arguments (without 'gh' prefix)
 *
 * @example
 * ```typescript
 * // Execute without conversion
 * await passThroughCommand(['repo', 'view'])
 *
 * // Execute with TOON conversion
 * await passThroughCommand(['issue', 'list', '--format', 'toon'])
 * ```
 */
export async function passThroughCommand(args: string[]): Promise<void> {
  const lang: Language = detectSystemLanguage()
  const msg = getPassthroughMessages(lang)

  // 1. Detect format requirement
  const { format, cleanArgs } = shouldConvertToStructuredFormat(args)

  // 2. Inject --json if format conversion needed
  const ghArgs = format ? injectJsonFlag(cleanArgs) : cleanArgs

  // 3. Execute gh CLI
  const result = await executeGhCommand(ghArgs)

  // 4. Handle errors
  if (result.exitCode !== 0) {
    // Distinguish between different types of --json related errors
    if (format && result.stderr.includes('Specify one or more comma-separated fields')) {
      // Command needs fields but isn't mapped yet
      console.error(msg.fieldsRequired)
      console.error(`\nCommand attempted: gh ${cleanArgs.join(' ')} --json`)
      console.error('\nAvailable fields:')
      process.stderr.write(result.stderr)
      console.error('\nTo add field mapping:')
      console.error('  1. Run: bun run update-fields')
      console.error('  2. This will update src/lib/gh-fields.generated.ts')
    }
    else if (format && result.stderr.includes('--json')) {
      // Command doesn't support --json at all
      console.error(msg.jsonNotSupported)
      console.error(`\nCommand attempted: gh ${cleanArgs.join(' ')} --json`)
      console.error('\nTroubleshooting:')
      console.error(`  - Verify the command supports --json: gh ${cleanArgs[0]} --help`)
      console.error(`  - Try without format flag: gh ${cleanArgs.join(' ')}`)
    }
    else {
      // Pass through original error
      process.stderr.write(result.stderr)
    }
    process.exit(result.exitCode)
  }

  // 5. Convert format if requested
  if (format) {
    try {
      // Handle empty output gracefully (e.g., empty lists)
      if (result.stdout.trim() === '') {
        // If stdout is empty, there's nothing to format, so we can exit gracefully.
        return
      }
      const data = JSON.parse(result.stdout)
      outputData(data, format)
    }
    catch (error) {
      // JSON parse error - provide detailed context
      console.error(msg.jsonParseError)
      console.error(`Command: gh ${cleanArgs.join(' ')}`)
      if (error instanceof Error) {
        console.error(`Parse Error: ${error.message}`)
      }
      console.error('\nTroubleshooting:')
      console.error(`  - Verify the command supports --json flag: gh ${cleanArgs[0]} --help`)
      console.error(`  - Try without --format to see raw output: gh ${cleanArgs.join(' ')}`)
      console.error('  - Report this issue if the command should support JSON')
      if (result.stdout.length > 0) {
        console.error(`\nPartial output received (${result.stdout.length} bytes)`)
        console.error('First 200 chars:', result.stdout.slice(0, 200))
      }
      process.exit(1)
    }
  }
  else {
    // Preserve original output
    process.stdout.write(result.stdout)
  }
}
