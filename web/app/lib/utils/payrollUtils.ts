import { type PayrollRecord } from '@/types/payroll'

/**
 * 급여 데이터를 CSV로 내보내기 위한 데이터 준비
 */
export function preparePayrollDataForExport(records: PayrollRecord[]) {
    return records.map(record => ({
        직원명: record.staff?.name || 'N/A',
        월: record.month,
        기본급: record.base_salary,
        연장근무수당: record.overtime_pay,
        인센티브: record.incentive_pay,
        총지급액: record.total_gross,
        국민연금: record.national_pension,
        건강보험: record.health_insurance,
        고용보험: record.employment_insurance,
        소득세: record.income_tax,
        총공제액: record.total_deductions,
        실지급액: record.net_salary,
        상태: record.status === 'paid' ? '지급완료' :
              record.status === 'approved' ? '승인완료' :
              record.status === 'calculated' ? '계산완료' :
              '미계산',
        메모: record.memo || ''
    }))
}

/**
 * 급여 계산 결과 포맷팅
 */
export function formatPayrollCalculation(result: any) {
    return {
        totalWorkHours: result.calculation_details?.total_work_hours || 0,
        baseSalary: result.calculation_details?.base_salary || 0,
        hourlyPay: result.calculation_details?.hourly_pay || 0,
        incentivePay: result.calculation_details?.incentive_pay || 0,
        totalGross: result.calculation_details?.total_gross || 0,
        deductions: {
            nationalPension: result.calculation_details?.deductions?.national_pension || 0,
            healthInsurance: result.calculation_details?.deductions?.health_insurance || 0,
            employmentInsurance: result.calculation_details?.deductions?.employment_insurance || 0,
            incomeTax: result.calculation_details?.deductions?.income_tax || 0,
        },
        netSalary: result.calculation_details?.net_salary || 0,
    }
}

/**
 * 급여 상태별 색상 반환
 */
export function getStatusColor(status?: string) {
    switch (status) {
        case 'paid': return 'success'
        case 'approved': return 'info'
        case 'calculated': return 'warning'
        default: return 'default'
    }
}

/**
 * 급여 상태별 라벨 반환
 */
export function getStatusLabel(status?: string) {
    switch (status) {
        case 'paid': return '지급완료'
        case 'approved': return '승인완료'
        case 'calculated': return '계산완료'
        default: return '미계산'
    }
}
