import type { PrInfo, ReviewComment, ReplyOptions } from "../types";

/**
 * Parse PR info from gh CLI output
 */
export function parsePrInfo(data: any): PrInfo {
  return {
    number: data.number,
    owner: data.owner?.login || data.owner,
    repo: data.repository?.name || data.repository,
  };
}

/**
 * Build endpoint for getting a review comment
 */
export function buildGetCommentEndpoint(prInfo: PrInfo, commentId: number): string {
  const { owner, repo, number } = prInfo;
  return `/repos/${owner}/${repo}/pulls/${number}/comments/${commentId}`;
}

/**
 * Build endpoint for creating a reply
 */
export function buildReplyEndpoint(prInfo: PrInfo, commentId: number): string {
  const { owner, repo, number } = prInfo;
  return `/repos/${owner}/${repo}/pulls/${number}/comments/${commentId}/replies`;
}

/**
 * Check if a comment is a top-level review comment
 */
export function isTopLevelComment(comment: ReviewComment): boolean {
  return comment.line !== null;
}

/**
 * Get current PR information using gh CLI
 */
export async function getCurrentPrInfo(): Promise<PrInfo> {
  const proc = Bun.spawn(["gh", "pr", "view", "--json", "number,owner,repository"], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const output = await new Response(proc.stdout).text();
  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    const error = await new Response(proc.stderr).text();
    throw new Error(`Failed to get PR info: ${error.trim() || "Not in a PR context"}`);
  }

  const data = JSON.parse(output);
  return parsePrInfo(data);
}

/**
 * Get a specific review comment by ID
 */
export async function getReviewComment(
  prInfo: PrInfo,
  commentId: number
): Promise<ReviewComment> {
  const endpoint = buildGetCommentEndpoint(prInfo, commentId);

  const proc = Bun.spawn(
    [
      "gh",
      "api",
      "-H",
      "Accept: application/vnd.github+json",
      "-H",
      "X-GitHub-Api-Version: 2022-11-28",
      endpoint,
    ],
    {
      stdout: "pipe",
      stderr: "pipe",
    }
  );

  const output = await new Response(proc.stdout).text();
  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    const error = await new Response(proc.stderr).text();
    throw new Error(`Failed to fetch comment ${commentId}: ${error.trim()}`);
  }

  return JSON.parse(output);
}

/**
 * Create a reply to a review comment
 */
export async function createReviewReply(options: ReplyOptions): Promise<void> {
  const { commentId, body, prInfo } = options;

  // Validate that comment exists and is a top-level review comment
  const comment = await getReviewComment(prInfo, commentId);

  if (!isTopLevelComment(comment)) {
    // This might be a reply to a comment, not a top-level comment
    console.warn("⚠️  Warning: This comment might not be a top-level review comment.");
    console.warn("   Replies to replies are not supported by GitHub API.");
  }

  const endpoint = buildReplyEndpoint(prInfo, commentId);

  const proc = Bun.spawn(
    [
      "gh",
      "api",
      "--method",
      "POST",
      "-H",
      "Accept: application/vnd.github+json",
      "-H",
      "X-GitHub-Api-Version: 2022-11-28",
      endpoint,
      "-f",
      `body=${body}`,
    ],
    {
      stdout: "pipe",
      stderr: "pipe",
    }
  );

  const output = await new Response(proc.stdout).text();
  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    const error = await new Response(proc.stderr).text();
    throw new Error(`Failed to create reply: ${error.trim()}`);
  }

  const reply = JSON.parse(output);
  console.log(`✅ Reply created successfully!`);
  console.log(`   Comment ID: ${reply.id}`);
  console.log(`   View: ${reply.html_url}`);
}
