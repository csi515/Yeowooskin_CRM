import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getUserIdFromCookies } from '@/lib/auth/user'
import { ProductsRepository } from '@/app/lib/repositories/products.repository'
import { InventoryTransactionsRepository } from '@/app/lib/repositories/inventory-transactions.repository'
import { InventoryAlertsRepository } from '@/app/lib/repositories/inventory-alerts.repository'

/**
 * GET /api/inventory
 * ?ш퀬 議고쉶 (?ш퀬 遺議??쒗뭹 ?ы븿)
 */
export async function GET(_request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient()
        const userId = await getUserIdFromCookies()

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const productsRepo = new ProductsRepository(userId, supabase)
        const products = await productsRepo.findAll({ limit: 1000 })

        // ?ш퀬 遺議??쒗뭹 媛먯?
        const inventoryStatus = products.map(product => {
            const stockCount = product.stock_count ?? 0
            const safetyStock = product.safety_stock ?? 5

            let status = 'normal'
            if (stockCount === 0) {
                status = 'out_of_stock'
            } else if (stockCount <= safetyStock) {
                status = 'low_stock'
            }

            return {
                ...product,
                inventory_status: status,
                needs_restock: status !== 'normal',
            }
        })

        return NextResponse.json(inventoryStatus)
    } catch (error) {
        console.error('Error fetching inventory:', error)
        return NextResponse.json(
            { error: 'Failed to fetch inventory' },
            { status: 500 }
        )
    }
}

/**
 * PATCH /api/inventory
 * ?ш퀬 ?섎웾 ?낅뜲?댄듃
 */
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient()
        const userId = await getUserIdFromCookies()

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { product_id, quantity, type = 'adjustment', memo } = await request.json()

        if (!product_id) {
            return NextResponse.json({ error: 'product_id is required' }, { status: 400 })
        }

        const productsRepo = new ProductsRepository(userId, supabase)
        const transactionsRepo = new InventoryTransactionsRepository(userId, supabase)
        const alertsRepo = new InventoryAlertsRepository(userId, supabase)

        // ?꾩옱 ?쒗뭹 ?뺣낫 議고쉶
        const product = await productsRepo.findById(product_id)
        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 })
        }

        const beforeCount = product.stock_count ?? 0
        const afterCount = type === 'adjustment'
            ? quantity
            : beforeCount + quantity

        // ?ш퀬 ?낅뜲?댄듃
        await productsRepo.update(product_id, { stock_count: afterCount })

        // ?ш퀬 ?몃옖??뀡 湲곕줉
        await transactionsRepo.createTransaction({
            product_id,
            type: type as 'purchase' | 'sale' | 'adjustment',
            quantity: type === 'adjustment' ? quantity - beforeCount : quantity,
            before_count: beforeCount,
            after_count: afterCount,
            memo,
        })

        // ?ш퀬 ?뚮┝ ?앹꽦 (?ш퀬 遺議???
        const safetyStock = product.safety_stock ?? 5
        if (afterCount <= safetyStock) {
            const alertType = afterCount === 0 ? 'out_of_stock' : 'low_stock'

            // 湲곗〈 誘명솗???뚮┝ ?뺤씤
            const existingAlerts = await alertsRepo.findByProductId(product_id)
            const hasUnacknowledgedAlert = existingAlerts.some(
                alert => !alert.acknowledged && alert.alert_type === alertType
            )

            // 以묐났 ?뚮┝ 諛⑹?
            if (!hasUnacknowledgedAlert) {
                await alertsRepo.createAlert({
                    product_id,
                    alert_type: alertType,
                    acknowledged: false,
                })
            }
        }

        return NextResponse.json({
            success: true,
            before_count: beforeCount,
            after_count: afterCount,
        })
    } catch (error) {
        console.error('Error updating inventory:', error)
        return NextResponse.json(
            { error: 'Failed to update inventory' },
            { status: 500 }
        )
    }
}
