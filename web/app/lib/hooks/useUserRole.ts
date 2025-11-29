'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

type UserRole = 'admin' | 'user' | null

interface UseUserRoleReturn {
    role: UserRole
    isAdmin: boolean
    isLoading: boolean
}

/**
 * 현재 로그인한 사용자의 역할을 확인하는 훅
 */
export function useUserRole(): UseUserRoleReturn {
    const [role, setRole] = useState<UserRole>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchUserRole = async () => {
            try {
                const supabase = createSupabaseBrowserClient()
                const { data: { user } } = await supabase.auth.getUser()

                if (!user) {
                    setRole(null)
                    return
                }

                const { data } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', user.id)
                    .single<{ role: string }>()

                setRole((data?.role as UserRole) || 'user')
            } catch (error) {
                console.error('Failed to fetch user role:', error)
                setRole(null)
            } finally {
                setIsLoading(false)
            }
        }

        fetchUserRole()
    }, [])

    return {
        role,
        isAdmin: role === 'admin',
        isLoading,
    }
}

/**
 * 현재 사용자가 관리자인지 확인하는 훅
 */
export function useIsAdmin(): boolean {
    const { isAdmin } = useUserRole()
    return isAdmin
}
