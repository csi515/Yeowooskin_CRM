'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import Button from './ui/Button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * 전역 에러 바운더리 컴포넌트
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    }
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 로깅 유틸리티 사용 (동적 import로 변경하여 Vercel 빌드 최적화)
    if (typeof window !== 'undefined') {
      try {
        const { logger } = await import('../lib/utils/logger')
        logger.error('ErrorBoundary caught an error', error, 'ErrorBoundary')
        logger.error('Error info', errorInfo, 'ErrorBoundary')
      } catch (importError) {
        // logger import 실패 시 기본 console.error 사용
        console.error('ErrorBoundary caught an error:', error, errorInfo)
      }
    } else {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <div className="max-w-md w-full space-y-4 text-center">
            <h1 className="text-2xl font-bold text-neutral-900">오류가 발생했습니다</h1>
            <p className="text-neutral-600">
              예상치 못한 오류가 발생했습니다. 페이지를 새로고침하거나 다시 시도해주세요.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-4 p-4 bg-red-50 rounded-md text-left">
                <p className="text-sm font-mono text-red-800">{this.state.error.message}</p>
                {this.state.error.stack && (
                  <pre className="mt-2 text-xs text-red-700 overflow-auto">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}
            <div className="flex gap-2 justify-center">
              <Button onClick={this.handleReset} variant="primary">
                다시 시도
              </Button>
              <Button
                onClick={() => {
                  window.location.href = '/'
                }}
                variant="secondary"
              >
                홈으로 이동
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

