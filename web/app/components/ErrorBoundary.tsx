'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import Button from './ui/Button'
import ErrorDisplay from './ui/ErrorDisplay'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * 전역 에러 바운더리 컴포넌트
 * React 컴포넌트 트리에서 발생한 에러를 캐치하고 처리합니다.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    }
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })
    
    // 에러 로깅
    if (typeof window !== 'undefined') {
      try {
        const { logger } = await import('../lib/utils/logger')
        logger.error('ErrorBoundary caught an error', error, 'ErrorBoundary')
        logger.error('Error info', errorInfo, 'ErrorBoundary')
      } catch (importError) {
        console.error('ErrorBoundary caught an error:', error, errorInfo)
      }
    } else {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    // 사용자 정의 에러 핸들러 호출
    this.props.onError?.(error, errorInfo)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 md:p-6">
          <div className="max-w-md w-full">
            <ErrorDisplay
              title="오류가 발생했습니다"
              message="예상치 못한 오류가 발생했습니다. 페이지를 새로고침하거나 다시 시도해주세요."
              onRetry={this.handleReset}
            />
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-4 p-4 bg-error-50 rounded-xl border border-error-200 text-left">
                <p className="text-sm font-mono text-error-800 font-semibold mb-2">
                  {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <pre className="mt-2 text-xs text-error-700 overflow-auto max-h-64">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}
            
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
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
