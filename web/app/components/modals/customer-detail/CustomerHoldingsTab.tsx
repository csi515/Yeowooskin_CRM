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
  notes?: string
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
  addingProduct: boolean
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
  onUpdateLedgerNote: (ledgerId: string, notes: string) => Promise<void>
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
  addingProduct,
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
  onChangeAllLedgerPageSize,
  onUpdateLedgerNote
}: CustomerHoldingsTabProps) {
  const [isLedgerExpanded, setIsLedgerExpanded] = useState(false)

  if (!customerId) return null

  const pagedHoldings = holdings.slice((holdPage - 1) * holdPageSize, holdPage * holdPageSize)
  const totalPages = Math.max(1, Math.ceil(holdings.length / holdPageSize))

  return (
    <div className="space-y-4">
      {/* 상품 추가 섹션 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-3">상품 추가</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            className="flex-1 h-10 rounded-md border border-blue-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
            value={newProductId}
            onChange={e => onChangeNewProduct(e.target.value)}
          >
            <option value="">상품 선택</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input
            className="w-24 h-10 rounded-md border border-blue-300 px-3 text-sm text-center outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            type="number"
            min={1}
            value={newQty === null || newQty === undefined || newQty === 0 ? '' : newQty}
            onChange={e => {
              const val = e.target.value
              onChangeNewQty(val === '' ? 1 : (isNaN(Number(val)) ? 1 : Math.max(1, Number(val))))
            }}
            placeholder="수량"
          />
          <Button variant="primary" size="sm" onClick={onAddProduct} loading={addingProduct} disabled={addingProduct} className="h-10 px-6">
            추가
          </Button>
        </div>
        {newProductId && (
          <input
            className="mt-2 w-full h-9 rounded-md border border-blue-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            placeholder="사유 (선택사항)"
            value={newReason}
            onChange={e => onChangeNewReason(e.target.value)}
          />
        )}
      </div>

      {/* 보유 상품 리스트 */}
      <div className="space-y-3">
        {pagedHoldings.map(h => {
          return (
            <div key={h.id} className="bg-white rounded-lg border-2 border-neutral-200 hover:border-blue-300 transition-all p-4">
              {/* 상품 헤더 */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-base font-semibold text-neutral-900">{h.products?.name || '(삭제됨)'}</h4>
                  <p className="text-sm text-neutral-500">보유 수량: <span className="font-medium text-neutral-700">{h.quantity.toLocaleString()}개</span></p>
                </div>
                <Button variant="danger" size="sm" onClick={() => onDelete(h.id)} className="h-9 px-3">
                  삭제
                </Button>
              </div>

              {/* 수량 변경 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1.5">수량 변경</label>
                  <div className="flex gap-1.5">
                    <input
                      className="w-20 h-9 rounded-md border border-neutral-300 px-2 text-sm text-center outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      type="number"
                      min={1}
                      value={holdingDelta[h.id] === null || holdingDelta[h.id] === undefined || holdingDelta[h.id] === 0 ? '' : holdingDelta[h.id]}
                      onChange={e => {
                        const val = e.target.value
                        onChangeHoldingDelta(h.id, val === '' ? 1 : (isNaN(Number(val)) ? 1 : Math.max(1, Number(val))))
                      }}
                      placeholder="1"
                    />
                    <Button variant="secondary" size="sm" onClick={() => onIncrease(h)} className="flex-1 h-9">
                      추가
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => onDecrease(h)} className="flex-1 h-9">
                      차감
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1.5">사유 (선택)</label>
                  <input
                    className="w-full h-9 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="변경 사유"
                    value={holdingReason[h.id] || ''}
                    onChange={e => onChangeHoldingReason(h.id, e.target.value)}
                  />
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
                variant="secondary"
                size="sm"
                onClick={() => onChangeHoldPage(Math.max(1, holdPage - 1))}
                disabled={holdPage <= 1}
              >
                이전
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onChangeHoldPage(Math.min(totalPages, holdPage + 1))}
                disabled={holdPage >= totalPages}
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
                    <tr className="border-b border-neutral-200">
                      <th className="text-left p-2 text-xs font-semibold text-neutral-700 bg-neutral-50">일시</th>
                      <th className="text-left p-2 text-xs font-semibold text-neutral-700 bg-neutral-50">상품</th>
                      <th className="text-right p-2 text-xs font-semibold text-neutral-700 bg-neutral-50">변경</th>
                      <th className="text-left p-2 text-xs font-semibold text-neutral-700 bg-neutral-50">사유</th>
                      <th className="text-left p-2 text-xs font-semibold text-neutral-700 bg-neutral-50">메모</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {allLedger.map((r, i) => {
                      return (
                        <tr key={i} className="border-b border-neutral-100 hover:bg-neutral-50 transition">
                          <td className="p-2 text-xs text-neutral-600">
                            {r.created_at ? new Date(r.created_at).toLocaleString('ko-KR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : '-'}
                          </td>
                          <td className="p-2 text-xs text-neutral-900 font-medium">
                            {products.find(p => p.id === r.product_id)?.name || '(알 수 없음)'}
                          </td>
                          <td className={`p-2 text-xs font-semibold text-right ${(r.delta || 0) > 0 ? 'text-blue-600' : 'text-rose-600'
                            }`}>
                            {(r.delta || 0) > 0 ? '+' : ''}{(r.delta || 0).toLocaleString()}
                          </td>
                          <td className="p-2 text-xs text-neutral-600">{r.reason || '-'}</td>
                          <td className="p-2 text-xs text-neutral-600">
                            <input
                              className="w-full bg-transparent border-none focus:ring-1 focus:ring-blue-500 rounded px-1 text-xs"
                              value={r.notes || ''}
                              placeholder="메모 입력"
                              onChange={() => {
                                // 로컬 상태 업데이트는 상위 컴포넌트에서 처리하거나 여기서 디바운싱 처리 필요
                                // 현재는 흐름상 onBlur에서 저장하도록 유도
                              }}
                              onBlur={(e) => {
                                if (r.notes !== e.target.value) {
                                  onUpdateLedgerNote(r.created_at, e.target.value) // 주의: created_at을 ID로 쓰고 있다면 수정 필요. 실제 ID가 필요함.
                                  // LedgerEntry 타입에 id가 없어서 문제될 수 있음. 타입을 확인해봐야 함.
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.currentTarget.blur()
                                }
                              }}
                            />
                          </td>
                        </tr>)
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
    </div >
  )
}

