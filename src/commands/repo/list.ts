import type { OutputFormat } from '@pleaseai/cli-toolkit/output'
import { isStructuredOutput, outputData, parseFields } from '@pleaseai/cli-toolkit/output'
import { Command } from 'commander'
import { executeGhCommand } from '../../lib/gh-passthrough'
import { detectSystemLanguage, getRepoMessages } from '../../lib/i18n'
import { applyQuery } from '../../lib/jmespath-query'

interface RepoListItem {
  name: string
  owner: {
    id: string
    login: string
  }
  description: string | null
  url: string
  createdAt: string
  updatedAt: string
  isPrivate: boolean
  isFork: boolean
  stargazerCount?: number
  primaryLanguage?: {
    name: string
  }
}

interface RepoListOptions {
  limit?: string
  json?: string | boolean
  format?: OutputFormat
  query?: string
  org?: string
  public?: boolean
  private?: boolean
  source?: boolean
  fork?: boolean
}

interface TransformedRepo {
  name: string
  owner: string
  description: string
  url: string
  createdAt: string
  updatedAt: string
  isPrivate: boolean
  isFork: boolean
  stargazerCount: number
  primaryLanguage: string
}

/**
 * Creates a command to list repositories
 * @returns Command object for repo list
 */
export function createRepoListCommand(): Command {
  const command = new Command('list')

  command
    .description('List repositories for the authenticated user or organization')
    .option('-L, --limit <number>', 'Maximum number of repositories to fetch')
    .option('--json [fields]', 'Output in JSON format with optional field selection (name,owner,description,url,createdAt,updatedAt,isPrivate,isFork,stargazerCount,primaryLanguage)')
    .option('--format <format>', 'Output format: json or toon')
    .option('--query <jmespath>', 'JMESPath query to filter results (e.g., "[?isFork==`false`].{name:name,stars:stargazerCount}")')
    .option('--org <org>', 'List repositories for an organization')
    .option('--public', 'List only public repositories')
    .option('--private', 'List only private repositories')
    .option('--source', 'List only source repositories (exclude forks)')
    .option('--fork', 'List only forked repositories')
    .action(async (options: RepoListOptions) => {
      // Determine output format
      const outputFormat: OutputFormat = options.format
        ? options.format
        : options.json !== undefined
          ? 'json'
          : 'toon'

      const lang = detectSystemLanguage()
      const msg = getRepoMessages(lang)

      try {
        // Build gh CLI arguments
        const args: string[] = ['repo', 'list']

        if (options.org) {
          args.push(options.org)
        }

        if (options.limit) {
          args.push('--limit', options.limit)
        }

        if (options.public) {
          args.push('--public')
        }

        if (options.private) {
          args.push('--private')
        }

        if (options.source) {
          args.push('--source')
        }

        if (options.fork) {
          args.push('--fork')
        }

        // Determine output mode
        const shouldUseStructuredOutput = isStructuredOutput(options)

        // Always request JSON from gh CLI for structured output
        if (shouldUseStructuredOutput) {
          args.push('--json', 'name,owner,description,url,createdAt,updatedAt,isPrivate,isFork,stargazerCount,primaryLanguage')
        }

        // Show progress messages only for human-readable output
        if (!shouldUseStructuredOutput) {
          console.log(msg.fetchingRepositories)
        }

        // Execute gh CLI command
        const result = await executeGhCommand(args)

        if (result.exitCode !== 0) {
          throw new Error(result.stderr || msg.unknownError)
        }

        // Handle structured output (JSON or TOON)
        if (shouldUseStructuredOutput) {
          let repos: RepoListItem[]
          try {
            repos = JSON.parse(result.stdout)
          }
          catch (parseError) {
            console.error(`${msg.errorPrefix}: Failed to parse repository data from GitHub CLI`)
            console.error(`Parse error: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`)
            console.error('\nTroubleshooting:')
            console.error('  - Verify gh CLI is up to date: gh version')
            console.error('  - Try authenticating again: gh auth login')
            process.exit(1)
          }

          const fields = parseFields(options.json)

          // Transform to consistent output format
          let data: TransformedRepo[] = repos.map(repo => ({
            name: repo.name,
            owner: repo.owner.login,
            description: repo.description || '',
            url: repo.url,
            createdAt: repo.createdAt,
            updatedAt: repo.updatedAt,
            isPrivate: repo.isPrivate,
            isFork: repo.isFork,
            stargazerCount: repo.stargazerCount || 0,
            primaryLanguage: repo.primaryLanguage?.name || '',
          }))

          // Apply JMESPath query if provided
          data = applyQuery(data, options.query, msg.errorPrefix, msg.unknownError)

          outputData(data, outputFormat, fields)
          return
        }

        // Human-readable output - pass through to gh CLI
        console.log(result.stdout)
      }
      catch (error) {
        console.error(
          `${msg.errorPrefix}: ${error instanceof Error ? error.message : msg.unknownError}`,
        )
        process.exit(1)
      }
    })

  return command
}
