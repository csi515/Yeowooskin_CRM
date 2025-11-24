import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { DEFAULT_SETTINGS, type AppSettings, type SettingsUpdateInput } from '@/types/settings'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/settings
 * 설정 조회
 */
export async function GET(_req: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // settings 테이블에서 조회
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
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: SettingsUpdateInput = await req.json()

    // 기존 설정 조회
    const { data: existing } = await supabase
      .from('settings')
      .select('settings')
      .eq('owner_id', user.id)
      .maybeSingle()

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
      systemSettings: {
        ...currentSettings.systemSettings,
        ...body.systemSettings,
      },
    }

    // upsert
    const { error } = await supabase
      .from('settings')
      .upsert({
        owner_id: user.id,
        settings: updatedSettings,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'owner_id',
      })
      .select()
      .single()

    if (error) {
      console.error('Settings update error:', error)
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
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

