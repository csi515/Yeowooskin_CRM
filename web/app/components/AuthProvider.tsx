'use client'

import { useEffect, useState, createContext, useContext, ReactNode } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  supabase: ReturnType<typeof createSupabaseBrowserClient>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * 전역 인증 상태 관리 Provider
 * 
 * 기능:
 * - Supabase 클라이언트 초기화
 * - onAuthStateChange 이벤트 리스너로 세션 상태 관리
 * - TOKEN_REFRESHED 이벤트 처리
 * - 자동 로그아웃 처리
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => {
    if (typeof window === 'undefined') {
      // 서버 사이드에서는 더미 객체 반환 (실제로는 사용되지 않음)
      return null as any
    }
    return createSupabaseBrowserClient()
  })
  const router = useRouter()

  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window === 'undefined' || !supabase) {
      setLoading(false)
      return
    }

    // 초기 세션 확인
    const initSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession()
        setSession(initialSession)
        setUser(initialSession?.user ?? null)
      } catch (error) {
        console.error('Failed to get initial session:', error)
        setSession(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initSession()

    // 인증 상태 변경 리스너 설정
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, currentSession: Session | null) => {
      console.log('Auth state changed:', event, currentSession?.user?.id)

      setSession(currentSession)
      setUser(currentSession?.user ?? null)

      // 토큰 갱신 이벤트 처리
      if (event === 'TOKEN_REFRESHED' && currentSession) {
        console.log('Token refreshed successfully')
        
        // 쿠키에 새 토큰 동기화
        try {
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              access_token: currentSession.access_token,
              refresh_token: currentSession.refresh_token,
              expires_in: currentSession.expires_in,
            }),
          })
        } catch (error) {
          console.error('Failed to sync refreshed token to cookie:', error)
        }
      }

      // 로그아웃 이벤트 처리
      if (event === 'SIGNED_OUT') {
        console.log('User signed out')
        // 쿠키 삭제
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
          })
        } catch (error) {
          console.error('Failed to clear cookie on sign out:', error)
        }
        router.push('/login')
      }

      // 로그인 이벤트 처리
      if (event === 'SIGNED_IN' && currentSession) {
        console.log('User signed in')
        // 쿠키에 세션 저장
        try {
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              access_token: currentSession.access_token,
              refresh_token: currentSession.refresh_token,
              expires_in: currentSession.expires_in,
            }),
          })
        } catch (error) {
          console.error('Failed to sync session to cookie:', error)
        }
      }
    })

    // 정리 함수
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  return (
    <AuthContext.Provider value={{ user, session, loading, supabase }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * 인증 컨텍스트 사용 훅
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}


