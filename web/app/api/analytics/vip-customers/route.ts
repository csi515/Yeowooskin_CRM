import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getUserIdFromCookies } from '@/lib/auth/user'
import { CustomersRepository } from '@/app/lib/repositories/customers.repository'
import { TransactionsRepository } from '@/app/lib/repositories/transactions.repository'

/**
 * GET /api/analytics/vip-customers
 * VIP 고객 분석 (거래 횟수 및 총 구매액 기준)
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient()
        const userId = await getUserIdFromCookies()

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const searchParams = request.nextUrl.searchParams
        const minTransactionCount = parseInt(searchParams.get('min_transactions') || '5')
        const minRevenue = parseInt(searchParams.get('min_revenue') || '500000')

        const customersRepo = new CustomersRepository(userId, supabase)
        const transactionsRepo = new TransactionsRepository(userId, supabase)

        // 모든 고객 및 거래 조회
        const customers = await customersRepo.findAll({ limit: 1000 })
        const allTransactions = await transactionsRepo.findAll({ limit: 10000 })

        // 각 고객별 거래 내역 분석
        const customerStats = customers.map((customer) => {
            const transactions = allTransactions.filter(t => t.customer_id === customer.id)

            const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0)
            const transactionCount = transactions.length

            return {
                customer_id: customer.id,
                customer_name: customer.name,
                customer_phone: customer.phone,
                customer_email: customer.email,
                total_revenue: totalRevenue,
                transaction_count: transactionCount,
            }
        })

        // VIP 기준에 부합하는 고객 필터링
        const vipCustomers = customerStats
            .filter(
                (stats) =>
                    stats.transaction_count >= minTransactionCount &&
                    stats.total_revenue >= minRevenue
            )
            .sort((a, b) => b.total_revenue - a.total_revenue)

        // VIP 고객 통계
        const totalVIPRevenue = vipCustomers.reduce((sum, c) => sum + c.total_revenue, 0)
        const avgVIPRevenue = vipCustomers.length > 0 ? totalVIPRevenue / vipCustomers.length : 0

        return NextResponse.json({
            vip_customers: vipCustomers,
            statistics: {
                total_vip_count: vipCustomers.length,
                total_vip_revenue: totalVIPRevenue,
                avg_vip_revenue: avgVIPRevenue,
                criteria: {
                    min_transactions: minTransactionCount,
                    min_revenue: minRevenue,
                },
            },
        })
    } catch (error) {
        console.error('Error analyzing VIP customers:', error)
        return NextResponse.json(
            { error: 'Failed to analyze VIP customers' },
            { status: 500 }
        )
    }
}
