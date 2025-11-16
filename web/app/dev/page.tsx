'use client'

import { useEffect, useState } from 'react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

export default function DevPage() {
  const [info, setInfo] = useState<any>({})
  const [session, setSession] = useState<any>(null)
  const [envInfo, setEnvInfo] = useState<any>({})

  useEffect(() => {
    const load = async () => {
      try {
        const { healthApi } = await import('@/app/lib/api/health')
        const status = await healthApi.checkEndpoints()
        setInfo(status)
      } catch {
        setInfo({ customers: 0, products: 0, expenses: 0 })
      }

      try {
        const { createSupabaseBrowserClient } = await import('@/lib/supabase/client')
        const supa = createSupabaseBrowserClient()
        const { data: { session } } = await supa.auth.getSession()
        setSession(session)
      } catch (error) {
        console.error('Failed to get session:', error)
      }

      // 환경변수 정보 로드
      try {
        const { getEnv } = await import('@/app/lib/env')
        setEnvInfo({
          NEXT_PUBLIC_SUPABASE_URL: getEnv.supabaseUrl() || '(unset)'
        })
      } catch (error) {
        setEnvInfo({
          NEXT_PUBLIC_SUPABASE_URL: '(unavailable)'
        })
      }
    }
    load()
  }, [])

  return (
    <main className="p-6 space-y-4 max-w-screen-lg mx-auto">
      <h1 className="text-xl font-semibold">개발자 화면</h1>

      <Card className="p-4">
        <div className="font-medium mb-2">엔드포인트 상태 코드</div>
        <pre className="text-sm bg-gray-50 p-3 rounded border">{JSON.stringify(info, null, 2)}</pre>
      </Card>

      <Card className="p-4">
        <div className="font-medium mb-2">세션(클라이언트 체크)</div>
        <pre className="text-sm bg-gray-50 p-3 rounded border">{JSON.stringify(session ? { user: session.user?.id, exp: session.expires_at } : null, null, 2)}</pre>
        <div className="mt-3 flex gap-2">
          <form action="/api/auth/logout" method="post"><Button size="sm" variant="secondary">로그아웃</Button></form>
        </div>
      </Card>

      <Card className="p-4">
        <div className="font-medium mb-2">환경 (클라이언트에서 접근 가능한 값만 표시)</div>
        <pre className="text-sm bg-gray-50 p-3 rounded border">{JSON.stringify(envInfo, null, 2)}</pre>
      </Card>
    </main>
  )
}


