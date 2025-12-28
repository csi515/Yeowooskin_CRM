import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getUserIdFromCookies } from '@/lib/auth/user'
import { CustomersRepository } from '@/app/lib/repositories/customers.repository'
import { TransactionsRepository } from '@/app/lib/repositories/transactions.repository'
import { AppointmentsRepository } from '@/app/lib/repositories/appointments.repository'

/**
 * GET /api/analytics/customer-ltv
 * 怨좉컼 ?앹븷 媛移?LTV) 遺꾩꽍
 */
export async function GET(_request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient()
        const userId = await getUserIdFromCookies()

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const customersRepo = new CustomersRepository(userId, supabase)
        const transactionsRepo = new TransactionsRepository(userId, supabase)
        const appointmentsRepo = new AppointmentsRepository(userId, supabase)

        // 紐⑤뱺 怨좉컼, 嫄곕옒, ?덉빟 議고쉶
        const customers = await customersRepo.findAll({ limit: 1000 })
        const allTransactions = await transactionsRepo.findAll({ limit: 10000 })
        const allAppointments = await appointmentsRepo.findAll({ limit: 10000 })

        // 媛?怨좉컼蹂?LTV 怨꾩궛
        const customerLTVs = customers.map((customer) => {
            // ?대떦 怨좉컼??嫄곕옒 ?꾪꽣留?
            const transactions = allTransactions.filter(t => t.customer_id === customer.id)

            // ?대떦 怨좉컼???덉빟 ?꾪꽣留?
            const appointments = allAppointments.filter(a => a.customer_id === customer.id)

            // 珥?援щℓ??
            const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0)

            // 嫄곕옒 ?잛닔
            const transactionCount = transactions.length

            // ?됯퇏 援щℓ??
            const avgRevenue = transactionCount > 0 ? totalRevenue / transactionCount : 0

            // 諛⑸Ц ?잛닔
            const visitCount = appointments.length

            // ?щ갑臾몄쑉
            const returnRate = visitCount > 1 ? ((visitCount - 1) / visitCount) * 100 : 0

            // 泥?留덉?留?諛⑸Ц
            const sortedAppointments = [...appointments].sort((a, b) =>
                new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()
            )

            const firstVisit = sortedAppointments[0]?.appointment_date || null
            const lastVisit = sortedAppointments[sortedAppointments.length - 1]?.appointment_date || null

            return {
                customer_id: customer.id,
                customer_name: customer.name,
                customer_phone: customer.phone,
                total_revenue: totalRevenue,
                avg_revenue: avgRevenue,
                transaction_count: transactionCount,
                visit_count: visitCount,
                return_rate: returnRate,
                first_visit: firstVisit,
                last_visit: lastVisit,
            }
        })

        // LTV 湲곗??쇰줈 ?뺣젹
        const sortedLTVs = customerLTVs.sort((a, b) => b.total_revenue - a.total_revenue)

        return NextResponse.json(sortedLTVs)
    } catch (error) {
        console.error('Error calculating customer LTV:', error)
        return NextResponse.json(
            { error: 'Failed to calculate customer LTV' },
            { status: 500 }
        )
    }
}
