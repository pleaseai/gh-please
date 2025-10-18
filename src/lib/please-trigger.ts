/**
 * PleaseAI trigger module
 * Provides functions to trigger PleaseAI automation workflows
 */

import type { PleaseTriggerType } from '../types'
import { createIssueComment, createPrComment } from './github-api'

/**
 * Build a trigger comment for PleaseAI
 *
 * @param type - Type of automation to trigger ('triage', 'investigate', 'fix', 'review', 'apply')
 * @returns The trigger comment text
 */
export function buildTriggerComment(type: PleaseTriggerType): string {
  return `/please ${type}`
}

/**
 * Trigger PleaseAI automation on an issue
 *
 * @param type - Type of automation to trigger
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param issueNumber - Issue number
 * @returns Comment ID of the trigger comment
 * @throws Error if the comment creation fails
 */
export async function triggerPleaseAIIssue(
  type: PleaseTriggerType,
  owner: string,
  repo: string,
  issueNumber: number,
): Promise<number> {
  const comment = buildTriggerComment(type)
  return createIssueComment(owner, repo, issueNumber, comment)
}

/**
 * Trigger PleaseAI automation on a pull request
 *
 * @param type - Type of automation to trigger
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param prNumber - Pull request number
 * @returns Comment ID of the trigger comment
 * @throws Error if the comment creation fails
 */
export async function triggerPleaseAIPr(
  type: PleaseTriggerType,
  owner: string,
  repo: string,
  prNumber: number,
): Promise<number> {
  const comment = buildTriggerComment(type)
  return createPrComment(owner, repo, prNumber, comment)
}
