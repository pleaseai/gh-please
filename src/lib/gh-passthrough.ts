import type { OutputFormat } from '@pleaseai/cli-toolkit/output'
import type { Language } from '../types'
import { outputData } from '@pleaseai/cli-toolkit/output'
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
  const proc = Bun.spawn(['gh', ...args], {
    stdout: 'pipe',
    stderr: 'pipe',
  })

  const stdout = await new Response(proc.stdout).text()
  const stderr = await new Response(proc.stderr).text()
  const exitCode = await proc.exited

  return { stdout, stderr, exitCode }
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
        i++ // Skip next arg
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
 * @param args - Command arguments
 * @returns Args with --json injected
 */
function injectJsonFlag(args: string[]): string[] {
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
    // Detect --json not supported error
    if (format && (result.stderr.includes('unknown flag') || result.stderr.includes('unknown argument'))) {
      console.error(msg.jsonNotSupported)
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
      const data = JSON.parse(result.stdout)
      outputData(data, format)
    }
    catch (error) {
      // JSON parse error
      console.error(msg.jsonParseError)
      if (error instanceof Error) {
        console.error(error.message)
      }
      process.exit(1)
    }
  }
  else {
    // Preserve original output
    process.stdout.write(result.stdout)
  }
}
