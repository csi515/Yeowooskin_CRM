'use client'

import {
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Box,
    CircularProgress
} from '@mui/material'
import { X, TrendingUp, TrendingDown, Edit3 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface InventoryTransaction {
    id: string
    product_id: string
    type: 'purchase' | 'sale' | 'adjustment'
    quantity: number
    before_count: number
    after_count: number
    memo?: string
    created_at: string
}

interface InventoryHistoryModalProps {
    open: boolean
    onClose: () => void
    productId: string | null
    productName: string
}

export default function InventoryHistoryModal({ open, onClose, productId, productName }: InventoryHistoryModalProps) {
    const [transactions, setTransactions] = useState<InventoryTransaction[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (open && productId) {
            fetchTransactions()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, productId])

    async function fetchTransactions() {
        if (!productId) return

        try {
            setLoading(true)
            const response = await fetch(`/api/inventory/transactions?product_id=${productId}`)
            if (response.ok) {
                const data = await response.json()
                setTransactions(Array.isArray(data) ? data : [])
            }
        } catch (error) {
            console.error('Error fetching transactions:', error)
        } finally {
            setLoading(false)
        }
    }

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'purchase':
                return <TrendingUp size={16} />
            case 'sale':
                return <TrendingDown size={16} />
            case 'adjustment':
                return <Edit3 size={16} />
            default:
                return null
        }
    }

    const getTransactionLabel = (type: string) => {
        switch (type) {
            case 'purchase':
                return '입고'
            case 'sale':
                return '출고'
            case 'adjustment':
                return '조정'
            default:
                return type
        }
    }

    const getTransactionColor = (type: string): "success" | "error" | "default" => {
        switch (type) {
            case 'purchase':
                return 'success'
            case 'sale':
                return 'error'
            default:
                return 'default'
        }
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6" fontWeight={600}>
                        재고 이력 - {productName}
                    </Typography>
                    <IconButton onClick={onClose} size="small">
                        <X size={20} />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : transactions.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                            거래 이력이 없습니다.
                        </Typography>
                    </Box>
                ) : (
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>날짜</TableCell>
                                    <TableCell>유형</TableCell>
                                    <TableCell align="right">변경 전</TableCell>
                                    <TableCell align="right">변경량</TableCell>
                                    <TableCell align="right">변경 후</TableCell>
                                    <TableCell>메모</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {transactions.map((transaction) => (
                                    <TableRow key={transaction.id}>
                                        <TableCell>
                                            <Typography variant="caption">
                                                {format(new Date(transaction.created_at), 'yyyy-MM-dd HH:mm', { locale: ko })}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={getTransactionLabel(transaction.type)}
                                                size="small"
                                                color={getTransactionColor(transaction.type)}
                                                {...(getTransactionIcon(transaction.type) ? { icon: getTransactionIcon(transaction.type) as React.ReactElement } : {})}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2">{transaction.before_count}</Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography
                                                variant="body2"
                                                fontWeight={600}
                                                color={transaction.quantity > 0 ? 'success.main' : 'error.main'}
                                            >
                                                {transaction.quantity > 0 ? '+' : ''}{transaction.quantity}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" fontWeight={600}>
                                                {transaction.after_count}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption" color="text.secondary">
                                                {transaction.memo || '-'}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </DialogContent>
        </Dialog>
    )
}
