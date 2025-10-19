/**
 * Unit tests for progress module
 */

import { describe, test, expect, mock } from 'bun:test'
import {
  createProgressIndicator,
  displayAuthError,
  displayGenericInstallError,
  displayInstallationComplete,
  displayRepoAccessError,
} from '../../src/lib/progress'

describe('Progress Module', () => {
  describe('createProgressIndicator', () => {
    test('should create a progress indicator with all methods', () => {
      const progress = createProgressIndicator()

      expect(progress.start).toBeDefined()
      expect(progress.update).toBeDefined()
      expect(progress.success).toBeDefined()
      expect(progress.error).toBeDefined()
      expect(progress.info).toBeDefined()
    })

    test('should call console.log with correct format for start', () => {
      const mockLog = mock(() => {})
      console.log = mockLog

      const progress = createProgressIndicator()
      progress.start('Testing message')

      expect(mockLog).toHaveBeenCalledWith('📡 Testing message')

      // Restore console.log
      console.log = globalThis.console.log
    })

    test('should call console.log with correct format for update', () => {
      const mockLog = mock(() => {})
      console.log = mockLog

      const progress = createProgressIndicator()
      progress.update('Testing update')

      expect(mockLog).toHaveBeenCalledWith('⏳ Testing update')

      // Restore console.log
      console.log = globalThis.console.log
    })

    test('should call console.log with correct format for success', () => {
      const mockLog = mock(() => {})
      console.log = mockLog

      const progress = createProgressIndicator()
      progress.success('Testing success')

      expect(mockLog).toHaveBeenCalledWith('✅ Testing success')

      // Restore console.log
      console.log = globalThis.console.log
    })

    test('should call console.error with correct format for error', () => {
      const mockError = mock(() => {})
      console.error = mockError

      const progress = createProgressIndicator()
      progress.error('Testing error')

      expect(mockError).toHaveBeenCalledWith('❌ Testing error')

      // Restore console.error
      console.error = globalThis.console.error
    })

    test('should call console.log with correct format for info', () => {
      const mockLog = mock(() => {})
      console.log = mockLog

      const progress = createProgressIndicator()
      progress.info('Testing info')

      expect(mockLog).toHaveBeenCalledWith('ℹ️  Testing info')

      // Restore console.log
      console.log = globalThis.console.log
    })
  })

  describe('displayAuthError', () => {
    test('should display authentication error message', () => {
      const mockError = mock(() => {})
      const mockLog = mock(() => {})
      console.error = mockError
      console.log = mockLog

      displayAuthError()

      expect(mockError).toHaveBeenCalledWith('❌ Not authenticated with GitHub')
      expect(mockLog).toHaveBeenCalled()

      // Restore console methods
      console.error = globalThis.console.error
      console.log = globalThis.console.log
    })

    test('should show recovery instructions', () => {
      const mockLog = mock(() => {})
      console.log = mockLog

      displayAuthError()

      const calls = mockLog.mock.calls.map(call => call[0])
      expect(calls.some(call => call.includes('gh auth login'))).toBe(true)
      expect(calls.some(call => call.includes('gh please plugin install ai --premium'))).toBe(
        true,
      )

      // Restore console.log
      console.log = globalThis.console.log
    })
  })

  describe('displayRepoAccessError', () => {
    test('should display repository access error', () => {
      const mockError = mock(() => {})
      console.error = mockError

      displayRepoAccessError('pleaseai/gh-please-ai')

      expect(mockError).toHaveBeenCalledWith('❌ Repository not found or access denied')

      // Restore console.error
      console.error = globalThis.console.error
    })

    test('should show recovery steps for repository', () => {
      const mockLog = mock(() => {})
      console.log = mockLog

      displayRepoAccessError('pleaseai/gh-please-ai')

      const calls = mockLog.mock.calls.map(call => call[0])
      expect(calls.some(call => call.includes('gh repo view pleaseai/gh-please-ai'))).toBe(true)

      // Restore console.log
      console.log = globalThis.console.log
    })
  })

  describe('displayInstallationComplete', () => {
    test('should display installation completion message', () => {
      const mockLog = mock(() => {})
      console.log = mockLog

      displayInstallationComplete('ai')

      const calls = mockLog.mock.calls.map(call => call[0])
      expect(calls.some(call => call.includes("Plugin 'ai' installed successfully"))).toBe(true)

      // Restore console.log
      console.log = globalThis.console.log
    })

    test('should show next steps', () => {
      const mockLog = mock(() => {})
      console.log = mockLog

      displayInstallationComplete('ai')

      const calls = mockLog.mock.calls.map(call => call[0])
      expect(calls.some(call => call.includes('hash -r'))).toBe(true)
      expect(calls.some(call => call.includes('gh please ai --help'))).toBe(true)

      // Restore console.log
      console.log = globalThis.console.log
    })
  })

  describe('displayGenericInstallError', () => {
    test('should display generic installation error', () => {
      const mockError = mock(() => {})
      console.error = mockError

      displayGenericInstallError('test error message')

      expect(mockError).toHaveBeenCalledWith('❌ Installation failed: test error message')

      // Restore console.error
      console.error = globalThis.console.error
    })

    test('should show troubleshooting steps', () => {
      const mockLog = mock(() => {})
      console.log = mockLog

      displayGenericInstallError('test error')

      const calls = mockLog.mock.calls.map(call => call[0])
      expect(calls.some(call => call.includes('Check your internet connection'))).toBe(true)
      expect(calls.some(call => call.includes('gh --version'))).toBe(true)
      expect(calls.some(call => call.includes('gh auth status'))).toBe(true)

      // Restore console.log
      console.log = globalThis.console.log
    })
  })
})
