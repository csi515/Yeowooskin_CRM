/**
 * 급여 관리 관련 타입 정의
 */

export interface Staff {
    id: string
    name: string
    role?: string | null
}

export interface PayrollRecord {
    id: string
    owner_id: string
    staff_id: string
    month: string
    base_salary: number
    overtime_pay: number
    incentive_pay: number
    total_gross: number
    national_pension: number
    health_insurance: number
    employment_insurance: number
    income_tax: number
    total_deductions: number
    net_salary: number
    memo?: string | null
    status?: 'draft' | 'calculated' | 'approved' | 'paid'
    staff?: {
        id: string
        name: string
        role?: string | null
    } | null
    // Index signature to satisfy Record<string, unknown>
    [key: string]: unknown;
    // Convenience field for sorting by staff name
    staff_name?: string;
}

export interface PayrollCalculationResult {
    calculation_details?: {
        total_work_hours?: number
        base_salary?: number
        hourly_pay?: number
        incentive_pay?: number
        total_gross?: number
        net_salary?: number
        deductions?: {
            national_pension?: number
            health_insurance?: number
            employment_insurance?: number
            income_tax?: number
        }
    }
}
