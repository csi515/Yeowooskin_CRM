import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl

  // 루트 경로에 code 파라미터가 있으면 비밀번호 재설정 페이지로 리다이렉트
  // Supabase 비밀번호 재설정 링크가 루트로 오는 경우 처리
  if (pathname === '/' && searchParams.has('code')) {
    const url = req.nextUrl.clone()
    url.pathname = '/update-password'
    // searchParams는 자동으로 복사되므로 별도 작업 불필요
    return NextResponse.redirect(url)
  }

  // 로그인/인증, 정적 자원, API는 공개로 통과
  const publicPaths = [
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/update-password',
    '/pending-approval', // 승인 대기 페이지
    '/403', // 권한 없음 페이지
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
    req.cookies.get('sb:client:session')
  )

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
