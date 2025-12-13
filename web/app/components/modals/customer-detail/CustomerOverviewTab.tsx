'use client'

import Input from '../../ui/Input'
import Textarea from '../../ui/Textarea'
import Button from '../../ui/Button'
import type { Customer } from '@/types/entities'

type CustomerForm = Pick<Customer, 'id' | 'name' | 'phone' | 'email' | 'address'>

type CustomerOverviewTabProps = {
  form: CustomerForm | null
  features: string
  fieldErrors?: { name?: string; phone?: string; email?: string }
  onChangeForm: (updater: (prev: CustomerForm | null) => CustomerForm | null) => void
  onChangeFeatures: (value: string) => void
  onDelete?: () => void
  isNewCustomer: boolean
}

export default function CustomerOverviewTab({
  form,
  features,
  fieldErrors,
  onChangeForm,
  onChangeFeatures,
  onDelete,
  isNewCustomer
}: CustomerOverviewTabProps) {
  if (!form) return null

  return (
    <div className="space-y-4">

      <div className="bg-white rounded-sm border-2 border-neutral-500 shadow-lg p-4 md:p-5 space-y-3 md:space-y-4">
        <div className="grid grid-cols-1 gap-3 md:gap-4 md:grid-cols-2">
          <div>
            <Input
              label="이름"
              required
              placeholder="예) 홍길동"
              value={form.name}
              onChange={e => onChangeForm(f => f ? ({ ...f, name: e.target.value }) : null)}
              {...(fieldErrors?.name && { error: fieldErrors.name })}
            />
          </div>
          <div>
            <Input
              label="전화번호"
              required
              placeholder="예) 010-1234-5678"
              value={form.phone || ''}
              onChange={e => onChangeForm(f => f ? ({ ...f, phone: e.target.value }) : null)}
            />
          </div>
          <div>
            <Input
              label="이메일(선택)"
              placeholder="예) user@example.com"
              type="email"
              value={form.email || ''}
              onChange={e => onChangeForm(f => f ? ({ ...f, email: e.target.value }) : null)}
            />
          </div>
          <div>
            <Input
              label="주소(선택)"
              placeholder="예) 서울시 ○○구 ○○로 12"
              value={form.address || ''}
              onChange={e => onChangeForm(f => f ? ({ ...f, address: e.target.value }) : null)}
            />
          </div>
          <div className="md:col-span-2">
            <Textarea
              label="특징(선택)"
              placeholder="고객 성향, 선호도, 주의사항 등을 기록하세요"
              value={features}
              onChange={e => onChangeFeatures(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 삭제 버튼 (기존 고객만) */}
      {!isNewCustomer && onDelete && (
        <div className="mt-6 pt-6 border-t border-neutral-300">
          <Button
            variant="danger"
            size="sm"
            onClick={onDelete}
          >
            고객 데이터 삭제
          </Button>
        </div>
      )}
    </div>
  )
}

