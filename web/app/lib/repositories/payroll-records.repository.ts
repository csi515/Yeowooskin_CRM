import { SupabaseClient } from '@supabase/supabase-js'
import { BaseRepository } from './base.repository'
import type {
    PayrollRecord,
    PayrollRecordCreateInput,
    PayrollRecordUpdateInput
} from '@/types/entities'

/**
 * 급여 기록 Repository
 */
export class PayrollRecordsRepository extends BaseRepository<PayrollRecord> {
    constructor(userId: string, supabase: SupabaseClient) {
        super(userId, 'payroll_records', supabase)
    }

    /**
     * 직원별 급여 기록 조회
     */
    async findByStaffId(staffId: string, limit = 12): Promise<PayrollRecord[]> {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .eq('owner_id', this.userId)
            .eq('staff_id', staffId)
            .order('month', { ascending: false })
            .limit(limit)

        if (error) {
            this.handleSupabaseError(error)
        }

        return (data || []) as PayrollRecord[]
    }

    /**
     * 특정 월의 급여 기록 조회
     */
    async findByMonth(month: string): Promise<PayrollRecord[]> {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .eq('owner_id', this.userId)
            .eq('month', month)
            .order('created_at', { ascending: false })

        if (error) {
            this.handleSupabaseError(error)
        }

        return (data || []) as PayrollRecord[]
    }

    /**
     * 특정 직원의 특정 월 급여 기록 조회
     */
    async findByStaffAndMonth(staffId: string, month: string): Promise<PayrollRecord | null> {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .eq('owner_id', this.userId)
            .eq('staff_id', staffId)
            .eq('month', month)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                return null
            }
            this.handleSupabaseError(error)
        }

        return data as PayrollRecord
    }

    /**
     * 급여 기록 생성
     */
    async createRecord(input: PayrollRecordCreateInput): Promise<PayrollRecord> {
        const payload = {
            owner_id: this.userId,
            base_salary: input.base_salary ?? 0,
            overtime_pay: input.overtime_pay ?? 0,
            incentive_pay: input.incentive_pay ?? 0,
            total_gross: input.total_gross ?? 0,
            national_pension: input.national_pension ?? 0,
            health_insurance: input.health_insurance ?? 0,
            employment_insurance: input.employment_insurance ?? 0,
            income_tax: input.income_tax ?? 0,
            total_deductions: input.total_deductions ?? 0,
            net_salary: input.net_salary ?? 0,
            ...input
        }

        return this.create(payload as unknown as PayrollRecord)
    }

    /**
     * 급여 기록 업데이트
     */
    async updateRecord(id: string, input: PayrollRecordUpdateInput): Promise<PayrollRecord> {
        return this.update(id, input as Partial<PayrollRecord>)
    }

    /**
     * 급여 기록 Upsert (생성 또는 업데이트)
     */
    async upsertByStaffAndMonth(
        staffId: string,
        month: string,
        input: Partial<PayrollRecordCreateInput>
    ): Promise<PayrollRecord> {
        const existing = await this.findByStaffAndMonth(staffId, month)

        if (existing) {
            return this.updateRecord(existing.id, input)
        } else {
            return this.createRecord({ staff_id: staffId, month, ...input })
        }
    }

    /**
     * 급여 기록 삭제
     */
    async deleteRecord(id: string): Promise<void> {
        return this.delete(id)
    }
}
