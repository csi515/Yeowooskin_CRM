'use client'

import { Pencil, Phone, Mail, Package } from 'lucide-react'
import { Box, Card, CardContent, Typography, Stack, Chip, IconButton, Divider, Skeleton } from '@mui/material'
import CustomerHoldingsBadge from '../CustomerHoldingsBadge'
import { type Customer } from '@/types/entities'

interface CustomerCardsProps {
  customers: Customer[]
  paginatedCustomers: Customer[]
  loading: boolean
  pointsByCustomer: Record<string, number>
  onCustomerClick: (customer: Customer) => void
}

export default function CustomerCards({
  customers,
  paginatedCustomers,
  loading,
  pointsByCustomer,
  onCustomerClick
}: CustomerCardsProps) {
  return (
    <Box sx={{ display: { xs: 'block', md: 'none' } }}>
      <Stack spacing={2}>
        {loading && Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
        {!loading && paginatedCustomers.map((c) => (
          <Card key={c.id} sx={{ borderRadius: 3 }} variant="outlined">
            <CardContent sx={{ pb: 1 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6" fontWeight="bold">{c.name}</Typography>
                  <Chip
                    label={c.active !== false ? '활성' : '비활성'}
                    size="small"
                    color={c.active !== false ? 'success' : 'default'}
                    variant="outlined"
                  />
                </Box>
                <IconButton
                  size="small"
                  onClick={() => onCustomerClick(c)}
                  aria-label="고객 수정"
                  sx={{ minWidth: { xs: 44, md: 'auto' }, minHeight: { xs: 44, md: 'auto' } }}
                >
                  <Pencil className="h-4 w-4" />
                </IconButton>
              </Stack>
              <Stack spacing={1}>
                <Stack direction="row" alignItems="center" spacing={1} color="text.secondary">
                  <Phone className="h-4 w-4" />
                  <Typography variant="body2">{c.phone || '-'}</Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1} color="text.secondary">
                  <Mail className="h-4 w-4" />
                  <Typography variant="body2" noWrap>{c.email || '-'}</Typography>
                </Stack>
                <Divider sx={{ my: 1 }} />
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Package className="h-4 w-4 text-neutral-400" />
                    <CustomerHoldingsBadge customerId={c.id} />
                  </Stack>
                  <Typography fontWeight="bold" color="warning.main">
                    {Number(pointsByCustomer[c.id] ?? 0).toLocaleString()} P
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
        {!loading && customers.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography color="text.secondary">
              등록된 고객이 없습니다.
            </Typography>
          </Box>
        )}
      </Stack>
    </Box>
  )
}
