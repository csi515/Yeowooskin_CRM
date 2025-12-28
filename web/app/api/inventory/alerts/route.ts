import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getUserIdFromCookies } from '@/lib/auth/user'
import { InventoryAlertsRepository } from '@/app/lib/repositories/inventory-alerts.repository'
import { ProductsRepository } from '@/app/lib/repositories/products.repository'

/**
 * GET /api/inventory/alerts
 * 재고 알림 조회
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient()
        const userId = await getUserIdFromCookies()

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const searchParams = request.nextUrl.searchParams
        const unacknowledged = searchParams.get('unacknowledged') === 'true'
        const productId = searchParams.get('product_id')

        const alertsRepo = new InventoryAlertsRepository(userId, supabase)
        const productsRepo = new ProductsRepository(userId, supabase)

        let alerts

        if (productId) {
            alerts = await alertsRepo.findByProductId(productId)
        } else if (unacknowledged) {
            alerts = await alertsRepo.findUnacknowledged()
        } else {
            alerts = await alertsRepo.findAll({ limit: 100, orderBy: 'created_at', ascending: false })
        }


        // 제품 정보와 함께 반환
        const alertsWithProducts = await Promise.all(
            alerts.map(async (alert) => {
                const product = await productsRepo.findById(alert.product_id)
                return {
                    ...alert,
                    product: product ? {
                        id: product.id,
                        name: product.name,
                        stock_count: product.stock_count,
                        safety_stock: product.safety_stock,
                    } : null,
                }
            })
        )

        return NextResponse.json(alertsWithProducts)
    } catch (error) {
        console.error('Error fetching inventory alerts:', error)
        return NextResponse.json(
            { error: 'Failed to fetch inventory alerts' },
            { status: 500 }
        )
    }
}

/**
 * PATCH /api/inventory/alerts
 * 재고 알림 확인
 */
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient()
        const userId = await getUserIdFromCookies()

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { alert_id, acknowledge_all } = await request.json()

        const alertsRepo = new InventoryAlertsRepository(userId, supabase)

        if (acknowledge_all) {
            await alertsRepo.acknowledgeAll()
        } else if (alert_id) {
            await alertsRepo.acknowledgeAlert(alert_id)
        } else {
            return NextResponse.json(
                { error: 'alert_id or acknowledge_all is required' },
                { status: 400 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error acknowledging inventory alerts:', error)
        return NextResponse.json(
            { error: 'Failed to acknowledge inventory alerts' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/inventory/alerts
 * 재고 알림 삭제
 */
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient()
        const userId = await getUserIdFromCookies()

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await request.json()

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 })
        }

        const alertsRepo = new InventoryAlertsRepository(userId, supabase)
        await alertsRepo.deleteAlert(id)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting inventory alert:', error)
        return NextResponse.json(
            { error: 'Failed to delete inventory alert' },
            { status: 500 }
        )
    }
}
