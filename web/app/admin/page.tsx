import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseServerAdmin } from '@/lib/supabase/server-admin'
import { getServerEnv } from '@/app/lib/env'
import AdminUsersList from './AdminUsersList'

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
  const supabase = await createSupabaseServerClient()
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

async function getAllUsers(): Promise<PendingUser[]> {
  // Service Role 키가 없으면 서버 크래시를 피하고 빈 목록 반환
  const serviceRoleKey = getServerEnv.supabaseServiceRoleKey()
  if (!serviceRoleKey) return []

  try {
    const admin = createSupabaseServerAdmin()
    const { data } = await admin
      .from('users')
      .select('id,email,name,phone,birthdate,approved,created_at')
      .order('created_at', { ascending: true })
    return Array.isArray(data) ? (data as PendingUser[]) : []
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return []
  }
}

export default async function AdminUsersPage() {
  await getSessionAndGuardAdmin()
  const users = await getAllUsers()
  const srMissing = !getServerEnv.supabaseServiceRoleKey()

  return (
    <main className="p-6 max-w-7xl mx-auto">
      {srMissing && (
        <div className="mb-4 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900">
          Service Role 키가 설정되지 않아 사용자 관리 기능을 사용할 수 없습니다.
          서버 환경변수 <code>SUPABASE_SERVICE_ROLE_KEY</code>를 설정한 뒤 서버를 재시작하세요.
        </div>
      )}
      <AdminUsersList initialUsers={users} />
    </main>
  )
}
