import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseServerAdmin } from '@/lib/supabase/server-admin'
import { getServerEnv } from '@/app/lib/env'
import ApproveButton from './ApproveButton'

type PendingUser = {
  id: string
  email: string
  name: string | null
  phone: string | null
  birthdate: string | null
  approved: boolean
  created_at: string
}

async function getSessionAndGuardAdmin() {
  const supabase = createSupabaseServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  // 토큰 만료 또는 유효하지 않은 경우
  if (authError) {
    const isExpired = authError.message.includes('expired') || authError.message.includes('invalid')
    if (isExpired) {
      // 토큰 만료 시 로그인 페이지로 리다이렉트
      redirect('/login?error=expired')
    }
    redirect('/login')
  }
  
  if (!user) {
    redirect('/login')
  }
  
  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') {
    redirect('/')
  }
  
  return { supabase, user }
}

async function getPendingUsers(): Promise<PendingUser[]> {
  // Service Role 키가 없으면 서버 크래시를 피하고 빈 목록 반환
  const serviceRoleKey = getServerEnv.supabaseServiceRoleKey()
  if (!serviceRoleKey) return []
  
  try {
    const admin = createSupabaseServerAdmin()
    const { data } = await admin
      .from('users')
      .select('id,email,name,phone,birthdate,approved,created_at')
      .eq('approved', false)
      .order('created_at', { ascending: true })
    return (data as any) || []
  } catch (error) {
    console.error('Failed to fetch pending users:', error)
    return []
  }
}

export default async function AdminUsersPage() {
  await getSessionAndGuardAdmin()
  const pending = await getPendingUsers()
  const srMissing = !getServerEnv.supabaseServiceRoleKey()
  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">승인 대기 사용자</h1>
      {srMissing && (
        <div className="mb-4 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900">
          Service Role 키가 설정되지 않아 승인 목록/승인 기능을 사용할 수 없습니다.
          서버 환경변수 <code>SUPABASE_SERVICE_ROLE_KEY</code>를 설정한 뒤 서버를 재시작하세요.
        </div>
      )}
      {pending.length === 0 ? (
        <p className="text-gray-500">승인 대기 중인 사용자가 없습니다.</p>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">이메일</th>
                <th className="px-3 py-2 text-left">이름</th>
                <th className="px-3 py-2 text-left">전화</th>
                <th className="px-3 py-2 text-left">생년월일</th>
                <th className="px-3 py-2 text-left">가입일</th>
                <th className="px-3 py-2 text-left">동작</th>
              </tr>
            </thead>
            <tbody>
              {pending.map(u => (
                <tr key={u.id} className="border-t">
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">{u.name || '-'}</td>
                  <td className="px-3 py-2">{u.phone || '-'}</td>
                  <td className="px-3 py-2">{u.birthdate || '-'}</td>
                  <td className="px-3 py-2">{new Date(u.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <ApproveButton userId={u.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}

