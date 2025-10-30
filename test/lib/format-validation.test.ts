/**
 * Tests for format validation utilities
 *
 * Ensures that invalid format values are properly validated and
 * provide helpful error messages to users.
 */

import { describe, expect, test } from 'bun:test'
import { isValidFormat, validateFormat } from '../../src/lib/json-output'

describe('Format Validation', () => {
  describe('isValidFormat', () => {
    test('should return true for valid json format', () => {
      expect(isValidFormat('json')).toBe(true)
    })

    test('should return true for valid toon format', () => {
      expect(isValidFormat('toon')).toBe(true)
    })

    test('should return false for invalid format', () => {
      expect(isValidFormat('xml')).toBe(false)
    })

    test('should return false for empty string', () => {
      expect(isValidFormat('')).toBe(false)
    })

    test('should return false for undefined', () => {
      expect(isValidFormat(undefined as any)).toBe(false)
    })

    test('should return false for null', () => {
      expect(isValidFormat(null as any)).toBe(false)
    })

    test('should be case-sensitive', () => {
      expect(isValidFormat('JSON')).toBe(false)
      expect(isValidFormat('TOON')).toBe(false)
      expect(isValidFormat('Json')).toBe(false)
    })
  })

  describe('validateFormat', () => {
    test('should return format when valid json', () => {
      expect(validateFormat('json')).toBe('json')
    })

    test('should return format when valid toon', () => {
      expect(validateFormat('toon')).toBe('toon')
    })

    test('should throw error for invalid format', () => {
      expect(() => validateFormat('xml')).toThrow('Invalid output format: xml')
    })

    test('should include supported formats in error message', () => {
      expect(() => validateFormat('yaml')).toThrow('Supported formats: json, toon')
    })

    test('should throw error for empty string', () => {
      expect(() => validateFormat('')).toThrow('Invalid output format')
    })

    test('should throw error for undefined', () => {
      expect(() => validateFormat(undefined as any)).toThrow('Invalid output format')
    })

    test('should throw error for null', () => {
      expect(() => validateFormat(null as any)).toThrow('Invalid output format')
    })

    test('should suggest correct format for case mismatch', () => {
      expect(() => validateFormat('JSON')).toThrow('Invalid output format: JSON')
      expect(() => validateFormat('JSON')).toThrow('Supported formats: json, toon')
    })
  })
})
