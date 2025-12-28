import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getUserIdFromCookies } from '@/lib/auth/user'
import { InventoryTransactionsRepository } from '@/app/lib/repositories/inventory-transactions.repository'
import { ProductsRepository } from '@/app/lib/repositories/products.repository'

/**
 * GET /api/inventory/transactions
 * 재고 입출고 이력 조회
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient()
        const userId = await getUserIdFromCookies()

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const searchParams = request.nextUrl.searchParams
        const productId = searchParams.get('product_id')

        const transactionsRepo = new InventoryTransactionsRepository(userId, supabase)
        const productsRepo = new ProductsRepository(userId, supabase)

        const transactions = productId
            ? await transactionsRepo.findByProductId(productId)
            : await transactionsRepo.findAll({ limit: 100, orderBy: 'created_at', ascending: false })

        // 제품 정보와 함께 반환
        const transactionsWithProducts = await Promise.all(
            transactions.map(async (transaction) => {
                const product = await productsRepo.findById(transaction.product_id)
                return {
                    ...transaction,
                    product: product ? {
                        id: product.id,
                        name: product.name,
                    } : null,
                }
            })
        )

        return NextResponse.json(transactionsWithProducts)
    } catch (error) {
        console.error('Error fetching inventory transactions:', error)
        return NextResponse.json(
            { error: 'Failed to fetch inventory transactions' },
            { status: 500 }
        )
    }
}
