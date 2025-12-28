import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 로그인/인증, 정적 자원, API는 공개로 통과
  const publicPaths = [
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/update-password',
    '/api',
    '/_next',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/manifest.json',
    '/service-worker.js',
    '/icons'
  ]
  if (publicPaths.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next()
  }

  // Supabase 세션 쿠키(여러 키 후보)를 확인
  const hasSession = Boolean(
    req.cookies.get('sb-access-token') ||
    req.cookies.get('sb:token') ||
    req.cookies.get('sb:client:session') ||
    req.cookies.get('demo_mode')?.value === 'true'
  )

  // 1. 이미 로그인한 사용자가 루트('/') 접근 시 대시보드로 이동 - 사용자 요청으로 비활성화
  // if (hasSession && pathname === '/') {
  //   return NextResponse.redirect(new URL('/dashboard', req.url))
  // }

  // 2. 로그인하지 않은 사용자는 루트('/') 접근 허용 (랜딩 페이지)
  if (!hasSession && pathname === '/') {
    return NextResponse.next()
  }

  // 3. 그 외 보호된 경로는 로그인 필요
  if (!hasSession) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/(.*)']
}
