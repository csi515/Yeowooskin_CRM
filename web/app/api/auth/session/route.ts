import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json() as { access_token?: string; refresh_token?: string; expires_in?: number; remember?: boolean }
    const { access_token, refresh_token, expires_in, remember } = body
    if (!access_token) {
      return NextResponse.json({ message: 'token required' }, { status: 400 })
    }

    const res = NextResponse.json({ ok: true })
    // Vercel에서는 프로덕션 환경에서 자동으로 HTTPS를 사용
    const secure = process.env.NODE_ENV === 'production'

    // Access token 쿠키 설정
    const accessTokenMaxAge = expires_in || (remember ? 60 * 60 * 24 * 7 : 60 * 60) // 기본 7일 또는 1시간
    res.cookies.set('sb:token', access_token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure,
      maxAge: accessTokenMaxAge,
    })

    // Refresh token 쿠키 설정 (더 긴 만료 시간)
    if (refresh_token) {
      const refreshTokenMaxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7 // 30일 또는 7일
      res.cookies.set('sb:refresh', refresh_token, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure,
        maxAge: refreshTokenMaxAge,
      })
    }

    return res
  } catch (e: unknown) {
    console.error('Session route error:', e)
    const message = e instanceof Error ? e.message : 'bad request'
    return NextResponse.json({ message }, { status: 400 })
  }
}


