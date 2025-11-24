import { useState, useEffect } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import type { Profile, Branch } from '@/types/entities'

export interface CurrentUser extends Profile {
  branch?: Branch
}

export function useCurrentUser() {
  const { user, supabase } = useAuth()
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadCurrentUser = async () => {
      if (!user?.id) {
        setCurrentUser(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // 프로필 정보 조회
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select(`
            *,
            branches (*)
          `)
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Profile load error:', profileError)
          setError('프로필 정보를 불러올 수 없습니다.')
          setCurrentUser(null)
          setLoading(false)
          return
        }

        if (!profile) {
          setError('프로필을 찾을 수 없습니다.')
          setCurrentUser(null)
          setLoading(false)
          return
        }

        setCurrentUser({
          ...profile,
          branch: profile.branches || undefined
        })
      } catch (err) {
        console.error('Current user load failed:', err)
        setError('사용자 정보를 불러오는 중 오류가 발생했습니다.')
        setCurrentUser(null)
      } finally {
        setLoading(false)
      }
    }

    loadCurrentUser()
  }, [user?.id, supabase])

  return {
    currentUser,
    loading,
    error,
    isHQ: currentUser?.role === 'HQ',
    isOwner: currentUser?.role === 'OWNER',
    isStaff: currentUser?.role === 'STAFF',
    branchId: currentUser?.branch_id,
    role: currentUser?.role
  }
}
