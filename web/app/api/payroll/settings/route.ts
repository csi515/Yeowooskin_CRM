import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getUserIdFromCookies } from '@/lib/auth/user'
import { PayrollSettingsRepository } from '@/app/lib/repositories/payroll-settings.repository'

/**
 * GET /api/payroll/settings
 * 급여 설정 조회
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient()
        const userId = await getUserIdFromCookies()

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const searchParams = request.nextUrl.searchParams
        const staffId = searchParams.get('staff_id')

        const settingsRepo = new PayrollSettingsRepository(userId, supabase)

        if (staffId) {
            const settings = await settingsRepo.findByStaffId(staffId)
            return NextResponse.json(settings)
        }

        const allSettings = await settingsRepo.findAll({ limit: 100 })
        return NextResponse.json(allSettings)
    } catch (error) {
        console.error('Error fetching payroll settings:', error)
        return NextResponse.json(
            { error: 'Failed to fetch payroll settings' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/payroll/settings
 * 급여 설정 생성
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient()
        const userId = await getUserIdFromCookies()

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const data = await request.json()
        const { staff_id } = data

        if (!staff_id) {
            return NextResponse.json({ error: 'staff_id is required' }, { status: 400 })
        }

        const settingsRepo = new PayrollSettingsRepository(userId, supabase)
        const settings = await settingsRepo.createSettings(data)

        return NextResponse.json(settings, { status: 201 })
    } catch (error) {
        console.error('Error creating payroll settings:', error)
        return NextResponse.json(
            { error: 'Failed to create payroll settings' },
            { status: 500 }
        )
    }
}

/**
 * PATCH /api/payroll/settings
 * 급여 설정 업데이트
 */
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient()
        const userId = await getUserIdFromCookies()

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { staff_id, ...data } = await request.json()

        if (!staff_id) {
            return NextResponse.json({ error: 'staff_id is required' }, { status: 400 })
        }

        const settingsRepo = new PayrollSettingsRepository(userId, supabase)
        const settings = await settingsRepo.upsertByStaffId(staff_id, data)

        return NextResponse.json(settings)
    } catch (error) {
        console.error('Error updating payroll settings:', error)
        return NextResponse.json(
            { error: 'Failed to update payroll settings' },
            { status: 500 }
        )
    }
}
