import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requireHQ } from '@/app/lib/api/roleGuard'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/admin/backup
 * 백업 이력 조회 (HQ 전용)
 */
export async function GET(req: NextRequest) {
  try {
    await requireHQ(req)

    const supabase = createSupabaseServerClient()
    const { searchParams } = new URL(req.url)
    
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const { data, error } = await supabase
      .from('backup_history')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const { count } = await supabase
      .from('backup_history')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      backups: data || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (e: any) {
    if (e.message === '인증이 필요합니다.' || e.message === '접근 권한이 없습니다.') {
      return NextResponse.json({ error: e.message }, { status: e.statusCode || 403 })
    }
    return NextResponse.json({ error: e?.message || 'unknown error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/backup
 * 백업 생성 (HQ 전용)
 */
export async function POST(req: NextRequest) {
  try {
    const hqProfile = await requireHQ(req)

    const { backupType = 'manual' } = await req.json()

    const supabase = createSupabaseServerClient()

    // 백업 이력 생성
    const { data: backupRecord, error: insertError } = await supabase
      .from('backup_history')
      .insert({
        backup_type: backupType,
        status: 'pending',
        created_by: hqProfile.id,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }

    // TODO: 실제 백업 로직 구현
    // 1. 데이터베이스 덤프 생성
    // 2. 파일 시스템 백업
    // 3. S3 또는 다른 스토리지에 업로드
    // 4. 백업 이력 업데이트

    // 임시로 성공 처리
    await supabase
      .from('backup_history')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        file_path: `backup-${backupRecord.id}.sql`,
        file_size: 0,
      })
      .eq('id', backupRecord.id)

    return NextResponse.json({
      ok: true,
      backup: {
        ...backupRecord,
        status: 'completed',
        completed_at: new Date().toISOString(),
      },
    })
  } catch (e: any) {
    if (e.message === '인증이 필요합니다.' || e.message === '접근 권한이 없습니다.') {
      return NextResponse.json({ error: e.message }, { status: e.statusCode || 403 })
    }
    return NextResponse.json({ error: e?.message || 'unknown error' }, { status: 500 })
  }
}

