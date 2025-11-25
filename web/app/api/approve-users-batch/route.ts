import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requireHQ } from '@/app/lib/api/roleGuard'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/approve-users-batch
 * 일괄 승인/거절 (HQ 전용)
 */
export async function POST(req: NextRequest) {
  try {
    // HQ 권한 확인
    const hqProfile = await requireHQ(req)

    const { userIds, approved } = await req.json()
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'userIds array is required' }, { status: 400 })
    }

    if (typeof approved !== 'boolean') {
      return NextResponse.json({ error: 'approved boolean is required' }, { status: 400 })
    }

    const supabase = createSupabaseServerClient()

    // 사용자 정보 조회
    const { data: userProfiles, error: userError } = await supabase
      .from('profiles')
      .select('id, email, name, role')
      .in('id', userIds)

    if (userError) {
      return NextResponse.json({ error: '사용자 조회 실패' }, { status: 400 })
    }

    // 승인 처리
    const updateData: { approved: boolean; approved_by?: string; approved_at?: string } = {
      approved,
    }

    if (approved) {
      updateData.approved_by = hqProfile.id
      updateData.approved_at = new Date().toISOString()
    } else {
      updateData.approved_by = null
      updateData.approved_at = null
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .in('id', userIds)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    // 승인 히스토리 기록
    if (userProfiles && userProfiles.length > 0) {
      const historyRecords = userProfiles.map(profile => ({
        user_id: profile.id,
        approved_by: hqProfile.id,
        approved,
        created_at: new Date().toISOString(),
      }))

      try {
        await supabase
          .from('approval_history')
          .insert(historyRecords)
      } catch (historyError) {
        // 히스토리 기록 실패는 무시
        console.warn('Failed to record approval history:', historyError)
      }
    }

    // 이메일 알림 발송 (비동기)
    if (userProfiles && userProfiles.length > 0) {
      userProfiles.forEach(profile => {
        fetch(`${req.nextUrl.origin}/api/notify-approval`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: profile.id,
            email: profile.email,
            name: profile.name,
            approved,
          }),
        }).catch(() => {
          // 이메일 발송 실패는 무시
        })
      })
    }

    return NextResponse.json({ 
      ok: true, 
      count: userProfiles?.length || 0 
    })
    } catch (e: unknown) {
    if (e.message === '인증이 필요합니다.' || e.message === '접근 권한이 없습니다.') {
      return NextResponse.json({ error: e.message }, { status: e.statusCode || 403 })
    }
    return NextResponse.json({ error: e?.message || 'unknown error' }, { status: 500 })
  }
}

