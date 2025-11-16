import { createClient } from '@supabase/supabase-js'
import { getEnv, getServerEnv } from '@/app/lib/env'

/**
 * 서버 사이드 관리자용 Supabase 클라이언트 생성
 * RLS를 우회하는 관리자 권한이 필요한 경우에만 사용
 * API Routes나 Server Actions에서만 사용 가능
 */
export function createSupabaseServerAdmin() {
	if (typeof window !== 'undefined') {
		throw new Error('createSupabaseServerAdmin()는 서버에서만 사용할 수 있습니다.')
	}
	
	const url = getEnv.supabaseUrl()
	const serviceKey = getServerEnv.supabaseServiceRoleKey()
	
	if (!url) {
		throw new Error('Supabase URL이 설정되지 않았습니다.')
	}
	
	if (!serviceKey) {
		throw new Error('Supabase Service Role Key가 설정되지 않았습니다. 서버 사이드에서만 사용 가능합니다.')
	}
	
	return createClient(url, serviceKey, {
		auth: { persistSession: false, autoRefreshToken: false },
	})
}


