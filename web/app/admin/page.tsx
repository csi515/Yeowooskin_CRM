import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import AdminUsersPageClient from './AdminUsersPageClient'
import { requireHQ } from '@/app/lib/api/roleGuard'

type PendingUser = {
  id: string
  email: string
  name: string | null
  phone: string | null
  role: 'HQ' | 'OWNER' | 'STAFF'
  branch_id: string | null
  created_at: string
  branches?: {
    name: string
    code: string
  } | null
}

async function getSessionAndGuardHQ() {
  const supabase = createSupabaseServerClient()
  const { data: { session }, error: authError } = await supabase.auth.getSession()
  
  if (authError || !session?.user) {
    redirect('/login')
  }

  // 프로필에서 역할 확인
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!profile || profile.role !== 'HQ') {
    redirect('/dashboard')
  }
  
  return { supabase, user: session.user }
}

async function getPendingUsers(): Promise<PendingUser[]> {
  try {
    const supabase = createSupabaseServerClient()
    
    // 승인 대기 중인 사용자 조회
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        name,
        phone,
        role,
        branch_id,
        created_at,
        branches (
          name,
          code
        )
      `)
      .eq('approved', false)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Failed to fetch pending users:', error)
      return []
    }

    return (data || []) as PendingUser[]
  } catch (error) {
    console.error('Failed to fetch pending users:', error)
    return []
  }
}

export default async function AdminUsersPage() {
  await getSessionAndGuardHQ()
  const pending = await getPendingUsers()
  
  return (
    <AdminUsersPageClient pending={pending} />
  )
}

export type { PendingUser }
