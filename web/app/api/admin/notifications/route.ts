import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requireHQ } from '@/app/lib/api/roleGuard'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/admin/notifications
 * 알림 설정 조회 (HQ 전용)
 */
export async function GET(req: NextRequest) {
  try {
    await requireHQ(req)

    const supabase = createSupabaseServerClient()
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    let query = supabase
      .from('notification_settings')
      .select('*')
      .order('created_at', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ settings: data || [] })
  } catch (e: any) {
    if (e.message === '인증이 필요합니다.' || e.message === '접근 권한이 없습니다.') {
      return NextResponse.json({ error: e.message }, { status: e.statusCode || 403 })
    }
    return NextResponse.json({ error: e?.message || 'unknown error' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/notifications
 * 알림 설정 업데이트 (HQ 전용)
 */
export async function PUT(req: NextRequest) {
  try {
    await requireHQ(req)

    const { userId, notificationType, enabled, channel } = await req.json()

    if (!userId || !notificationType) {
      return NextResponse.json({ error: 'userId and notificationType are required' }, { status: 400 })
    }

    const supabase = createSupabaseServerClient()

    const { data, error } = await supabase
      .from('notification_settings')
      .upsert({
        user_id: userId,
        notification_type: notificationType,
        enabled: enabled !== undefined ? enabled : true,
        channel: channel || 'email',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,notification_type',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ setting: data })
  } catch (e: any) {
    if (e.message === '인증이 필요합니다.' || e.message === '접근 권한이 없습니다.') {
      return NextResponse.json({ error: e.message }, { status: e.statusCode || 403 })
    }
    return NextResponse.json({ error: e?.message || 'unknown error' }, { status: 500 })
  }
}

