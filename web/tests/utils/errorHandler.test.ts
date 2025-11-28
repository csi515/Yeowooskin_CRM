/**
 * 에러 처리 유틸리티 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  normalizeError,
  getUserFriendlyMessage,
  logError,
} from '@/app/lib/utils/errorHandler'

describe('errorHandler utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('normalizeError', () => {
    it('Error 객체 처리', () => {
      const error = new Error('Test error')
      const result = normalizeError(error)
      expect(result.message).toBe('Test error')
      expect(result.originalError).toBe(error)
    })

    it('문자열 에러 처리', () => {
      const result = normalizeError('String error')
      expect(result.message).toBe('String error')
    })

    it('에러 객체 (message 포함)', () => {
      const error = { message: 'Custom error', code: 'ERR001' }
      const result = normalizeError(error)
      expect(result.message).toBe('Custom error')
      expect(result.code).toBe('ERR001')
    })

    it('알 수 없는 에러 처리', () => {
      const result = normalizeError(null)
      expect(result.message).toBe('알 수 없는 오류가 발생했습니다.')
    })
  })

  describe('getUserFriendlyMessage', () => {
    it('네트워크 에러', () => {
      const error = { message: 'fetch failed' }
      const result = getUserFriendlyMessage(error)
      expect(result).toBe('네트워크 연결을 확인해주세요.')
    })

    it('인증 에러 (401)', () => {
      const error = { message: 'unauthorized', status: 401 }
      const result = getUserFriendlyMessage(error)
      expect(result).toBe('로그인이 필요합니다.')
    })

    it('권한 에러 (403)', () => {
      const error = { message: 'forbidden', status: 403 }
      const result = getUserFriendlyMessage(error)
      expect(result).toBe('접근 권한이 없습니다.')
    })

    it('서버 에러 (500)', () => {
      const error = { message: 'server error', status: 500 }
      const result = getUserFriendlyMessage(error)
      expect(result).toBe('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    })

    it('타임아웃 에러', () => {
      const error = { message: 'timeout occurred' }
      const result = getUserFriendlyMessage(error)
      expect(result).toBe('요청 시간이 초과되었습니다. 다시 시도해주세요.')
    })

    it('기본 메시지', () => {
      const error = { message: 'Custom error message' }
      const result = getUserFriendlyMessage(error)
      expect(result).toBe('Custom error message')
    })
  })

  describe('logError', () => {
    it('개발 환경에서 상세 로그', () => {
      vi.stubEnv('NODE_ENV', 'development')

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })
      const error = { message: 'Test error', code: 'ERR001' }

      logError('TestContext', error)

      expect(consoleSpy).toHaveBeenCalledWith(
        '[TestContext]',
        expect.objectContaining({
          message: 'Test error',
          code: 'ERR001',
        })
      )

      consoleSpy.mockRestore()
      vi.unstubAllEnvs()
    })

    it('프로덕션 환경에서 간단한 로그', () => {
      vi.stubEnv('NODE_ENV', 'production')

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })
      const error = { message: 'Test error' }

      logError('TestContext', error)

      expect(consoleSpy).toHaveBeenCalledWith('[TestContext]', 'Test error')

      consoleSpy.mockRestore()
      vi.unstubAllEnvs()
    })
  })
})

