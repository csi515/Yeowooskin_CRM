import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { DEFAULT_SETTINGS, type AppSettings, type SettingsUpdateInput } from '@/types/settings'

export const dynamic = 'force-dynamic'

/**
 * GET /api/settings
 * 설정 조회
 */
export async function GET(req: NextRequest) {
  try {
    // 데모 모드 확인
    if (req.cookies.get('demo_mode')?.value === 'true') {
      return NextResponse.json(DEFAULT_SETTINGS)
    }

    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // settings 테이블에서 조회 (owner_id로 명시적 필터링)
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('owner_id', user.id)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Settings fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    // 데이터가 없으면 기본값 반환
    if (!data) {
      return NextResponse.json(DEFAULT_SETTINGS)
    }

    // 추가 보안 검증: owner_id가 현재 사용자와 일치하는지 확인
    if (data.owner_id !== user.id) {
      console.error('Security violation: settings owner_id mismatch', {
        dataOwnerId: data.owner_id,
        currentUserId: user.id
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // JSON 파싱 (settings는 JSONB 컬럼)
    let settings: AppSettings
    try {
      settings = typeof data.settings === 'string'
        ? JSON.parse(data.settings)
        : data.settings
    } catch {
      settings = DEFAULT_SETTINGS
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Settings API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/settings
 * 설정 업데이트
 */
export async function PUT(req: NextRequest) {
  try {
    if (req.cookies.get('demo_mode')?.value === 'true') {
      return NextResponse.json({ error: '데모 모드에서는 설정을 변경할 수 없습니다.' }, { status: 403 })
    }

    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: SettingsUpdateInput = await req.json()

    // 기존 설정 조회 (owner_id로 명시적 필터링)
    const { data: existing, error: fetchError } = await supabase
      .from('settings')
      .select('settings, owner_id')
      .eq('owner_id', user.id)
      .maybeSingle()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Settings fetch error:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    // 추가 보안 검증: owner_id가 현재 사용자와 일치하는지 확인
    if (existing && existing.owner_id !== user.id) {
      console.error('Security violation: settings owner_id mismatch', {
        existingOwnerId: existing.owner_id,
        currentUserId: user.id
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    let currentSettings: AppSettings = DEFAULT_SETTINGS
    if (existing?.settings) {
      try {
        currentSettings = typeof existing.settings === 'string'
          ? JSON.parse(existing.settings)
          : existing.settings
      } catch {
        currentSettings = DEFAULT_SETTINGS
      }
    }

    // 병합
    const updatedSettings: AppSettings = {
      businessProfile: {
        ...currentSettings.businessProfile,
        ...body.businessProfile,
      },
      bookingSettings: {
        ...currentSettings.bookingSettings,
        ...body.bookingSettings,
      },
      financialSettings: {
        ...currentSettings.financialSettings,
        ...body.financialSettings,
      },
      staffSettings: {
        ...currentSettings.staffSettings,
        ...body.staffSettings,
      },
      systemSettings: {
        ...currentSettings.systemSettings,
        ...body.systemSettings,
      },
    }

    // upsert (owner_id는 항상 현재 사용자로 설정)
    const { data: upserted, error } = await supabase
      .from('settings')
      .upsert({
        owner_id: user.id,
        settings: updatedSettings,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'owner_id',
      })
      .select('owner_id')
      .single()

    if (error) {
      console.error('Settings update error:', error)
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }

    // 추가 보안 검증: 저장된 데이터의 owner_id 확인
    if (upserted && upserted.owner_id !== user.id) {
      console.error('Security violation: upserted settings owner_id mismatch', {
        upsertedOwnerId: upserted.owner_id,
        currentUserId: user.id
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json(updatedSettings)
  } catch (error) {
    console.error('Settings API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

