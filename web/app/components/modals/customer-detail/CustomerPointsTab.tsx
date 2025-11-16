'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import Button from '../../ui/Button'

type LedgerEntry = {
  created_at: string
  delta: number
  reason?: string
}

type CustomerPointsTabProps = {
  customerId: string
  pointsBalance: number
  pointsDelta: number
  pointsReason: string
  ledger: LedgerEntry[]
  loadingHistory: boolean
  histPage: number
  hasNext: boolean
  onChangeDelta: (value: number) => void
  onChangeReason: (value: string) => void
  onAddPoints: () => Promise<void>
  onDeductPoints: () => Promise<void>
  onChangePage: (page: number) => void
  onExportExcel: () => void
}

export default function CustomerPointsTab({
  customerId,
  pointsBalance,
  pointsDelta,
  pointsReason,
  ledger,
  loadingHistory,
  histPage,
  hasNext,
  onChangeDelta,
  onChangeReason,
  onAddPoints,
  onDeductPoints,
  onChangePage,
  onExportExcel
}: CustomerPointsTabProps) {
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false)
  
  if (!customerId) return null

  return (
    <div className="bg-white rounded-sm border-2 border-neutral-500 shadow-lg p-4 md:p-5 space-y-4">
      {/* 포인트 개요 */}
      <div className="space-y-4">
        <div className="text-base font-semibold text-neutral-900">
          현재 잔액:{' '}
          <span className="text-[#1D4ED8]">{pointsBalance.toLocaleString()}</span>
        </div>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <input
            className="h-10 w-full md:w-32 rounded-sm border-2 border-neutral-500 px-3 text-sm outline-none focus:border-[#1D4ED8] focus:ring-[4px] focus:ring-[#1D4ED8]/20 bg-white text-neutral-900 placeholder:text-neutral-500"
            type="number"
            placeholder="예: 100"
            value={pointsDelta === null || pointsDelta === undefined || pointsDelta === 0 ? '' : pointsDelta}
            onChange={e => {
              const val = e.target.value
              onChangeDelta(val === '' ? 0 : (isNaN(Number(val)) ? 0 : Number(val)))
            }}
          />
          <input
            className="h-10 w-full md:flex-1 md:min-w-[200px] rounded-sm border-2 border-neutral-500 px-3 text-sm outline-none focus:border-[#1D4ED8] focus:ring-[4px] focus:ring-[#1D4ED8]/20 bg-white text-neutral-900 placeholder:text-neutral-500"
            placeholder="사유(선택)"
            value={pointsReason}
            onChange={e => onChangeReason(e.target.value)}
          />
          <div className="flex flex-col md:flex-row gap-2 md:gap-3">
            <Button size="md" variant="outline" onClick={onDeductPoints} className="w-full md:w-auto">
              차감
            </Button>
            <Button size="md" variant="primary" onClick={onAddPoints} className="w-full md:w-auto">
              추가
            </Button>
          </div>
        </div>
      </div>
      {/* 포인트 내역 (접기/펼치기 가능) */}
      <div className="space-y-4 pt-4 border-t-2 border-neutral-400">
        <button
          type="button"
          onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
          className="flex items-center justify-between w-full text-left text-sm font-semibold text-neutral-900 hover:text-[#1D4ED8] transition-colors"
        >
          <span>포인트 내역</span>
          {isHistoryExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </button>
        {isHistoryExpanded && (
          <div className="overflow-auto">
          {loadingHistory && (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 rounded-sm border-2 border-neutral-300 bg-neutral-100 animate-pulse" />
              ))}
            </div>
          )}
          {!loadingHistory && (
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10 bg-neutral-300 border-b-2 border-neutral-400">
                <tr>
                  <th className="p-3 text-left font-semibold text-neutral-900">일시</th>
                  <th className="p-3 text-left font-semibold text-neutral-900">사유</th>
                  <th className="p-3 text-right font-semibold text-neutral-900">증감</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-300">
                {ledger.map((r, i) => (
                  <tr key={i} className="hover:bg-neutral-50 transition-colors">
                    <td className="p-3 text-neutral-700">
                      {String(r.created_at).replace('T', ' ').slice(0, 16)}
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center rounded-sm border border-neutral-300 bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
                        {r.reason || '-'}
                      </span>
                    </td>
                    <td
                      className={`p-3 text-right font-semibold ${
                        Number(r.delta) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {Number(r.delta) >= 0 ? `+${r.delta.toLocaleString()}` : r.delta.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {ledger.length === 0 && (
                  <tr>
                    <td className="p-6 text-sm text-neutral-500 text-center" colSpan={3}>
                      내역이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-4">
              <div className="text-sm text-neutral-600 font-medium">페이지 {histPage}</div>
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={histPage === 1}
                  onClick={() => onChangePage(Math.max(1, histPage - 1))}
                  className="w-full md:w-auto"
                >
                  이전
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!hasNext}
                  onClick={() => onChangePage(histPage + 1)}
                  className="w-full md:w-auto"
                >
                  다음
                </Button>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <Button size="sm" variant="secondary" onClick={onExportExcel} className="w-full md:w-auto">
                엑셀 내보내기
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

