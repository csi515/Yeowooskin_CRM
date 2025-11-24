import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getEnv } from '@/app/lib/env'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
  const { email } = await req.json()
    if (!email) {
      return NextResponse.json({ message: 'email required' }, { status: 400 })
    }

    const url = getEnv.supabaseUrl()
    const anon = getEnv.supabaseAnonKey()
    
    if (!url || !anon) {
      return NextResponse.json({ message: 'Server configuration error' }, { status: 500 })
    }
    
  const supabase = createClient(url, anon)
    const baseUrl = getEnv.baseUrl() || getEnv.siteUrl()
    const redirectTo = baseUrl ? `${baseUrl}/auth/callback` : '/auth/callback'
    
    const { error } = await supabase.auth.signInWithOtp({ 
      email, 
      options: { emailRedirectTo: redirectTo } 
    })
    
    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }
    
  return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Login route error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
