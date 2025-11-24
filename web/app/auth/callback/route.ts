import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getEnv } from '@/app/lib/env'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
  const url = new URL(req.url)
  const token_hash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type')
  const redirect = url.searchParams.get('redirect') || '/'

    if (!token_hash) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const supaUrl = getEnv.supabaseUrl()
    const anon = getEnv.supabaseAnonKey()
    
    if (!supaUrl || !anon) {
      console.error('Supabase environment variables not configured')
      return NextResponse.redirect(new URL('/login?error=config', req.url))
    }
    
    const supabase = createClient(supaUrl, anon)
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: (type as 'recovery' | 'email' | 'invite' | 'signup' | 'magiclink') || 'magiclink'
    })

    if (error || !data.session) {
      return NextResponse.redirect(new URL('/login?error=auth', req.url))
    }

  const res = NextResponse.redirect(new URL(redirect, req.url))
    // Vercel에서는 프로덕션 환경에서 자동으로 HTTPS를 사용하므로 secure를 true로 설정
  const secure = process.env.NODE_ENV === 'production'
    
    res.cookies.set('sb:token', data.session.access_token, { 
      path: '/', 
      httpOnly: true, 
      sameSite: 'lax', 
      secure,
      maxAge: 60 * 60 * 24 * 7 // 7일
    })
    
  if (data.session.refresh_token) {
      res.cookies.set('sb:refresh', data.session.refresh_token, { 
        path: '/', 
        httpOnly: true, 
        sameSite: 'lax', 
        secure,
        maxAge: 60 * 60 * 24 * 30 // 30일
      })
  }
    
  return res
  } catch (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(new URL('/login?error=server', req.url))
  }
}
