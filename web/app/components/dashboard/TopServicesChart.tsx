'use client'

import { Card, CardContent, CardHeader, Typography } from '@mui/material'
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend
} from 'recharts'

interface TopServicesChartProps {
    recentAppointments: { product_name: string }[] // DashboardPage에서 가공된 데이터를 받음
}

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'];

export default function TopServicesChart({ recentAppointments }: TopServicesChartProps) {

    const processData = () => {
        const countMap = new Map<string, number>()

        recentAppointments.forEach(a => {
            if (a.product_name && a.product_name !== '-') {
                const current = countMap.get(a.product_name) || 0
                countMap.set(a.product_name, current + 1)
            }
        })

        const data = Array.from(countMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5) // Top 5

        return data
    }

    const data = processData()

    return (
        <Card sx={{ height: '100%', borderRadius: 2, width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
            <CardHeader
                title={<Typography variant="h6" fontWeight="bold">인기 시술 Top 5</Typography>}
                subheader="최근 예약 기준"
            />
            <CardContent sx={{ height: { xs: 220, sm: 260, md: 300 }, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: '100%', overflow: 'hidden', p: { xs: 1, sm: 2, md: 3 } }}>
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius="40%"
                                outerRadius="60%"
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.map((_entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => [`${value}건`, '예약']} />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <Typography color="text.secondary">데이터가 부족합니다.</Typography>
                )}
            </CardContent>
        </Card>
    )
}
