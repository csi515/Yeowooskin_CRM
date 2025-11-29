'use client'

import { useState, memo } from 'react'
import { DollarSign, Plus, Trash2, CalendarDays, CreditCard } from 'lucide-react'
import CollapsibleSection from '../ui/CollapsibleSection'
import Input from '../ui/Input'
import Button from '../ui/Button'
import ToggleSwitch from '../ui/ToggleSwitch'
import InfoTooltip from '../ui/InfoTooltip'
import { type FinancialSettings } from '@/types/settings'

type Props = {
  data: FinancialSettings
  onChange: (data: Partial<FinancialSettings>) => void
}

function FinancialSettingsSection({ data, onChange }: Props) {
  const [newCategory, setNewCategory] = useState('')

  const addCategory = () => {
    if (newCategory.trim() && !data.expenseCategories.includes(newCategory.trim())) {
      onChange({
        expenseCategories: [...data.expenseCategories, newCategory.trim()],
      })
      setNewCategory('')
    }
  }

  const removeCategory = (category: string) => {
    onChange({
      expenseCategories: data.expenseCategories.filter((c) => c !== category),
    })
  }

  return (
    <CollapsibleSection
      title="재무 및 정산 설정"
      description="재무 정보와 정산 설정을 관리합니다."
      icon={<DollarSign className="w-6 h-6" />}
      iconColor="from-green-500 to-green-600"
    >
      <div className="space-y-6">
        {/* 비용 항목 관리 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-neutral-700" />
            <h3 className="text-lg font-semibold text-neutral-800">비용 항목 관리</h3>
            <InfoTooltip content="자주 사용하는 비용 항목을 등록하여 빠르게 선택할 수 있습니다." />
          </div>

          <div className="flex gap-2">
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="새 항목 입력"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addCategory()
                }
              }}
            />
            <Button
              variant="outline"
              onClick={addCategory}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              추가
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {data.expenseCategories.map((category) => (
              <div
                key={category}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700"
              >
                <span className="text-sm font-medium">{category}</span>
                <button
                  type="button"
                  onClick={() => removeCategory(category)}
                  className="p-0.5 rounded hover:bg-green-100 text-green-600 hover:text-rose-600 transition-colors"
                  aria-label={`${category} 삭제`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 주거래 계좌 설정 */}
        <div className="border-t border-neutral-200 pt-6 space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-neutral-700" />
            <h3 className="text-lg font-semibold text-neutral-800">주거래 계좌 설정</h3>
            <InfoTooltip content="주로 사용하는 계좌 정보를 등록하세요." />
          </div>

          <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 space-y-4">
            <Input
              label="은행명"
              value={data.bankName || ''}
              onChange={(e) => onChange({ bankName: e.target.value })}
              placeholder="예) 국민은행"
            />

            <Input
              label="계좌번호"
              value={data.accountNumber || ''}
              onChange={(e) => onChange({ accountNumber: e.target.value })}
              placeholder="예) 123456-78-901234"
            />

            <Input
              label="예금주명"
              value={data.accountHolder || ''}
              onChange={(e) => onChange({ accountHolder: e.target.value })}
              placeholder="예) 홍길동"
            />
          </div>
        </div>

        {/* 정산 로직 설정 */}
        <div className="border-t border-neutral-200 pt-6 space-y-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-neutral-700" />
            <h3 className="text-lg font-semibold text-neutral-800">정산 로직 설정</h3>
            <InfoTooltip content="매월 정산일을 설정하세요." />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="현금 정산일 (매월 N일)"
              type="number"
              min="1"
              max="31"
              value={data.cashSettlementDay}
              onChange={(e) => onChange({ cashSettlementDay: Number(e.target.value) })}
              helpText="1~31일 사이"
            />

            <Input
              label="카드 정산일 (매월 N일)"
              type="number"
              min="1"
              max="31"
              value={data.cardSettlementDay}
              onChange={(e) => onChange({ cardSettlementDay: Number(e.target.value) })}
              helpText="1~31일 사이"
            />

            <Input
              label="플랫폼 정산일 (매월 N일)"
              type="number"
              min="1"
              max="31"
              value={data.platformSettlementDay}
              onChange={(e) => onChange({ platformSettlementDay: Number(e.target.value) })}
              helpText="1~31일 사이"
            />
          </div>

          <ToggleSwitch
            checked={data.autoCreateTransactionOnComplete}
            onChange={(checked) => onChange({ autoCreateTransactionOnComplete: checked })}
            label="예약 완료 시 자동 매출 생성"
          />
        </div>
      </div>
    </CollapsibleSection>
  )
}

// React.memo로 래핑하여 props가 변경되지 않으면 리렌더링 방지
export default memo(FinancialSettingsSection)
