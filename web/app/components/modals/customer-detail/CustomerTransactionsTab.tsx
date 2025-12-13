/**
 * 고객 포인트 및 보유상품 탭 컴포넌트
 */

'use client'

import { useState } from 'react'
import Button from '@/app/components/ui/Button'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { CustomerProduct } from '@/app/lib/repositories/customer-products.repository'

interface Product {
    id: string
    name: string
}

interface PointLedgerEntry {
    created_at: string
    delta: number
    reason?: string | null
}

interface ProductLedgerEntry {
    created_at: string
    delta: number
    reason?: string | null | undefined
    product_id: string
}

type LedgerEntry = (PointLedgerEntry & { type: 'points' }) | (ProductLedgerEntry & { type: 'products' })

type Holding = CustomerProduct

interface CustomerTransactionsTabProps {
    customerId: string
    pointsBalance: number
    pointsLedger: PointLedgerEntry[]
    productLedger: ProductLedgerEntry[]
    holdings: Holding[]
    products: Product[]
    pointsDelta: number
    onChangePointsDelta: (delta: number) => void
    pointsReason: string
    onChangePointsReason: (reason: string) => void
    onAddPoints: () => void
    onDeductPoints: () => void
    holdingDelta: Record<string, number>
    onChangeHoldingDelta: (id: string, value: number) => void
    holdingReason: Record<string, string>
    onChangeHoldingReason: (id: string, value: string) => void
    onIncrease: (holding: Holding) => void | Promise<void>
    onDecrease: (holding: Holding) => void | Promise<void>
    newProductId: string
    onChangeNewProduct: (id: string) => void
    newQty: number
    onChangeNewQty: (qty: number) => void
    newReason: string
    onChangeNewReason: (reason: string) => void
    onAddProduct: () => void
    addingProduct: boolean
    onDelete: (id: string) => void
}

export default function CustomerTransactionsTab({
    customerId,
    pointsBalance,
    pointsLedger,
    productLedger,
    holdings,
    products,
    pointsDelta,
    onChangePointsDelta,
    pointsReason,
    onChangePointsReason,
    onAddPoints,
    onDeductPoints,
    holdingDelta,
    onChangeHoldingDelta,
    holdingReason,
    onChangeHoldingReason,
    onIncrease,
    onDecrease,
    newProductId,
    onChangeNewProduct,
    newQty,
    onChangeNewQty,
    newReason,
    onChangeNewReason,
    onAddProduct,
    addingProduct,
    onDelete,
}: CustomerTransactionsTabProps) {
    const [isHistoryExpanded, setIsHistoryExpanded] = useState(false)
    const [historyFilter, setHistoryFilter] = useState<'all' | 'points' | 'products'>('all')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    if (!customerId) return null

    // 통합 변동 내역
    const combinedLedger: LedgerEntry[] = [
        ...pointsLedger.map(entry => ({ ...entry, type: 'points' as const })),
        ...productLedger.map(entry => ({ ...entry, type: 'products' as const }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    const filteredLedger = combinedLedger.filter(entry => {
        if (historyFilter === 'all') return true
        return entry.type === historyFilter
    })

    // 페이지네이션 계산
    const totalPages = Math.ceil(filteredLedger.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedLedger = filteredLedger.slice(startIndex, endIndex)

    // 필터 변경 시 첫 페이지로 이동
    const handleFilterChange = (filter: 'all' | 'points' | 'products') => {
        setHistoryFilter(filter)
        setCurrentPage(1)
    }

    return (
        <div className="space-y-6">
            {/* 포인트 섹션 */}
            <div className="bg-white rounded-lg border-2 border-neutral-200 shadow-sm p-4">
                <h3 className="text-base font-semibold text-neutral-900 mb-4">포인트 관리</h3>
                <div className="space-y-4">
                    <div className="text-sm text-neutral-600">
                        현재 포인트: <span className="text-lg font-bold text-blue-600">{pointsBalance.toLocaleString()}</span>점
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                        <input
                            type="number"
                            value={pointsDelta || ''}
                            onChange={(e) => onChangePointsDelta(Number(e.target.value))}
                            placeholder="변경량"
                            className="flex-1 px-3 py-2 border border-neutral-300 rounded-md text-sm"
                            min="0"
                        />
                        <input
                            type="text"
                            value={pointsReason}
                            onChange={(e) => onChangePointsReason(e.target.value)}
                            placeholder="사유 (선택사항)"
                            className="flex-1 px-3 py-2 border border-neutral-300 rounded-md text-sm"
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button
                            onClick={onAddPoints}
                            disabled={!pointsDelta || pointsDelta <= 0}
                            variant="primary"
                            size="sm"
                            className="flex-1"
                        >
                            추가
                        </Button>
                        <Button
                            onClick={onDeductPoints}
                            disabled={!pointsDelta || pointsDelta <= 0}
                            variant="danger"
                            size="sm"
                            className="flex-1"
                        >
                            차감
                        </Button>
                    </div>
                </div>
            </div>

            {/* 보유상품 섹션 */}
            <div className="bg-white rounded-lg border-2 border-neutral-200 shadow-sm p-4">
                <h3 className="text-base font-semibold text-neutral-900 mb-4">보유상품 관리</h3>

                {/* 신규 상품 추가 */}
                <div className="mb-4 pb-4 border-b border-neutral-200">
                    <h4 className="text-sm font-semibold text-neutral-700 mb-2">신규 상품 추가</h4>
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-col sm:flex-row gap-2">
                            <select
                                value={newProductId}
                                onChange={(e) => onChangeNewProduct(e.target.value)}
                                className="flex-1 px-3 py-2 border border-neutral-300 rounded-md text-sm"
                            >
                                <option value="">상품 선택</option>
                                {products.filter(p => !holdings.some(h => h.product_id === p.id)).map(product => (
                                    <option key={product.id} value={product.id}>{product.name}</option>
                                ))}
                            </select>
                            <input
                                type="number"
                                value={newQty || ''}
                                onChange={(e) => onChangeNewQty(Number(e.target.value))}
                                placeholder="수량"
                                className="w-24 px-3 py-2 border border-neutral-300 rounded-md text-sm"
                                min="1"
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                type="text"
                                value={newReason}
                                onChange={(e) => onChangeNewReason(e.target.value)}
                                placeholder="사유 (선택사항)"
                                className="flex-1 px-3 py-2 border border-neutral-300 rounded-md text-sm"
                            />
                            <Button
                                onClick={onAddProduct}
                                disabled={!newProductId || !newQty || newQty <= 0 || addingProduct}
                                variant="primary"
                                size="sm"
                                className="sm:w-auto"
                            >
                                추가
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 기존 보유상품 목록 */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-neutral-700">보유 목록</h4>
                    {holdings.length === 0 ? (
                        <p className="text-sm text-neutral-500 py-4 text-center">보유상품이 없습니다.</p>
                    ) : (
                        holdings.map(holding => (
                            <div key={holding.id} className="border border-neutral-200 rounded-md p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold text-neutral-900">
                                        {holding.products?.name || products.find(p => p.id === holding.product_id)?.name || '알 수 없음'}
                                    </span>
                                    <span className="text-sm font-bold text-blue-600">{holding.quantity}개</span>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <input
                                            type="number"
                                            value={holdingDelta[holding.id] || 1}
                                            onChange={(e) => onChangeHoldingDelta(holding.id, Number(e.target.value))}
                                            placeholder="변경량"
                                            className="w-24 px-2 py-1 border border-neutral-300 rounded text-sm"
                                            min="1"
                                        />
                                        <input
                                            type="text"
                                            value={holdingReason[holding.id] || ''}
                                            onChange={(e) => onChangeHoldingReason(holding.id, e.target.value)}
                                            placeholder="사유 (선택사항)"
                                            className="flex-1 px-2 py-1 border border-neutral-300 rounded text-sm"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => onIncrease(holding)}
                                            variant="primary"
                                            size="sm"
                                            className="flex-1 h-8"
                                        >
                                            추가
                                        </Button>
                                        <Button
                                            onClick={() => onDecrease(holding)}
                                            variant="danger"
                                            size="sm"
                                            className="flex-1 h-8"
                                        >
                                            차감
                                        </Button>
                                        <Button
                                            onClick={() => onDelete(holding.id)}
                                            variant="outline"
                                            size="sm"
                                            className="h-8 px-3"
                                        >
                                            삭제
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 변동 내역 섹션 */}
            <div className="bg-white rounded-lg border-2 border-neutral-200 shadow-sm">
                <button
                    onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                    className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 transition"
                >
                    <h3 className="text-base font-semibold text-neutral-900">변동 내역</h3>
                    {isHistoryExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>

                {isHistoryExpanded && (
                    <div className="p-4 pt-0">
                        {/* 필터 */}
                        <div className="flex gap-2 mb-4">
                            <Button
                                variant={historyFilter === 'all' ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => handleFilterChange('all')}
                                className="flex-1"
                            >
                                전체
                            </Button>
                            <Button
                                variant={historyFilter === 'points' ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => handleFilterChange('points')}
                                className="flex-1"
                            >
                                포인트
                            </Button>
                            <Button
                                variant={historyFilter === 'products' ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => handleFilterChange('products')}
                                className="flex-1"
                            >
                                보유상품
                            </Button>
                        </div>

                        {/* 테이블 */}
                        <div className="overflow-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-neutral-100 border-b border-neutral-200">
                                    <tr>
                                        <th className="p-2 text-left text-xs font-semibold text-neutral-700">일시</th>
                                        <th className="p-2 text-left text-xs font-semibold text-neutral-700">유형</th>
                                        <th className="p-2 text-left text-xs font-semibold text-neutral-700">상품</th>
                                        <th className="p-2 text-right text-xs font-semibold text-neutral-700">변경</th>
                                        <th className="p-2 text-left text-xs font-semibold text-neutral-700">사유</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedLedger.map((entry, i) => (
                                        <tr key={i} className="border-b border-neutral-100 hover:bg-neutral-50 transition">
                                            <td className="p-2 text-xs text-neutral-600">
                                                {entry.created_at ? new Date(entry.created_at).toLocaleString('ko-KR', {
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) : '-'}
                                            </td>
                                            <td className="p-2">
                                                <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${entry.type === 'points' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                                    }`}>
                                                    {entry.type === 'points' ? '포인트' : '보유상품'}
                                                </span>
                                            </td>
                                            <td className="p-2 text-xs text-neutral-900">
                                                {entry.type === 'products' && entry.product_id
                                                    ? products.find(p => p.id === entry.product_id)?.name || '-'
                                                    : '-'}
                                            </td>
                                            <td className={`p-2 text-xs font-semibold text-right ${(entry.delta || 0) > 0 ? 'text-blue-600' : 'text-rose-600'
                                                }`}>
                                                {(entry.delta || 0) > 0 ? '+' : ''}{(entry.delta || 0).toLocaleString()}
                                            </td>
                                            <td className="p-2 text-xs text-neutral-600">{entry.reason || '-'}</td>
                                        </tr>
                                    ))}
                                    {filteredLedger.length === 0 && (
                                        <tr>
                                            <td className="p-6 text-sm text-neutral-500 text-center" colSpan={5}>
                                                내역이 없습니다.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* 페이지네이션 */}
                        {filteredLedger.length > 0 && totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-200">
                                <div className="text-sm text-neutral-600">
                                    총 {filteredLedger.length}개 중 {startIndex + 1}-{Math.min(endIndex, filteredLedger.length)}개 표시
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="h-8 px-3"
                                    >
                                        이전
                                    </Button>
                                    <span className="text-sm text-neutral-700">
                                        {currentPage} / {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className="h-8 px-3"
                                    >
                                        다음
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
