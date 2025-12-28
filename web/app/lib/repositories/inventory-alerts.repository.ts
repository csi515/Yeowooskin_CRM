import { SupabaseClient } from '@supabase/supabase-js'
import { BaseRepository } from './base.repository'
import type {
    InventoryAlert,
    InventoryAlertCreateInput
} from '@/types/entities'

/**
 * 재고 알림 Repository
 */
export class InventoryAlertsRepository extends BaseRepository<InventoryAlert> {
    constructor(userId: string, supabase: SupabaseClient) {
        super(userId, 'inventory_alerts', supabase)
    }

    /**
     * 미확인 알림만 조회
     */
    async findUnacknowledged(): Promise<InventoryAlert[]> {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .eq('owner_id', this.userId)
            .eq('acknowledged', false)
            .order('created_at', { ascending: false })

        if (error) {
            this.handleSupabaseError(error)
        }

        return (data || []) as InventoryAlert[]
    }

    /**
     * 특정 상품의 알림 조회
     */
    async findByProductId(productId: string): Promise<InventoryAlert[]> {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .eq('owner_id', this.userId)
            .eq('product_id', productId)
            .order('created_at', { ascending: false })

        if (error) {
            this.handleSupabaseError(error)
        }

        return (data || []) as InventoryAlert[]
    }

    /**
     * 알림 생성
     */
    async createAlert(input: InventoryAlertCreateInput): Promise<InventoryAlert> {
        const payload = {
            owner_id: this.userId,
            acknowledged: input.acknowledged ?? false,
            ...input
        }

        return this.create(payload as unknown as InventoryAlert)
    }

    /**
     * 알림 확인 처리
     */
    async acknowledgeAlert(id: string): Promise<InventoryAlert> {
        return this.update(id, { acknowledged: true } as Partial<InventoryAlert>)
    }

    /**
     * 모든 알림 확인 처리
     */
    async acknowledgeAll(): Promise<void> {
        const { error } = await this.supabase
            .from(this.tableName)
            .update({ acknowledged: true })
            .eq('owner_id', this.userId)
            .eq('acknowledged', false)

        if (error) {
            this.handleSupabaseError(error)
        }
    }

    /**
     * 알림 삭제
     */
    async deleteAlert(id: string): Promise<void> {
        return this.delete(id)
    }
}
