import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getUserIdFromCookies } from '@/lib/auth/user'
import { ProductsRepository } from '@/app/lib/repositories/products.repository'
import { InventoryTransactionsRepository } from '@/app/lib/repositories/inventory-transactions.repository'
import { InventoryAlertsRepository } from '@/app/lib/repositories/inventory-alerts.repository'

/**
 * GET /api/inventory
 * 재고 조회 (재고 부족 제품 포함)
 * Query params: page, limit, search, status, sort_by, sort_order, min_price, max_price, min_stock, max_stock
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient()
        const userId = await getUserIdFromCookies()

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Extract query parameters
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '25')
        const search = searchParams.get('search') || ''
        const status = searchParams.get('status') || '' // 'normal', 'low_stock', 'out_of_stock'
        const sortBy = searchParams.get('sort_by') || 'name' // 'name', 'stock_count', 'price', 'updated_at'
        const sortOrder = searchParams.get('sort_order') || 'asc' // 'asc', 'desc'
        const minPrice = searchParams.get('min_price') ? parseFloat(searchParams.get('min_price')!) : null
        const maxPrice = searchParams.get('max_price') ? parseFloat(searchParams.get('max_price')!) : null
        const minStock = searchParams.get('min_stock') ? parseInt(searchParams.get('min_stock')!) : null
        const maxStock = searchParams.get('max_stock') ? parseInt(searchParams.get('max_stock')!) : null

        const productsRepo = new ProductsRepository(userId, supabase)

        // Fetch all products first (we'll filter and paginate in memory for now)
        const allProducts = await productsRepo.findAll({ limit: 10000 })

        // Calculate inventory status for all products
        let inventoryData = allProducts.map(product => {
            const stockCount = product.stock_count ?? 0
            const safetyStock = product.safety_stock ?? 5

            let inventoryStatus = 'normal'
            if (stockCount === 0) {
                inventoryStatus = 'out_of_stock'
            } else if (stockCount <= safetyStock) {
                inventoryStatus = 'low_stock'
            }

            return {
                ...product,
                inventory_status: inventoryStatus,
                needs_restock: inventoryStatus !== 'normal',
            }
        })

        // Apply search filter
        if (search) {
            const searchLower = search.toLowerCase()
            inventoryData = inventoryData.filter(product =>
                product.name?.toLowerCase().includes(searchLower)
            )
        }

        // Apply status filter
        if (status) {
            inventoryData = inventoryData.filter(product => product.inventory_status === status)
        }

        // Apply price range filter
        if (minPrice !== null) {
            inventoryData = inventoryData.filter(product => (product.price ?? 0) >= minPrice)
        }
        if (maxPrice !== null) {
            inventoryData = inventoryData.filter(product => (product.price ?? 0) <= maxPrice)
        }

        // Apply stock range filter
        if (minStock !== null) {
            inventoryData = inventoryData.filter(product => (product.stock_count ?? 0) >= minStock)
        }
        if (maxStock !== null) {
            inventoryData = inventoryData.filter(product => (product.stock_count ?? 0) <= maxStock)
        }

        // Apply sorting
        inventoryData.sort((a, b) => {
            let aVal: any = a[sortBy as keyof typeof a]
            let bVal: any = b[sortBy as keyof typeof b]

            // Handle null/undefined values
            if (aVal === null || aVal === undefined) aVal = ''
            if (bVal === null || bVal === undefined) bVal = ''

            // String comparison for name, number comparison for others
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return sortOrder === 'asc'
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal)
            } else {
                return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
            }
        })

        // Calculate pagination
        const total = inventoryData.length
        const totalPages = Math.ceil(total / limit)
        const offset = (page - 1) * limit
        const paginatedData = inventoryData.slice(offset, offset + limit)

        return NextResponse.json({
            data: paginatedData,
            pagination: {
                total,
                page,
                limit,
                total_pages: totalPages,
            }
        })
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
