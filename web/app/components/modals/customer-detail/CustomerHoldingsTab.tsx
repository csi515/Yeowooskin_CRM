'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import Button from '../../ui/Button'

type Product = {
  id: string
  name: string
}

type Holding = {
  id: string
  product_id: string
  quantity: number
  notes?: string
  products?: { name: string }
}

type LedgerEntry = {
  created_at: string
  product_id?: string
  delta: number
  reason?: string
}

type CustomerHoldingsTabProps = {
  customerId: string
  holdings: Holding[]
  products: Product[]
  holdingDelta: Record<string, number>
  holdingReason: Record<string, string>
  newProductId: string
  newQty: number
  newReason: string
  allLedger: LedgerEntry[]
  allLedgerLoading: boolean
  allLedgerPage: number
  allLedgerPageSize: number
  allLedgerTotal: number
  holdPage: number
  holdPageSize: number
  onAddProduct: () => Promise<void>
  onChangeNewProduct: (value: string) => void
  onChangeNewQty: (value: number) => void
  onChangeNewReason: (value: string) => void
  onChangeHoldingDelta: (holdingId: string, value: number) => void
  onChangeHoldingReason: (holdingId: string, value: string) => void
  onIncrease: (holding: Holding) => Promise<void>
  onDecrease: (holding: Holding) => Promise<void>
  onDelete: (holdingId: string) => Promise<void>
  onChangeHoldPage: (page: number) => void
  onChangeHoldPageSize: (size: number) => void
  onChangeAllLedgerPage: (page: number) => void
  onChangeAllLedgerPageSize: (size: number) => void
}

export default function CustomerHoldingsTab({
  customerId,
  holdings,
  products,
  holdingDelta,
  holdingReason,
  newProductId,
  newQty,
  newReason,
  allLedger,
  allLedgerLoading,
  allLedgerPage,
  allLedgerPageSize,
  allLedgerTotal,
  holdPage,
  holdPageSize,
  onAddProduct,
  onChangeNewProduct,
  onChangeNewQty,
  onChangeNewReason,
  onChangeHoldingDelta,
  onChangeHoldingReason,
  onIncrease,
  onDecrease,
  onDelete,
  onChangeHoldPage,
  onChangeHoldPageSize,
  onChangeAllLedgerPage,
  onChangeAllLedgerPageSize
}: CustomerHoldingsTabProps) {
  const [isLedgerExpanded, setIsLedgerExpanded] = useState(false)
  
  if (!customerId) return null

  const pagedHoldings = holdings.slice((holdPage - 1) * holdPageSize, holdPage * holdPageSize)
  const totalPages = Math.max(1, Math.ceil(holdings.length / holdPageSize))

  return (
    <div className="bg-white rounded-lg border border-neutral-200 shadow-md p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="text-base font-medium text-neutral-900">보유 상품</div>
      
      {/* 상품 추가 섹션 */}
      <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-3 md:p-4 space-y-3 md:space-y-4">
        <div>
          <h3 className="text-sm font-medium text-neutral-900 mb-1">상품 추가</h3>
          <p className="text-xs text-neutral-600">고객에게 추가할 상품을 선택하고 수량을 입력하세요.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">상품 선택</label>
            <select
              className="h-10 w-full rounded-lg border border-neutral-300 px-3 outline-none focus:border-[#F472B6] focus:ring-[2px] focus:ring-[#F472B6]/20 bg-white text-neutral-900 transition-all duration-300"
              value={newProductId}
              onChange={e => onChangeNewProduct(e.target.value)}
            >
              <option value="">상품을 선택하세요</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">개수</label>
            <input
              className="h-10 w-full rounded-lg border border-neutral-300 px-3 outline-none focus:border-[#F472B6] focus:ring-[2px] focus:ring-[#F472B6]/20 bg-white text-neutral-900 text-right placeholder:text-neutral-500 transition-all duration-300"
              type="number"
              min={1}
              value={newQty === null || newQty === undefined || newQty === 0 ? '' : newQty}
              onChange={e => {
                const val = e.target.value
                onChangeNewQty(val === '' ? 1 : (isNaN(Number(val)) ? 1 : Math.max(1, Number(val))))
              }}
              placeholder="예: 1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">사유(선택)</label>
            <input
              className="h-10 w-full rounded-lg border border-neutral-300 px-3 outline-none focus:border-[#F472B6] focus:ring-[2px] focus:ring-[#F472B6]/20 bg-white text-neutral-900 placeholder:text-neutral-500 transition-all duration-300"
              placeholder="변경 사유를 입력하세요"
              value={newReason}
              onChange={e => onChangeNewReason(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button variant="primary" size="sm" onClick={onAddProduct}>
            추가
          </Button>
        </div>
      </div>
      {/* 보유 상품 리스트 */}
      <div className="space-y-3 pt-2 border-t border-neutral-200">
        {pagedHoldings.map(h => {
          const newQuantity = Math.max(0, Number(h.quantity || 0) + Number(holdingDelta[h.id] ?? 1))
          return (
            <div key={h.id} className="bg-white rounded-lg border border-neutral-200 p-4 hover:bg-neutral-50 hover:border-neutral-300 transition-all duration-300 space-y-3">
              {/* 상품 정보 */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-neutral-900">{h.products?.name || '(삭제됨)'}</span>
                  <span className="text-sm text-neutral-600 ml-2">현재: {h.quantity.toLocaleString()}개</span>
                </div>
              </div>
              
              {/* 입력 필드 그룹 */}
              <div className="flex flex-col md:flex-row items-stretch md:items-end gap-3">
                <div className="w-full md:w-24">
                  <label className="block text-xs font-medium text-neutral-700 mb-1">변경할 수량</label>
                  <input
                    className="h-9 w-full rounded-lg border border-neutral-300 px-3 outline-none focus:border-[#F472B6] focus:ring-[2px] focus:ring-[#F472B6]/20 bg-white text-neutral-900 text-sm placeholder:text-neutral-500 transition-all duration-300"
                    type="number"
                    min={1}
                    value={holdingDelta[h.id] === null || holdingDelta[h.id] === undefined || holdingDelta[h.id] === 0 ? '' : holdingDelta[h.id]}
                    onChange={e => {
                      const val = e.target.value
                      const v = val === '' ? 1 : (isNaN(Number(val)) ? 1 : Math.max(1, Number(val)))
                      onChangeHoldingDelta(h.id, v)
                    }}
                    placeholder="예: 1"
                    aria-label="변경할 수량"
                  />
                </div>
                <div className="w-full md:flex-1 md:min-w-[150px]">
                  <label className="block text-xs font-medium text-neutral-700 mb-1">변경 사유(선택)</label>
                  <input
                    className="h-9 w-full rounded-lg border border-neutral-300 px-3 outline-none focus:border-[#F472B6] focus:ring-[2px] focus:ring-[#F472B6]/20 bg-white text-neutral-900 placeholder:text-neutral-500 text-sm transition-all duration-300"
                    placeholder="사유를 입력하세요"
                    value={holdingReason[h.id] || ''}
                    onChange={e => onChangeHoldingReason(h.id, e.target.value)}
                  />
                </div>
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-1.5 md:shrink-0">
                  <Button size="sm" variant="outline" onClick={() => onDecrease(h)} className="w-full md:w-auto">
                    차감
                  </Button>
                  <Button size="sm" variant="primary" onClick={() => onIncrease(h)} className="w-full md:w-auto">
                    추가
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => onDelete(h.id)} className="w-full md:w-auto">
                    삭제
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
        {holdings.length === 0 && (
          <div className="py-6 text-sm text-neutral-500 text-center bg-white rounded-lg border border-neutral-200">
            등록된 보유 상품이 없습니다.
          </div>
        )}
      </div>
      {holdings.length > 0 && (
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-4 border-t border-neutral-200">
          <div className="text-sm text-neutral-600 font-medium">
            총 {holdings.length}개 · {holdPage}/{totalPages} 페이지
          </div>
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3">
            <select
              value={holdPageSize}
              onChange={e => {
                onChangeHoldPageSize(Number(e.target.value))
                onChangeHoldPage(1)
              }}
              className="h-10 w-full md:w-auto rounded-lg border border-neutral-300 px-3 text-sm bg-white text-neutral-900 focus:border-[#F472B6] focus:ring-[2px] focus:ring-[#F472B6]/20 outline-none transition-all duration-300"
            >
              {[5, 10, 20].map(s => (
                <option key={s} value={s}>{s}/페이지</option>
              ))}
            </select>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onChangeHoldPage(Math.max(1, holdPage - 1))}
                disabled={holdPage === 1}
                className="flex-1 md:flex-none"
              >
                이전
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onChangeHoldPage(Math.min(totalPages, holdPage + 1))}
                disabled={holdPage >= totalPages}
                className="flex-1 md:flex-none"
              >
                다음
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* 보유 상품 변동 내역 (접기/펼치기 가능) */}
      <div className="mt-4 pt-4 border-t border-neutral-200">
        <button
          type="button"
          onClick={() => setIsLedgerExpanded(!isLedgerExpanded)}
          className="flex items-center justify-between w-full text-left mb-3"
        >
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-neutral-900">변동 내역</div>
            <span className="text-xs text-neutral-500">(저장 후 변동내역에 값이 기록됩니다)</span>
          </div>
          {isLedgerExpanded ? (
            <ChevronUp className="h-5 w-5 text-neutral-600" />
          ) : (
            <ChevronDown className="h-5 w-5 text-neutral-600" />
          )}
        </button>
        {isLedgerExpanded && (
          <>
            <div className="bg-white border border-neutral-200 rounded-lg p-3 overflow-auto shadow-sm">
              {allLedgerLoading && (
                <div className="text-sm text-neutral-500 text-center py-4">불러오는 중...</div>
              )}
              {!allLedgerLoading && (
                <table className="min-w-full text-sm">
                  <thead className="bg-neutral-100 border-b border-neutral-200">
                    <tr>
                      <th className="text-left p-2 font-medium text-neutral-900">일시</th>
                      <th className="text-left p-2 font-medium text-neutral-900">상품</th>
                      <th className="text-left p-2 font-medium text-neutral-900">사유</th>
                      <th className="text-right p-2 font-medium text-neutral-900">증감</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {allLedger.map((r, i) => {
                      const name = (products.find(p => String(p.id) === String(r.product_id))?.name) || '-'
                      return (
                        <tr key={i} className="hover:bg-neutral-50 transition-colors duration-300">
                          <td className="p-2 text-neutral-700">{String(r.created_at).replace('T', ' ').slice(0, 16)}</td>
                          <td className="p-2 text-neutral-700">{name}</td>
                          <td className="p-2">
                            <span className="inline-flex items-center rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-700">
                              {r.reason || '-'}
                            </span>
                          </td>
                          <td className={`p-2 text-right font-medium ${Number(r.delta) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {Number(r.delta) >= 0 ? `+${r.delta.toLocaleString()}` : r.delta.toLocaleString()}
                          </td>
                        </tr>
                      )
                    })}
                    {allLedger.length === 0 && (
                      <tr>
                        <td className="p-4 text-sm text-neutral-500 text-center" colSpan={4}>내역이 없습니다.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
            {/* 변동 내역 페이지네이션 */}
            {!allLedgerLoading && allLedger.length > 0 && (
              <div className="mt-3 pt-3 border-t border-neutral-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="text-sm font-medium text-neutral-700">
                  총 {allLedgerTotal}개 · {allLedgerPage}/{Math.max(1, Math.ceil(allLedgerTotal / allLedgerPageSize))} 페이지
                </div>
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3">
                  <select
                    value={allLedgerPageSize}
                    onChange={e => {
                      onChangeAllLedgerPageSize(Number(e.target.value))
                      onChangeAllLedgerPage(1)
                    }}
                    className="h-10 w-full md:w-auto rounded-lg border border-neutral-300 px-3 text-sm bg-white text-neutral-900 focus:border-[#F472B6] focus:ring-[2px] focus:ring-[#F472B6]/20 outline-none transition-all duration-300"
                  >
                    {[5, 10, 20, 50].map(s => (
                      <option key={s} value={s}>{s}/페이지</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onChangeAllLedgerPage(Math.max(1, allLedgerPage - 1))}
                      disabled={allLedgerPage === 1}
                      className="flex-1 md:flex-none"
                    >
                      이전
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onChangeAllLedgerPage(allLedgerPage + 1)}
                      disabled={allLedger.length <= allLedgerPageSize}
                      className="flex-1 md:flex-none"
                    >
                      다음
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

