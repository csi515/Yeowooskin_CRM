/**
 * 로깅 유틸리티
 * 개발/프로덕션 환경별 로깅 레벨 관리
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  data?: unknown
  timestamp: string
  context?: string
}

class Logger {
  private isDevelopment: boolean
  private logHistory: LogEntry[] = []
  private maxHistorySize = 100

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
  }

  private log(level: LogLevel, message: string, data?: unknown, context?: string) {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      context,
    }

    // 개발 환경에서는 항상 로그 저장
    // 프로덕션에서는 error와 warn만 저장
    if (this.isDevelopment || level === 'error' || level === 'warn') {
      this.logHistory.push(entry)
      if (this.logHistory.length > this.maxHistorySize) {
        this.logHistory.shift()
      }
    }

    // 콘솔 출력
    if (this.isDevelopment) {
      const prefix = context ? `[${context}]` : ''
      const logMessage = `${prefix} ${message}`
      
      switch (level) {
        case 'debug':
          console.debug(logMessage, data || '')
          break
        case 'info':
          console.info(logMessage, data || '')
          break
        case 'warn':
          console.warn(logMessage, data || '')
          break
        case 'error':
          console.error(logMessage, data || '')
          break
      }
    } else {
      // 프로덕션에서는 error만 콘솔에 출력
      if (level === 'error') {
        console.error(`[${context || 'App'}] ${message}`, data || '')
      }
    }

    // 에러 추적 도구 연동 (Sentry 등)
    if (level === 'error' && typeof window !== 'undefined') {
      // TODO: Sentry 또는 다른 에러 추적 도구 연동
      // Sentry.captureException(new Error(message), { extra: data })
    }
  }

  debug(message: string, data?: unknown, context?: string) {
    this.log('debug', message, data, context)
  }

  info(message: string, data?: unknown, context?: string) {
    this.log('info', message, data, context)
  }

  warn(message: string, data?: unknown, context?: string) {
    this.log('warn', message, data, context)
  }

  error(message: string, error?: unknown, context?: string) {
    const errorData = error instanceof Error 
      ? { message: error.message, stack: error.stack, name: error.name }
      : error
    this.log('error', message, errorData, context)
  }

  /**
   * 로그 히스토리 조회
   */
  getHistory(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logHistory.filter(entry => entry.level === level)
    }
    return [...this.logHistory]
  }

  /**
   * 로그 히스토리 초기화
   */
  clearHistory() {
    this.logHistory = []
  }
}

export const logger = new Logger()

