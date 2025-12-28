import { SupabaseClient } from '@supabase/supabase-js'
import { BaseRepository } from './base.repository'
import type {
    InventoryTransaction,
    InventoryTransactionCreateInput,
    InventoryTransactionUpdateInput
} from '@/types/entities'

/**
 * 재고 트랜잭션 Repository
 */
export class InventoryTransactionsRepository extends BaseRepository<InventoryTransaction> {
    constructor(userId: string, supabase: SupabaseClient) {
        super(userId, 'inventory_transactions', supabase)
    }

    /**
     * 특정 상품의 재고 트랜잭션 조회
     */
    async findByProductId(productId: string, limit = 50): Promise<InventoryTransaction[]> {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .eq('owner_id', this.userId)
            .eq('product_id', productId)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) {
            this.handleSupabaseError(error)
        }

        return (data || []) as InventoryTransaction[]
    }

    /**
     * 재고 트랜잭션 생성
     */
    async createTransaction(input: InventoryTransactionCreateInput): Promise<InventoryTransaction> {
        const payload = {
            owner_id: this.userId,
            ...input
        }

        return this.create(payload as unknown as InventoryTransaction)
    }

    /**
     * 재고 트랜잭션 업데이트
     */
    async updateTransaction(id: string, input: InventoryTransactionUpdateInput): Promise<InventoryTransaction> {
        return this.update(id, input as Partial<InventoryTransaction>)
    }

    /**
     * 재고 트랜잭션 삭제
     */
    async deleteTransaction(id: string): Promise<void> {
        return this.delete(id)
    }
}
