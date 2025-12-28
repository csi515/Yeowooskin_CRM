import { SupabaseClient } from '@supabase/supabase-js'
import { BaseRepository } from './base.repository'
import type {
    PayrollSettings,
    PayrollSettingsCreateInput,
    PayrollSettingsUpdateInput
} from '@/types/entities'

/**
 * 급여 설정 Repository
 */
export class PayrollSettingsRepository extends BaseRepository<PayrollSettings> {
    constructor(userId: string, supabase: SupabaseClient) {
        super(userId, 'payroll_settings', supabase)
    }

    /**
     * 직원별 급여 설정 조회
     */
    async findByStaffId(staffId: string): Promise<PayrollSettings | null> {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .eq('owner_id', this.userId)
            .eq('staff_id', staffId)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                // No rows returned
                return null
            }
            this.handleSupabaseError(error)
        }

        return data as PayrollSettings
    }

    /**
     * 급여 설정 생성
     */
    async createSettings(input: PayrollSettingsCreateInput): Promise<PayrollSettings> {
        const payload = {
            owner_id: this.userId,
            base_salary: input.base_salary ?? 0,
            hourly_rate: input.hourly_rate ?? 0,
            national_pension_rate: input.national_pension_rate ?? 4.5,
            health_insurance_rate: input.health_insurance_rate ?? 3.545,
            employment_insurance_rate: input.employment_insurance_rate ?? 0.9,
            income_tax_rate: input.income_tax_rate ?? 3.3,
            ...input
        }

        return this.create(payload as unknown as PayrollSettings)
    }

    /**
     * 급여 설정 업데이트
     */
    async updateSettings(id: string, input: PayrollSettingsUpdateInput): Promise<PayrollSettings> {
        return this.update(id, input as Partial<PayrollSettings>)
    }

    /**
     * 직원 급여 설정 Upsert (생성 또는 업데이트)
     */
    async upsertByStaffId(staffId: string, input: Partial<PayrollSettingsCreateInput>): Promise<PayrollSettings> {
        const existing = await this.findByStaffId(staffId)

        if (existing) {
            return this.updateSettings(existing.id, input)
        } else {
            return this.createSettings({ staff_id: staffId, ...input })
        }
    }

    /**
     * 급여 설정 삭제
     */
    async deleteSettings(id: string): Promise<void> {
        return this.delete(id)
    }
}
