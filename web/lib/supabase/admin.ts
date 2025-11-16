/**
 * Supabase Admin 클라이언트
 * 서비스 롤 키를 사용하여 RLS를 우회합니다.
 * @deprecated server-admin.ts의 createSupabaseServerAdmin을 사용하세요
 */

import { createClient } from '@supabase/supabase-js'
import { getEnv, getServerEnv } from '@/app/lib/env'

export function createSupabaseAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('createSupabaseAdminClient()는 서버에서만 사용할 수 있습니다.')
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
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

// 기존 함수명과의 호환성을 위한 별칭
export const createSupabaseServerAdmin = createSupabaseAdminClient

