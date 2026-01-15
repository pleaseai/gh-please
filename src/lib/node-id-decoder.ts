/**
 * GitHub Node ID Universal Decoder
 *
 * Decodes GitHub Node IDs to extract Database IDs without API calls.
 * Supports both New format (MessagePack + Base64) and Legacy format (text Base64).
 *
 * Reference: https://www.greptile.com/blog/github-ids
 */

/**
 * Node ID prefix to type mapping
 */
const PREFIX_TO_TYPE: Record<string, string> = {
  I_: 'Issue',
  PR_: 'PullRequest',
  IC_: 'IssueComment',
  PRRC_: 'PullRequestReviewComment',
  PRRT_: 'PullRequestReviewThread',
  R_: 'Repository',
  U_: 'User',
  O_: 'Organization',
  RE_: 'Release',
  C_: 'Commit',
  LA_: 'Label',
  MI_: 'Milestone',
  MDC_: 'Discussion',
  DC_: 'DiscussionComment',
}

/**
 * Type to prefix mapping (reverse of PREFIX_TO_TYPE)
 */
const TYPE_TO_PREFIX: Record<string, string> = Object.fromEntries(
  Object.entries(PREFIX_TO_TYPE).map(([prefix, type]) => [type, prefix]),
)

/**
 * Legacy type ID to type name mapping
 * Format: "XXX:TypeNameDatabaseId"
 */
const LEGACY_TYPE_PATTERNS: Array<{ pattern: RegExp, type: string }> = [
  { pattern: /Repository(\d+)$/, type: 'Repository' },
  { pattern: /Issue(\d+)$/, type: 'Issue' },
  { pattern: /PullRequest(\d+)$/, type: 'PullRequest' },
  { pattern: /User(\d+)$/, type: 'User' },
  { pattern: /Organization(\d+)$/, type: 'Organization' },
  { pattern: /IssueComment(\d+)$/, type: 'IssueComment' },
  { pattern: /PullRequestReviewComment(\d+)$/, type: 'PullRequestReviewComment' },
  { pattern: /Commit(\d+)$/, type: 'Commit' },
  { pattern: /Release(\d+)$/, type: 'Release' },
  { pattern: /Label(\d+)$/, type: 'Label' },
  { pattern: /Milestone(\d+)$/, type: 'Milestone' },
]

/**
 * Options for encoding a Node ID
 */
export interface EncodeNodeIdOptions {
  /** GitHub type (e.g., 'Issue', 'PullRequest', 'IssueComment') - provide this OR prefix */
  type?: string
  /** Node ID prefix (e.g., 'I_', 'PR_', 'PRRC_') - provide this OR type */
  prefix?: string
  /** Repository ID (required for New format) */
  repositoryId: number
  /** Database ID to encode */
  databaseId: number
}

/**
 * Decoded Node ID result
 */
export interface DecodedNodeId {
  /** GitHub type (e.g., 'Issue', 'PullRequest', 'IssueComment') */
  type: string | null
  /** Prefix for New format (e.g., 'I_', 'PR_', 'PRRC_'), null for Legacy */
  prefix: string | null
  /** Extracted Database ID */
  databaseId: number
  /** Node ID format: 'new' (MessagePack) or 'legacy' (text Base64) */
  format: 'new' | 'legacy'
  /** Repository ID (only available in New format) */
  repositoryId?: number
  /** Raw decoded array for New format [version, repositoryId, objectId] */
  raw?: number[]
}

/**
 * Check if a string is a New format Node ID (with prefix)
 * New format: PREFIX_base64EncodedMessagePack
 */
export function isNewNodeId(identifier: string): boolean {
  if (!identifier || typeof identifier !== 'string') {
    return false
  }
  // New format has 1-4 uppercase letters, underscore, then Base64 content
  return /^[A-Z]{1,4}_[\w-]+$/.test(identifier)
}

/**
 * Check if a string is a Legacy format Node ID (plain Base64)
 * Legacy format: base64 encoded "XXX:TypeNameDatabaseId"
 */
export function isLegacyNodeId(identifier: string): boolean {
  if (!identifier || typeof identifier !== 'string') {
    return false
  }

  // Must not be New format
  if (isNewNodeId(identifier)) {
    return false
  }

  // Must be valid Base64 and decode to legacy pattern
  try {
    const decoded = decodeBase64ToString(identifier)
    // Legacy format: "XXX:TypeNameDatabaseId" (e.g., "010:Repository139095377")
    return /^\d+:[A-Z][a-zA-Z]+\d+$/.test(decoded)
  }
  catch {
    return false
  }
}

/**
 * Get the prefix from a New format Node ID
 * Returns null for Legacy format or invalid strings
 */
export function getNodeIdPrefix(identifier: string): string | null {
  if (!isNewNodeId(identifier)) {
    return null
  }
  const underscoreIndex = identifier.indexOf('_')
  return identifier.substring(0, underscoreIndex + 1)
}

/**
 * Get the type from a Node ID
 * Returns null if type cannot be determined
 */
export function getNodeIdType(identifier: string): string | null {
  // Try New format first
  const prefix = getNodeIdPrefix(identifier)
  if (prefix) {
    return PREFIX_TO_TYPE[prefix] ?? null
  }

  // Try Legacy format
  if (isLegacyNodeId(identifier)) {
    try {
      const decoded = decodeBase64ToString(identifier)
      for (const { pattern, type } of LEGACY_TYPE_PATTERNS) {
        if (pattern.test(decoded)) {
          return type
        }
      }
    }
    catch {
      return null
    }
  }

  return null
}

/**
 * Decode a Node ID to extract all information
 * Supports both New format (MessagePack) and Legacy format (text Base64)
 *
 * @throws Error if the Node ID is invalid or cannot be decoded
 */
export function decodeNodeId(nodeId: string): DecodedNodeId {
  if (!nodeId || typeof nodeId !== 'string') {
    throw new Error('Invalid Node ID: empty or not a string')
  }

  // Check if it's a numeric string (Database ID, not Node ID)
  if (/^\d+$/.test(nodeId)) {
    throw new Error('Invalid Node ID: numeric strings are Database IDs, not Node IDs')
  }

  // Try New format first
  if (isNewNodeId(nodeId)) {
    return decodeNewFormatNodeId(nodeId)
  }

  // Try Legacy format
  if (isLegacyNodeId(nodeId)) {
    return decodeLegacyFormatNodeId(nodeId)
  }

  throw new Error(`Invalid Node ID format: "${nodeId}"`)
}

/**
 * Extract only the Database ID from a Node ID
 * Convenience function when only the Database ID is needed
 *
 * @throws Error if the Node ID is invalid
 */
export function extractDatabaseId(nodeId: string): number {
  const decoded = decodeNodeId(nodeId)
  return decoded.databaseId
}

/**
 * Encode a Node ID from its components (Database ID → Node ID)
 * Creates a New format Node ID (MessagePack + Base64)
 *
 * @param options - Encoding options (type or prefix, repositoryId, databaseId)
 * @returns Encoded Node ID string
 * @throws Error if options are invalid
 *
 * @example
 * // Using type
 * encodeNodeId({ type: 'Issue', repositoryId: 797346890, databaseId: 123 })
 * // → 'I_kwDOL4aMSs4AAABz'
 *
 * @example
 * // Using prefix
 * encodeNodeId({ prefix: 'PRRC_', repositoryId: 797346890, databaseId: 2475899260 })
 * // → 'PRRC_kwDOL4aMSs6Tkzl8'
 */
export function encodeNodeId(options: EncodeNodeIdOptions): string {
  const { type, prefix: inputPrefix, repositoryId, databaseId } = options

  // Resolve prefix from type or use provided prefix
  let prefix: string
  if (inputPrefix) {
    if (!PREFIX_TO_TYPE[inputPrefix]) {
      throw new Error(`Unknown Node ID prefix: "${inputPrefix}"`)
    }
    prefix = inputPrefix
  }
  else if (type) {
    const resolvedPrefix = TYPE_TO_PREFIX[type]
    if (!resolvedPrefix) {
      throw new Error(`Unknown type: "${type}". Valid types: ${Object.keys(TYPE_TO_PREFIX).join(', ')}`)
    }
    prefix = resolvedPrefix
  }
  else {
    throw new Error('Either type or prefix must be provided')
  }

  // Validate numeric values
  if (repositoryId < 0 || !Number.isInteger(repositoryId)) {
    throw new Error(`Invalid repositoryId: ${repositoryId}. Must be a non-negative integer.`)
  }
  if (databaseId < 0 || !Number.isInteger(databaseId)) {
    throw new Error(`Invalid databaseId: ${databaseId}. Must be a non-negative integer.`)
  }

  // Encode as MessagePack array: [version, repositoryId, databaseId]
  const version = 0 // GitHub uses version 0
  const messagePackBytes = encodeMessagePackArray([version, repositoryId, databaseId])

  // Encode as URL-safe Base64
  const base64 = encodeBytesToBase64(messagePackBytes)

  return prefix + base64
}

// ============================================================================
// Internal Functions
// ============================================================================

/**
 * Prepares a Base64 string for decoding by handling URL-safe characters and padding.
 */
function prepareBase64(base64: string): string {
  // Convert URL-safe Base64 to standard Base64
  const standardBase64 = base64
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  // Add padding if needed
  return standardBase64 + '='.repeat((4 - standardBase64.length % 4) % 4)
}

/**
 * Decode Base64 string to bytes (Uint8Array)
 * Handles both standard and URL-safe Base64
 */
function decodeBase64ToBytes(base64: string): Uint8Array {
  const paddedBase64 = prepareBase64(base64)

  // Decode using atob (available in Bun)
  const binaryString = atob(paddedBase64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

/**
 * Decode Base64 string to text string (for Legacy format)
 */
function decodeBase64ToString(base64: string): string {
  const paddedBase64 = prepareBase64(base64)
  return atob(paddedBase64)
}

/**
 * Decode New format Node ID (MessagePack + Base64)
 * Structure: [version, repositoryId, objectId]
 */
function decodeNewFormatNodeId(nodeId: string): DecodedNodeId {
  const prefix = getNodeIdPrefix(nodeId)!
  const type = PREFIX_TO_TYPE[prefix] ?? null

  // Extract the Base64 part (after the prefix)
  const underscoreIndex = nodeId.indexOf('_')
  const base64Part = nodeId.substring(underscoreIndex + 1)

  try {
    const bytes = decodeBase64ToBytes(base64Part)
    const decoded = decodeMessagePackArray(bytes)

    // Expected format: [version, repositoryId, objectId]
    if (decoded.length < 3) {
      throw new Error('Invalid MessagePack array: expected at least 3 elements')
    }

    const repositoryId = decoded[1]!
    const objectId = decoded[2]!

    return {
      type,
      prefix,
      databaseId: objectId,
      format: 'new',
      repositoryId,
      raw: decoded,
    }
  }
  catch (error) {
    throw new Error(`Failed to decode Node ID "${nodeId}": ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Decode Legacy format Node ID (text Base64)
 * Structure: "XXX:TypeNameDatabaseId"
 */
function decodeLegacyFormatNodeId(nodeId: string): DecodedNodeId {
  try {
    const decoded = decodeBase64ToString(nodeId)

    // Parse "XXX:TypeNameDatabaseId"
    const colonIndex = decoded.indexOf(':')
    if (colonIndex === -1) {
      throw new Error('Invalid Legacy format: missing colon separator')
    }

    const typeAndId = decoded.substring(colonIndex + 1)

    // Find where the type name ends and the ID begins
    const match = typeAndId.match(/^([A-Z][a-zA-Z]+)(\d+)$/)
    if (!match) {
      throw new Error('Invalid Legacy format: cannot parse type and ID')
    }

    const typeName = match[1]!
    const databaseId = Number.parseInt(match[2]!, 10)

    return {
      type: typeName,
      prefix: null,
      databaseId,
      format: 'legacy',
    }
  }
  catch (error) {
    throw new Error(`Failed to decode Legacy Node ID "${nodeId}": ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Minimal MessagePack decoder for GitHub Node IDs
 * Only supports formats used by GitHub:
 * - fixarray (0x90-0x9f): small arrays
 * - positive fixint (0x00-0x7f): small positive integers
 * - uint32 (0xce): 32-bit unsigned integers
 * - uint16 (0xcd): 16-bit unsigned integers
 * - uint8 (0xcc): 8-bit unsigned integers
 */
function decodeMessagePackArray(bytes: Uint8Array): number[] {
  if (bytes.length === 0) {
    throw new Error('Empty MessagePack data')
  }

  let pos = 0

  // Read array header
  const header = bytes[pos++]!

  // Check for fixarray (0x90-0x9f)
  if ((header & 0xF0) !== 0x90) {
    throw new Error(`Expected fixarray, got 0x${header.toString(16)}`)
  }

  const arrayLength = header & 0x0F
  const result: number[] = []

  // Read each element
  for (let i = 0; i < arrayLength; i++) {
    if (pos >= bytes.length) {
      throw new Error('Unexpected end of MessagePack data')
    }

    const type = bytes[pos++]!

    if (type <= 0x7F) {
      // Positive fixint (0x00-0x7f)
      result.push(type)
    }
    else if (type === 0xCC) {
      // uint8
      if (pos >= bytes.length) {
        throw new Error('Unexpected end of MessagePack data')
      }
      result.push(bytes[pos++]!)
    }
    else if (type === 0xCD) {
      // uint16 (big-endian)
      if (pos + 1 >= bytes.length) {
        throw new Error('Unexpected end of MessagePack data')
      }
      const value = (bytes[pos]! << 8) | bytes[pos + 1]!
      pos += 2
      result.push(value)
    }
    else if (type === 0xCE) {
      // uint32 (big-endian)
      if (pos + 3 >= bytes.length) {
        throw new Error('Unexpected end of MessagePack data')
      }
      const value = (bytes[pos]! << 24) | (bytes[pos + 1]! << 16) | (bytes[pos + 2]! << 8) | bytes[pos + 3]!
      pos += 4
      // Convert to unsigned
      result.push(value >>> 0)
    }
    else {
      throw new Error(`Unsupported MessagePack type: 0x${type.toString(16)}`)
    }
  }

  return result
}

/**
 * Minimal MessagePack encoder for GitHub Node IDs
 * Encodes an array of numbers to MessagePack format
 *
 * Supports:
 * - fixarray (0x90-0x9f): small arrays (up to 15 elements)
 * - positive fixint (0x00-0x7f): small positive integers (0-127)
 * - uint8 (0xcc): 8-bit unsigned integers (128-255)
 * - uint16 (0xcd): 16-bit unsigned integers (256-65535)
 * - uint32 (0xce): 32-bit unsigned integers (65536-4294967295)
 */
function encodeMessagePackArray(values: number[]): Uint8Array {
  if (values.length > 15) {
    throw new Error('Array too large for fixarray format (max 15 elements)')
  }

  // Calculate total byte size needed
  let totalSize = 1 // fixarray header
  for (const value of values) {
    totalSize += getMessagePackIntSize(value)
  }

  const bytes = new Uint8Array(totalSize)
  let pos = 0

  // Write fixarray header (0x90 | length)
  bytes[pos++] = 0x90 | values.length

  // Write each value
  for (const value of values) {
    pos = writeMessagePackInt(bytes, pos, value)
  }

  return bytes
}

/**
 * Get the byte size needed to encode an integer in MessagePack format
 */
function getMessagePackIntSize(value: number): number {
  if (value < 0) {
    throw new Error('Negative integers not supported')
  }
  if (value <= 0x7F) {
    return 1 // positive fixint
  }
  if (value <= 0xFF) {
    return 2 // uint8
  }
  if (value <= 0xFFFF) {
    return 3 // uint16
  }
  if (value <= 0xFFFFFFFF) {
    return 5 // uint32
  }
  throw new Error('Integer too large for uint32')
}

/**
 * Write an integer to a Uint8Array in MessagePack format
 * Returns the new position after writing
 */
function writeMessagePackInt(bytes: Uint8Array, pos: number, value: number): number {
  if (value <= 0x7F) {
    // Positive fixint
    bytes[pos++] = value
  }
  else if (value <= 0xFF) {
    // uint8
    bytes[pos++] = 0xCC
    bytes[pos++] = value
  }
  else if (value <= 0xFFFF) {
    // uint16 (big-endian)
    bytes[pos++] = 0xCD
    bytes[pos++] = (value >> 8) & 0xFF
    bytes[pos++] = value & 0xFF
  }
  else {
    // uint32 (big-endian)
    bytes[pos++] = 0xCE
    bytes[pos++] = (value >> 24) & 0xFF
    bytes[pos++] = (value >> 16) & 0xFF
    bytes[pos++] = (value >> 8) & 0xFF
    bytes[pos++] = value & 0xFF
  }
  return pos
}

/**
 * Encode bytes to URL-safe Base64 (without padding)
 */
function encodeBytesToBase64(bytes: Uint8Array): string {
  // Convert to binary string
  let binaryString = ''
  for (let i = 0; i < bytes.length; i++) {
    binaryString += String.fromCharCode(bytes[i]!)
  }

  // Encode to standard Base64
  const base64 = btoa(binaryString)

  // Convert to URL-safe Base64 (replace + with -, / with _, remove padding =)
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}
