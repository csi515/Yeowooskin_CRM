import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { getEnv } from '@/app/lib/env'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const refresh = cookies().get('sb:refresh')?.value
    if (!refresh) {
      return NextResponse.json({ message: 'no refresh token' }, { status: 401 })
    }
    
    const url = getEnv.supabaseUrl()
    const anon = getEnv.supabaseAnonKey()
    
    if (!url || !anon) {
      console.error('Supabase environment variables not configured')
      return NextResponse.json({ message: 'Server configuration error' }, { status: 500 })
    }
    
    const supabase = createClient(url, anon)
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refresh })
    
    if (error || !data.session) {
      return NextResponse.json({ message: error?.message || 'refresh failed' }, { status: 401 })
    }
    
    const res = NextResponse.json({ ok: true })
    // Vercel에서는 프로덕션 환경에서 자동으로 HTTPS를 사용
    const secure = process.env.NODE_ENV === 'production'
    const base = { 
      path: '/', 
      httpOnly: true, 
      sameSite: 'lax' as const, 
      secure,
      maxAge: 60 * 60 * 24 * 7 // 7일
    }
    
    res.cookies.set('sb:token', data.session.access_token, base)
    if (data.session.refresh_token) {
      res.cookies.set('sb:refresh', data.session.refresh_token, {
        ...base,
        maxAge: 60 * 60 * 24 * 30 // 30일
      })
    }
    
    return res
  } catch (e: any) {
    console.error('Refresh route error:', e)
    return NextResponse.json({ message: e?.message || 'refresh error' }, { status: 500 })
  }
}


