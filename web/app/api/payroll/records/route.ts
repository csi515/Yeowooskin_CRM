import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getUserIdFromCookies } from '@/lib/auth/user'
import { PayrollRecordsRepository } from '@/app/lib/repositories/payroll-records.repository'
import { StaffRepository } from '@/app/lib/repositories/staff.repository'

/**
 * GET /api/payroll/records
 * 급여 기록 조회
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
        const month = searchParams.get('month')

        const recordsRepo = new PayrollRecordsRepository(userId, supabase)
        const staffRepo = new StaffRepository(userId, supabase)

        let records

        if (staffId && month) {
            const record = await recordsRepo.findByStaffAndMonth(staffId, month)
            records = record ? [record] : []
        } else if (staffId) {
            records = await recordsRepo.findByStaffId(staffId)
        } else if (month) {
            records = await recordsRepo.findByMonth(month)
        } else {
            records = await recordsRepo.findAll({ limit: 100, orderBy: 'month', ascending: false })
        }

        // 직원 정보와 함께 반환
        const recordsWithStaff = await Promise.all(
            records.map(async (record) => {
                const staff = await staffRepo.findByIdOrNull(record.staff_id)
                return {
                    ...record,
                    staff: staff ? {
                        id: staff.id,
                        name: staff.name,
                        role: staff.role,
                    } : null,
                }
            })
        )

        return NextResponse.json(recordsWithStaff)
    } catch (error) {
        console.error('Error fetching payroll records:', error)
        return NextResponse.json(
            { error: 'Failed to fetch payroll records' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/payroll/records
 * 급여 기록 생성
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient()
        const userId = await getUserIdFromCookies()

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const data = await request.json()
        const { staff_id, month } = data

        if (!staff_id || !month) {
            return NextResponse.json({ error: 'staff_id and month are required' }, { status: 400 })
        }

        const recordsRepo = new PayrollRecordsRepository(userId, supabase)
        const record = await recordsRepo.createRecord(data)

        return NextResponse.json(record, { status: 201 })
    } catch (error) {
        console.error('Error creating payroll record:', error)
        return NextResponse.json(
            { error: 'Failed to create payroll record' },
            { status: 500 }
        )
    }
}

/**
 * PATCH /api/payroll/records
 * 급여 기록 업데이트
 */
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient()
        const userId = await getUserIdFromCookies()

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { staff_id, month, ...data } = await request.json()

        if (!staff_id || !month) {
            return NextResponse.json({ error: 'staff_id and month are required' }, { status: 400 })
        }

        const recordsRepo = new PayrollRecordsRepository(userId, supabase)
        const record = await recordsRepo.upsertByStaffAndMonth(staff_id, month, data)

        return NextResponse.json(record)
    } catch (error) {
        console.error('Error updating payroll record:', error)
        return NextResponse.json(
            { error: 'Failed to update payroll record' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/payroll/records
 *급여 기록 삭제
 */
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient()
        const userId = await getUserIdFromCookies()

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await request.json()

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 })
        }

        const recordsRepo = new PayrollRecordsRepository(userId, supabase)
        await recordsRepo.deleteRecord(id)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting payroll record:', error)
        return NextResponse.json(
            { error: 'Failed to delete payroll record' },
            { status: 500 }
        )
    }
}
