import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/notify-approval
 * 승인/거절 알림 이메일 발송
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, email, name, approved } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 })
    }

    const supabase = createSupabaseServerClient()

    // TODO: 실제 이메일 발송 로직 구현
    // 현재는 Supabase의 이메일 기능을 사용하거나 외부 이메일 서비스를 연동해야 함
    // 예: Resend, SendGrid, AWS SES 등

    // 임시로 로그만 남김
    // eslint-disable-next-line no-console
    console.log('Approval notification:', {
      userId,
      email,
      name,
      approved,
      timestamp: new Date().toISOString(),
    })

    // Supabase의 이메일 기능을 사용하려면:
    // 1. Supabase Edge Function 생성
    // 2. 또는 외부 이메일 서비스 API 호출

    return NextResponse.json({ ok: true, message: 'Notification queued' })
  } catch (e: any) {
    console.error('Notification error:', e)
    return NextResponse.json({ error: e?.message || 'unknown error' }, { status: 500 })
  }
}

