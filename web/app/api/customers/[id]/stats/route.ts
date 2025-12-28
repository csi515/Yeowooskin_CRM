import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getUserIdFromCookies } from '@/lib/auth/user'
import { CustomersRepository } from '@/app/lib/repositories/customers.repository'
import { TransactionsRepository } from '@/app/lib/repositories/transactions.repository'
import { AppointmentsRepository } from '@/app/lib/repositories/appointments.repository'

/**
 * GET /api/customers/[id]/stats
 * 개별 고객의 상세 통계 조회
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createSupabaseServerClient()
        const userId = await getUserIdFromCookies()

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const customerId = params.id

        // Repository 초기화
        const customersRepo = new CustomersRepository(userId, supabase)
        const transactionsRepo = new TransactionsRepository(userId, supabase)
        const appointmentsRepo = new AppointmentsRepository(userId, supabase)

        // 고객 정보 조회
        const customer = await customersRepo.findById(customerId)
        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
        }

        // 고객의 모든 거래 조회
        const transactions = await transactionsRepo.findAll({
            customer_id: customerId,
            limit: 1000
        })

        // 고객의 모든 예약 조회
        const allAppointments = await appointmentsRepo.findAll({ limit: 1000 })
        const appointments = allAppointments.filter(a => a.customer_id === customerId)

        // 통계 계산
        const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0)
        const avgRevenue = transactions.length > 0 ? totalRevenue / transactions.length : 0

        const completedVisits = appointments.filter(a => a.status === 'complete')
        const visitCount = completedVisits.length

        const scheduledAppointments = appointments.filter(a => a.status === 'scheduled')
        const cancelledAppointments = appointments.filter(a => a.status === 'cancelled')

        const returnRate = appointments.length > 0
            ? (visitCount / appointments.length) * 100
            : 0

        // 월별 구매 추이
        const monthlyRevenue: Record<string, number> = {}
        transactions.forEach(t => {
            if (t.transaction_date) {
                const month = t.transaction_date.substring(0, 7) // YYYY-MM
                monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (t.amount || 0)
            }
        })

        // 최근 거래 정보
        const sortedTransactions = [...transactions].sort((a, b) =>
            new Date(b.transaction_date || 0).getTime() - new Date(a.transaction_date || 0).getTime()
        )
        const lastTransaction = sortedTransactions[0]

        // 최근 방문 정보
        const sortedAppointments = [...appointments].sort((a, b) =>
            new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()
        )
        const lastVisit = sortedAppointments[0]
        const firstVisit = [...appointments].sort((a, b) =>
            new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()
        )[0]

        return NextResponse.json({
            customer: {
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
                email: customer.email,
            },
            ltv: {
                total_revenue: totalRevenue,
                avg_revenue: avgRevenue,
                transaction_count: transactions.length,
            },
            visits: {
                total_visits: visitCount,
                total_appointments: appointments.length,
                scheduled: scheduledAppointments.length,
                cancelled: cancelledAppointments.length,
                return_rate: returnRate,
            },
            timeline: {
                first_visit: firstVisit?.appointment_date || null,
                last_visit: lastVisit?.appointment_date || null,
                last_transaction: lastTransaction?.transaction_date || null,
            },
            monthly_revenue: monthlyRevenue,
        })
    } catch (error) {
        console.error('Error fetching customer stats:', error)
        return NextResponse.json(
            { error: 'Failed to fetch customer stats' },
            { status: 500 }
        )
    }
}
