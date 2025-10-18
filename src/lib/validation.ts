/**
 * Validates that a comment ID is a positive integer
 */
export function validateCommentId(id: string): number {
  // Check if the string contains only digits
  if (!/^\d+$/.test(id)) {
    throw new Error("Comment ID must be a positive integer");
  }

  const parsed = parseInt(id, 10);
  if (isNaN(parsed) || parsed <= 0) {
    throw new Error("Comment ID must be a positive integer");
  }
  return parsed;
}

/**
 * Validates that a reply body is not empty
 */
export function validateReplyBody(body: string | undefined): string {
  if (!body || body.trim().length === 0) {
    throw new Error("Reply body cannot be empty");
  }
  return body.trim();
}
