'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [supabase, setSupabase] = useState<any>(null)
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const init = async () => {
      if (typeof window === 'undefined') return
      try {
        const { createSupabaseBrowserClient } = await import('@/lib/supabase/client')
        const client = createSupabaseBrowserClient()
        setSupabase(client)
      } catch (error) {
        console.error('Supabase 초기화 오류:', error)
        setError('환경설정 오류: Supabase 초기화에 실패했습니다.')
      }
    }
    init()
  }, [])

  const changePassword = async () => {
    if (!supabase) return
    setError(''); setInfo(''); setBusy(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setBusy(false)
    if (error) { setError(error.message); return }
    setInfo('비밀번호가 변경되었습니다. 잠시 후 로그인 페이지로 이동합니다.')
    setTimeout(() => router.push('/login'), 1200)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--brand-50)] via-white to-[var(--champagne-100)] px-4">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow rounded-lg p-6 space-y-5 border border-[var(--brand-100)]">
        <h1 className="text-2xl font-bold text-gray-900">비밀번호 변경</h1>
        <input
          type="password"
          value={newPassword}
          onChange={e=>setNewPassword(e.target.value)}
          placeholder="새 비밀번호"
          className="w-full border rounded-md px-3 py-2 focus:outline-none focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[color:rgba(255,107,138,0.25)]"
        />
        <button
          onClick={changePassword}
          disabled={busy || newPassword.length < 6 || !supabase}
          className="w-full bg-[var(--brand-500)] text-white py-2 rounded-md hover:bg-[var(--brand-600)] disabled:opacity-60"
        >{busy ? '처리 중...' : '비밀번호 변경하기'}</button>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {info && <p className="text-sm text-green-700">{info}</p>}
      </div>
    </main>
  )
}
