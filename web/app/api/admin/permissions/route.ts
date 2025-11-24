import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requireHQ } from '@/app/lib/api/roleGuard'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/admin/permissions
 * 권한 목록 조회 (HQ 전용)
 */
export async function GET(req: NextRequest) {
  try {
    await requireHQ(req)

    const supabase = createSupabaseServerClient()
    const { searchParams } = new URL(req.url)
    const role = searchParams.get('role')

    let query = supabase
      .from('permissions')
      .select('*')
      .order('role, resource, action')

    if (role) {
      query = query.eq('role', role)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ permissions: data || [] })
  } catch (e: any) {
    if (e.message === '인증이 필요합니다.' || e.message === '접근 권한이 없습니다.') {
      return NextResponse.json({ error: e.message }, { status: e.statusCode || 403 })
    }
    return NextResponse.json({ error: e?.message || 'unknown error' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/permissions
 * 권한 업데이트 (HQ 전용)
 */
export async function PUT(req: NextRequest) {
  try {
    await requireHQ(req)

    const { role, resource, action, granted } = await req.json()

    if (!role || !resource || !action || typeof granted !== 'boolean') {
      return NextResponse.json({ error: 'role, resource, action, granted are required' }, { status: 400 })
    }

    const supabase = createSupabaseServerClient()

    const { data, error } = await supabase
      .from('permissions')
      .upsert({
        role,
        resource,
        action,
        granted,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'role,resource,action',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ permission: data })
  } catch (e: any) {
    if (e.message === '인증이 필요합니다.' || e.message === '접근 권한이 없습니다.') {
      return NextResponse.json({ error: e.message }, { status: e.statusCode || 403 })
    }
    return NextResponse.json({ error: e?.message || 'unknown error' }, { status: 500 })
  }
}

