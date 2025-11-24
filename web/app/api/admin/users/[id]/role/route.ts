import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requireHQ } from '@/app/lib/api/roleGuard'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * PUT /api/admin/users/[id]/role
 * 사용자 역할 변경 (HQ 전용)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const hqProfile = await requireHQ(req)
    const userId = params.id

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const { role, branchId } = await req.json()

    if (!role || !['HQ', 'OWNER', 'STAFF'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const supabase = createSupabaseServerClient()

    // 사용자 정보 조회
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('id, email, name, role, branch_id')
      .eq('id', userId)
      .single()

    if (userError || !userProfile) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 역할 변경 불가능한 경우 체크
    if (userProfile.role === 'HQ' && role !== 'HQ') {
      return NextResponse.json({ error: 'HQ 역할은 변경할 수 없습니다.' }, { status: 400 })
    }

    // 업데이트 데이터 준비
    const updateData: { role: string; branch_id?: string | null } = {
      role,
    }

    // OWNER나 STAFF로 변경 시 branch_id 필요
    if (role === 'OWNER' || role === 'STAFF') {
      if (branchId) {
        // 지점 존재 확인
        const { data: branch, error: branchError } = await supabase
          .from('branches')
          .select('id')
          .eq('id', branchId)
          .single()

        if (branchError || !branch) {
          return NextResponse.json({ error: '지점을 찾을 수 없습니다.' }, { status: 404 })
        }

        updateData.branch_id = branchId
      } else if (userProfile.branch_id) {
        // 기존 branch_id 유지
        updateData.branch_id = userProfile.branch_id
      } else {
        return NextResponse.json({ error: `${role} 역할에는 지점이 필요합니다.` }, { status: 400 })
      }
    } else if (role === 'HQ') {
      updateData.branch_id = null
    }

    // 역할 변경
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    // 감사 로그 기록 (사용 안 함 - 데이터가 너무 많이 쌓임)
    // try {
    //   await supabase
    //     .from('audit_logs')
    //     .insert({
    //       user_id: hqProfile.id,
    //       action: 'role_changed',
    //       resource_type: 'user',
    //       resource_id: userId,
    //       details: {
    //         old_role: userProfile.role,
    //         new_role: role,
    //         old_branch_id: userProfile.branch_id,
    //         new_branch_id: updateData.branch_id,
    //       },
    //     })
    // } catch (auditError) {
    //   console.warn('Failed to record audit log:', auditError)
    // }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    if (e.message === '인증이 필요합니다.' || e.message === '접근 권한이 없습니다.') {
      return NextResponse.json({ error: e.message }, { status: e.statusCode || 403 })
    }
    return NextResponse.json({ error: e?.message || 'unknown error' }, { status: 500 })
  }
}

