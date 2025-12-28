import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getUserIdFromCookies } from '@/lib/auth/user'
import { PayrollSettingsRepository } from '@/app/lib/repositories/payroll-settings.repository'
import { PayrollRecordsRepository } from '@/app/lib/repositories/payroll-records.repository'
import { AttendanceRepository } from '@/app/lib/repositories/attendance.repository'
import { StaffRepository } from '@/app/lib/repositories/staff.repository'
import { startOfMonth, endOfMonth, differenceInHours } from 'date-fns'

/**
 * POST /api/payroll/calculate
 * 급여 자동 계산
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient()
        const userId = await getUserIdFromCookies()

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { staff_id, month } = await request.json()

        if (!staff_id || !month) {
            return NextResponse.json(
                { error: 'staff_id and month are required' },
                { status: 400 }
            )
        }

        const settingsRepo = new PayrollSettingsRepository(userId, supabase)
        const recordsRepo = new PayrollRecordsRepository(userId, supabase)
        const attendanceRepo = new AttendanceRepository(userId, supabase)
        const staffRepo = new StaffRepository(userId, supabase)

        // 1. 직원 정보 조회
        const staff = await staffRepo.findById(staff_id)
        if (!staff) {
            return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
        }

        // 2. 급여 설정 조회
        const settings = await settingsRepo.findByStaffId(staff_id)

        // 기본값 설정
        const monthlyBaseSalary = settings?.base_salary || 0
        const hourlyRate = settings?.hourly_rate || 0
        const overtimeMultiplier = 1.5 // 고정값
        const incentiveRate = staff.incentive_rate || 0

        // 3. 해당 월의 근무 시간 조회
        const monthStart = startOfMonth(new Date(month))
        const monthEnd = endOfMonth(new Date(month))

        const allAttendance = await attendanceRepo.findAll({
            limit: 1000,
        })

        // 해당 직원 및 월의 근무 기록 필터링 (start_time 사용)
        const attendanceRecords = allAttendance.filter(record => {
            if (record.staff_id !== staff_id) return false
            if (!record.start_time) return false

            const recordDate = new Date(record.start_time)
            return recordDate >= monthStart && recordDate <= monthEnd
        })

        // 4. 총 근무 시간 계산
        let totalWorkHours = 0
        for (const record of attendanceRecords) {
            if (record.start_time && record.end_time) {
                const hours = differenceInHours(
                    new Date(record.end_time),
                    new Date(record.start_time)
                )
                totalWorkHours += hours
            }
        }

        // 5. 기본급 계산
        const baseSalary = monthlyBaseSalary || 0

        // 6. 시급 계산 (월급이 없을 경우)
        const hourlyPay = monthlyBaseSalary === 0 ? totalWorkHours * hourlyRate : 0

        // 7. 연장 근무 수당 (주 40시간 초과 시, 간단한 계산)
        const standardWeeklyHours = 160 // 월 기준 160시간
        const overtimeHours = Math.max(0, totalWorkHours - standardWeeklyHours)
        const overtimePay = overtimeHours * hourlyRate * overtimeMultiplier

        // 8. 인센티브 계산 (해당 월 거래액 기준) - 간소화
        const totalSales = 0 // 거래 데이터 미사용
        const incentivePay = totalSales * (incentiveRate / 100)

        // 9. 총 지급액
        const totalGross = baseSalary + hourlyPay + overtimePay + incentivePay

        // 10. 공제액 계산 (settings에서 가져오기)
        const nationalPension = totalGross * (settings?.national_pension_rate || 0.045)
        const healthInsurance = totalGross * (settings?.health_insurance_rate || 0.03495)
        const employmentInsurance = totalGross * (settings?.employment_insurance_rate || 0.009)
        const incomeTax = totalGross * (settings?.income_tax_rate || 0.05)

        const totalDeductions =
            nationalPension + healthInsurance + employmentInsurance + incomeTax

        // 11. 실지급액
        const netSalary = totalGross - totalDeductions

        // 12. 급여 기록 생성 또는 업데이트
        const payrollRecord = {
            staff_id,
            month,
            base_salary: baseSalary,
            overtime_pay: hourlyPay + overtimePay,
            incentive_pay: incentivePay,
            total_gross: totalGross,
            national_pension: nationalPension,
            health_insurance: healthInsurance,
            employment_insurance: employmentInsurance,
            income_tax: incomeTax,
            total_deductions: totalDeductions,
            net_salary: netSalary,
            memo: `자동 계산 - 근무시간: ${totalWorkHours}h`,
        }

        const savedRecord = await recordsRepo.upsertByStaffAndMonth(
            staff_id,
            month,
            payrollRecord
        )

        return NextResponse.json({
            success: true,
            payroll_record: savedRecord,
            calculation_details: {
                total_work_hours: totalWorkHours,
                base_salary: baseSalary,
                hourly_pay: hourlyPay,
                overtime_pay: overtimePay,
                incentive_pay: incentivePay,
                total_gross: totalGross,
                deductions: {
                    national_pension: nationalPension,
                    health_insurance: healthInsurance,
                    employment_insurance: employmentInsurance,
                    income_tax: incomeTax,
                },
                total_deductions: totalDeductions,
                net_salary: netSalary,
            },
        })
    } catch (error) {
        console.error('Error calculating payroll:', error)
        return NextResponse.json(
            { error: 'Failed to calculate payroll' },
            { status: 500 }
        )
    }
}
