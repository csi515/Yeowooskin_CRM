import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const res = NextResponse.redirect(new URL('/login', req.url))
  const secure = process.env.NODE_ENV === 'production'
  res.cookies.set('sb:token', '', { path: '/', httpOnly: true, maxAge: 0, sameSite: 'lax', secure })
  res.cookies.set('sb:refresh', '', { path: '/', httpOnly: true, maxAge: 0, sameSite: 'lax', secure })
  res.cookies.set('sb-access-token', '', { path: '/', httpOnly: true, maxAge: 0, sameSite: 'lax', secure })
  return res
}


