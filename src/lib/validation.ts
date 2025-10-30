/**
 * Validation utilities
 *
 * Wrappers around @pleaseai/cli-toolkit/validation for backward compatibility
 */

import { validateNonEmptyString, validatePositiveInteger } from '@pleaseai/cli-toolkit/validation'

/**
 * Validates that a comment ID is a positive integer
 */
export function validateCommentId(id: string): number {
  return validatePositiveInteger(id, 'Comment ID')
}

/**
 * Validates that a reply body is not empty
 */
export function validateReplyBody(body: string | undefined): string {
  return validateNonEmptyString(body, 'Reply body')
}
