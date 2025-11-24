import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requireHQ } from '@/app/lib/api/roleGuard'
import { createHash } from 'crypto'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/admin/api-keys
 * API 키 목록 조회 (HQ 전용)
 */
export async function GET(req: NextRequest) {
  try {
    await requireHQ(req)

    const supabase = createSupabaseServerClient()

    const { data, error } = await supabase
      .from('api_keys')
      .select('id, name, created_by, permissions, last_used_at, expires_at, is_active, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ keys: data || [] })
  } catch (e: any) {
    if (e.message === '인증이 필요합니다.' || e.message === '접근 권한이 없습니다.') {
      return NextResponse.json({ error: e.message }, { status: e.statusCode || 403 })
    }
    return NextResponse.json({ error: e?.message || 'unknown error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/api-keys
 * API 키 생성 (HQ 전용)
 */
export async function POST(req: NextRequest) {
  try {
    const hqProfile = await requireHQ(req)

    const { name, permissions = [], expiresAt } = await req.json()

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    // API 키 생성 (실제 키는 한 번만 보여줌)
    const apiKey = `sk_${Date.now()}_${Math.random().toString(36).substr(2, 32)}`
    const keyHash = createHash('sha256').update(apiKey).digest('hex')

    const supabase = createSupabaseServerClient()

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        name,
        key_hash: keyHash,
        created_by: hqProfile.id,
        permissions: Array.isArray(permissions) ? permissions : [],
        expires_at: expiresAt || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // 실제 키는 이번에만 반환
    return NextResponse.json({
      key: {
        ...data,
        api_key: apiKey, // 이번에만 포함
      },
      message: 'API 키를 안전한 곳에 저장하세요. 다시 확인할 수 없습니다.',
    })
  } catch (e: any) {
    if (e.message === '인증이 필요합니다.' || e.message === '접근 권한이 없습니다.') {
      return NextResponse.json({ error: e.message }, { status: e.statusCode || 403 })
    }
    return NextResponse.json({ error: e?.message || 'unknown error' }, { status: 500 })
  }
}


