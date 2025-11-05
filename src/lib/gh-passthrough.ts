import type { OutputFormat } from '@pleaseai/cli-toolkit/output'
import type { Language } from '../types'
import { outputData } from '@pleaseai/cli-toolkit/output'
import { GH_JSON_FIELDS } from './gh-fields.generated'
import { detectSystemLanguage, getPassthroughMessages } from './i18n'
import { executeQuery, QueryError } from './jmespath-query'

/**
 * Result from executing a gh CLI command
 */
export interface PassthroughResult {
  stdout: string
  stderr: string
  exitCode: number
}

/**
 * Extended format type for gh-passthrough (includes 'table' for legacy output)
 */
export type ExtendedFormat = OutputFormat | 'table'

/**
 * Set of mutation command verbs that don't support --json
 *
 * These commands modify GitHub resources rather than querying them,
 * so they return confirmation messages instead of structured data.
 */
const MUTATION_COMMANDS = new Set([
  'create',
  'edit',
  'delete',
  'close',
  'reopen',
  'merge',
  'comment',
  'lock',
  'unlock',
  'pin',
  'unpin',
  'transfer',
  'approve',
  'review',
  'dismiss',
  'add-assignee',
  'remove-assignee',
  'add-label',
  'remove-label',
  'add-project',
  'remove-project',
  'set', // Mutation verb: variable set, secret set (Phase 2.2)
  'stop', // Mutation verb: codespace stop (Phase 2.3)
  'rebuild', // Mutation verb: codespace rebuild (Phase 2.3)
  'enable', // Mutation verb: workflow enable (Phase 2.1)
  'disable', // Mutation verb: workflow disable (Phase 2.1)
  'run', // Mutation verb: workflow run (Phase 2.1)
  'cancel', // Mutation verb: run cancel (Phase 2.1)
  'rerun', // Mutation verb: run rerun (Phase 2.1)
  'watch', // Interactive verb: run watch (Phase 2.1)
])

/**
 * Check if command contains a mutation verb
 *
 * Mutation commands modify GitHub resources and don't support --json output.
 * Examples: create, edit, delete, close, merge, comment
 *
 * @param args - Command arguments
 * @returns true if command contains mutation verb
 *
 * @example
 * ```typescript
 * isMutationCommand(['issue', 'edit', '123'])  // true
 * isMutationCommand(['issue', 'list'])         // false
 * isMutationCommand(['pr', 'create'])          // true
 * isMutationCommand(['pr', 'view', '123'])     // false
 * isMutationCommand(['variable', 'set', 'KEY', 'value'])  // true (Phase 2.2)
 * isMutationCommand(['issue', 'list', '--author', 'create'])  // false (not a verb)
 * isMutationCommand(['workflow', 'run', 'test'])  // true (Phase 2.1)
 * isMutationCommand(['run', 'list'])  // false (Phase 2.1 - 'run' is the command, not a verb)
 * ```
 */
export function isMutationCommand(args: string[]): boolean {
  if (args.length === 0) {
    return false
  }

  // Special case: 'run' at index 0 is a command group (run list, run view),
  // not a mutation verb (workflow run). But 'run cancel', 'run rerun', 'run watch'
  // at index 1 ARE mutation verbs.
  if (args[0] === 'run') {
    // Check if there's a mutation verb at index 1
    if (args.length > 1 && args[1] && MUTATION_COMMANDS.has(args[1])) {
      return true
    }
    return false
  }

  // Check for command verbs (e.g., 'create', 'edit') at the start of the command.
  // Verbs are typically at index 0 or 1.
  if (args.slice(0, 2).some(arg => arg && MUTATION_COMMANDS.has(arg))) {
    return true
  }

  // Check for mutation flags (e.g., '--add-label').
  // We only check arguments that look like flags to avoid matching flag values.
  // The set stores them without '--', so we strip the prefix before checking.
  return args.some(arg => arg.startsWith('--') && MUTATION_COMMANDS.has(arg.substring(2)))
}

/**
 * Format detection result
 */
export interface FormatDetection {
  format: ExtendedFormat | null
  cleanArgs: string[]
  query?: string
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
 * Phase 1.1: Returns 'toon' by default, 'table' for legacy native output
 * Phase 1.5: Extracts --query flag for JMESPath filtering
 *
 * @param args - Command arguments
 * @returns Format, query, and cleaned arguments
 *
 * @example
 * ```typescript
 * shouldConvertToStructuredFormat(['issue', 'list', '--format', 'toon'])
 * // { format: 'toon', cleanArgs: ['issue', 'list'] }
 *
 * shouldConvertToStructuredFormat(['issue', 'list', '--format', 'table'])
 * // { format: 'table', cleanArgs: ['issue', 'list'] }
 *
 * shouldConvertToStructuredFormat(['issue', 'list'])
 * // { format: 'toon', cleanArgs: ['issue', 'list'] } (TOON is now default)
 *
 * shouldConvertToStructuredFormat(['issue', 'list', '--query', '[?state==`OPEN`]'])
 * // { format: 'toon', query: '[?state==`OPEN`]', cleanArgs: ['issue', 'list'] }
 * ```
 */
export function shouldConvertToStructuredFormat(args: string[]): FormatDetection {
  const cleanArgs: string[] = []
  let format: ExtendedFormat | null = null
  let explicitFormatProvided = false
  let query: string | undefined

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (!arg)
      continue

    // Handle --format=value syntax
    if (arg.startsWith('--format=')) {
      const value = arg.split('=')[1]
      if (value === 'toon' || value === 'json') {
        explicitFormatProvided = true
        format = value
      }
      else if (value === 'table') {
        explicitFormatProvided = true
        format = 'table'
      }
      // Invalid format value - don't mark as explicitly provided
      continue
    }

    // Handle --format value syntax
    if (arg === '--format') {
      const nextArg = args[i + 1]
      if (nextArg && (nextArg === 'toon' || nextArg === 'json')) {
        explicitFormatProvided = true
        format = nextArg
        i++ // Skip next arg (the format value)
      }
      else if (nextArg && nextArg === 'table') {
        explicitFormatProvided = true
        format = 'table'
        i++ // Skip next arg (the format value)
      }
      else if (nextArg) {
        // Invalid format value - don't mark as explicit, skip the value
        i++
      }
      // If no nextArg or invalid value, don't mark as explicitly provided
      continue
    }

    // Handle --query=value syntax (Phase 1.5)
    if (arg.startsWith('--query=')) {
      query = arg.substring('--query='.length)
      continue
    }

    // Handle --query value syntax (Phase 1.5)
    if (arg === '--query') {
      const nextArg = args[i + 1]
      if (nextArg && !nextArg.startsWith('-')) {
        query = nextArg
        i++ // Skip next arg (the query value)
      }
      else if (!nextArg || nextArg.startsWith('-')) {
        // Explicit error for missing query value
        const lang: Language = detectSystemLanguage()
        const msg = getPassthroughMessages(lang)
        console.error(`${msg.errorPrefix}: --query flag requires a value`)
        console.error('Usage: gh please <command> --query \'<jmespath-expression>\'')
        console.error('Example: gh please release list --query \'[?isDraft]\'')
        process.exit(1)
      }
      continue
    }

    cleanArgs.push(arg)
  }

  // Phase 1.1: Default to TOON format when no explicit format provided
  // Exception: Skip TOON default for mutation commands (they don't support --json)
  if (!explicitFormatProvided) {
    format = isMutationCommand(cleanArgs) ? null : 'toon'
  }

  return { format, cleanArgs, query }
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
 * Phase 1.1: TOON is now the default format
 *
 * @param args - Command arguments (without 'gh' prefix)
 *
 * @example
 * ```typescript
 * // Execute with default TOON format (Phase 1.1)
 * await passThroughCommand(['repo', 'view'])
 *
 * // Execute with explicit TOON conversion
 * await passThroughCommand(['issue', 'list', '--format', 'toon'])
 *
 * // Execute with legacy table format (deprecated)
 * await passThroughCommand(['issue', 'list', '--format', 'table'])
 * ```
 */
export async function passThroughCommand(args: string[]): Promise<void> {
  const lang: Language = detectSystemLanguage()
  const msg = getPassthroughMessages(lang)

  // 1. Detect format requirement (defaults to 'toon' in Phase 1.1) and query (Phase 1.5)
  const { format, cleanArgs, query } = shouldConvertToStructuredFormat(args)

  // 2. Handle table format (legacy native output with deprecation warning)
  if (format === 'table') {
    console.error(msg.deprecationWarning)
    console.error('') // Empty line for readability

    // Execute gh CLI without format conversion (preserve native output)
    const result = await executeGhCommand(cleanArgs)

    if (result.exitCode !== 0) {
      process.stderr.write(result.stderr)
      process.exit(result.exitCode)
    }

    process.stdout.write(result.stdout)
    return
  }

  // 3. Inject --json for format conversion (TOON or JSON)
  const ghArgs = format ? injectJsonFlag(cleanArgs) : cleanArgs

  // 4. Execute gh CLI
  const result = await executeGhCommand(ghArgs)

  // 5. Handle errors
  if (result.exitCode !== 0) {
    // Distinguish between different types of --json related errors
    if (format) {
      // Detect resource-not-found errors (don't show "Command attempted" prefix)
      const isResourceError = result.stderr.includes('Could not resolve')
        || result.stderr.includes('Not Found')
        || result.stderr.includes('does not exist')
        || result.stderr.includes('no pull requests')
        || result.stderr.includes('no issues')
        || result.stderr.includes('not found')

      if (isResourceError) {
        // Resource error - show gh CLI error directly without misleading prefix
        process.stderr.write(result.stderr)
        process.exit(result.exitCode)
        return // Early return in case process.exit is mocked
      }

      // Show command attempted only for format-specific errors
      console.error(`\nCommand attempted: gh ${cleanArgs.join(' ')} --json`)

      if (result.stderr.includes('Specify one or more comma-separated fields')) {
        // Command needs fields but isn't mapped yet
        console.error(msg.fieldsRequired)
        console.error('\nAvailable fields:')

        // Parse and display just the field list, not the preamble
        const fieldMatch = result.stderr.match(/Specify one or more comma-separated fields[^\n]*:\n([\s\S]+)/)
        if (fieldMatch && fieldMatch[1]) {
          console.error(fieldMatch[1].trim())
        }
        else {
          // Fallback to original stderr if parsing fails
          process.stderr.write(result.stderr)
        }

        console.error('\nTo add field mapping:')
        console.error('  1. Run: bun run update-fields')
        console.error('  2. This will update src/lib/gh-fields.generated.ts')
      }
      else if (result.stderr.includes('--json')) {
        // Command doesn't support --json at all
        console.error(msg.jsonNotSupported)
        console.error('\nTroubleshooting:')
        console.error(`  - Verify the command supports --json: gh ${cleanArgs[0]} --help`)
        console.error(`  - Try without format flag: gh ${cleanArgs.join(' ')}`)
      }
    }
    else {
      // Pass through original error
      process.stderr.write(result.stderr)
    }
    process.exit(result.exitCode)
  }

  // 6. Convert format if requested (TOON or JSON)
  if (format) {
    try {
      // Handle empty output gracefully (e.g., empty lists)
      if (result.stdout.trim() === '') {
        // Distinguish between legitimate empty results and potential failures
        // Log for debugging when --json returns empty output
        if (process.env.DEBUG) {
          console.error(`[DEBUG] gh CLI returned empty output for: gh ${cleanArgs.join(' ')} --json`)
          console.error(`[DEBUG] This may be a legitimate empty result (e.g., empty list)`)
        }
        // If stdout is empty, there's nothing to format, so we can exit gracefully.
        return
      }
      let data = JSON.parse(result.stdout)

      // Phase 1.5: Apply JMESPath query if provided
      if (query) {
        try {
          data = executeQuery(data, query)
        }
        catch (queryError) {
          // Query-specific error handling
          console.error(`${msg.errorPrefix}: Invalid JMESPath query`)
          if (queryError instanceof QueryError) {
            console.error(`Query: ${queryError.query}`)
            console.error(`Reason: ${queryError.message}`)
          }
          else if (queryError instanceof Error) {
            console.error(`Reason: ${queryError.message}`)
          }
          else {
            console.error(`Reason: ${msg.unknownError}`)
          }
          console.error('\nJMESPath Resources:')
          console.error('  - Tutorial: https://jmespath.org/tutorial.html')
          console.error('  - Examples: https://jmespath.org/examples.html')
          process.exit(1)
        }
      }

      // Type assertion: at this point format is OutputFormat ('toon' or 'json')
      // because 'table' was handled earlier with early return
      outputData(data, format as OutputFormat)
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
      console.error(`  - Try with --format table to see native output: gh please ${cleanArgs.join(' ')} --format table`)
      console.error('  - Report this issue if the command should support JSON')
      if (result.stdout.length > 0) {
        console.error(`\nPartial output received (${result.stdout.length} bytes)`)
        console.error('First 200 chars:', result.stdout.slice(0, 200))
      }
      process.exit(1)
    }
  }
}
