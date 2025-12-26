import { NextRequest } from 'next/server'
import { withAuth } from '@/app/lib/api/middleware'
import { createSuccessResponse } from '@/app/lib/api/handlers'
import { AttendanceRepository } from '@/app/lib/repositories/attendance.repository'

/**
 * 근태 목록 조회 API
 * staff_id, start, end 파라미터를 통한 필터링 지원
 */
export const GET = withAuth(async (req: NextRequest, { userId, supabase }) => {
    const repo = new AttendanceRepository(userId, supabase)

    // parseQueryParams returns PaginationParams & SearchParams & DateRangeParams
    // where from/to map to start/end logic usually, but here we used 'start'/'end' manually in previous code.
    // However, parseQueryParams schema expects 'from' and 'to'. 
    // Let's check if the URL sends 'start'/'end' or 'from'/'to'. 
    // The user logs show: api/attendance?start=...&end=...
    // But parseQueryParams ONLY parses limit, offset, search, from, to.
    // It DOES NOT parse 'start' and 'end' from searchParams.
    // This is the bug! The params are being ignored.

    // We need to extract start/end manually or update the utility.
    // Since we are fixing this file:
    const { searchParams } = new URL(req.url)
    const start = searchParams.get('start') || undefined
    const end = searchParams.get('end') || undefined
    const staffId = searchParams.get('staff_id') || undefined

    let data
    if (staffId) {
        data = await repo.findByStaffId(staffId, start && end ? { start, end } : undefined)
    } else if (start && end) {
        data = await repo.findByRange(start, end)
    } else {
        data = await repo.findAll()
    }

    return createSuccessResponse(data)
})

/**
 * 근태 기록 생성 API
 */
export const POST = withAuth(async (req: NextRequest, { userId, supabase }) => {
    const body = await req.json()
    const repo = new AttendanceRepository(userId, supabase)

    const data = await repo.createAttendance(body)
    return createSuccessResponse(data, 201)
})
