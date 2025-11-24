import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requireHQ } from '@/app/lib/api/roleGuard'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/approve-user
 * 사용자 승인 (HQ 전용)
 */
export async function POST(req: NextRequest) {
  try {
    // HQ 권한 확인
    const hqProfile = await requireHQ(req)

    const { userId, approved = true } = await req.json()
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const supabase = createSupabaseServerClient()

    // 사용자 정보 조회
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('id, email, name, role')
      .eq('id', userId)
      .single()

    if (userError || !userProfile) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 승인 처리
    const updateData: { approved: boolean; approved_by?: string; approved_at?: string } = {
      approved,
    }

    if (approved) {
      // 승인 시 승인자 정보 추가
      updateData.approved_by = hqProfile.id
      updateData.approved_at = new Date().toISOString()
    } else {
      // 거부 시 승인자 정보 제거
      updateData.approved_by = null
      updateData.approved_at = null
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // 승인 히스토리 기록
    try {
      await supabase
        .from('approval_history')
        .insert({
          user_id: userId,
          approved_by: hqProfile.id,
          approved,
          created_at: new Date().toISOString(),
        })
    } catch (historyError) {
      // 히스토리 기록 실패는 무시 (테이블이 없을 수 있음)
      console.warn('Failed to record approval history:', historyError)
    }

    // 이메일 알림 발송 (비동기, 실패해도 무시)
    try {
      await fetch(`${req.nextUrl.origin}/api/notify-approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email: userProfile.email,
          name: userProfile.name,
          approved,
        }),
      }).catch(() => {
        // 이메일 발송 실패는 무시
      })
    } catch (notifyError) {
      // 이메일 알림 실패는 무시
      console.warn('Failed to send approval notification:', notifyError)
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    if (e.message === '인증이 필요합니다.' || e.message === '접근 권한이 없습니다.') {
      return NextResponse.json({ error: e.message }, { status: e.statusCode || 403 })
    }
    return NextResponse.json({ error: e?.message || 'unknown error' }, { status: 500 })
  }
}
