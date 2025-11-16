'use client'

import Input from '../../ui/Input'
import Textarea from '../../ui/Textarea'

type CustomerForm = {
  id?: string
  name: string
  phone?: string
  email?: string
  address?: string
}

type CustomerOverviewTabProps = {
  form: CustomerForm | null
  features: string
  initialPoints: number
  fieldErrors?: { name?: string }
  onChangeForm: (updater: (prev: CustomerForm | null) => CustomerForm | null) => void
  onChangeFeatures: (value: string) => void
  onChangeInitialPoints: (value: number) => void
}

export default function CustomerOverviewTab({
  form,
  features,
  initialPoints,
  fieldErrors,
  onChangeForm,
  onChangeFeatures,
  onChangeInitialPoints
}: CustomerOverviewTabProps) {
  if (!form) return null

  return (
    <div className="bg-white rounded-sm border-2 border-neutral-500 shadow-lg p-4 md:p-5 space-y-3 md:space-y-4">
      <div className="grid grid-cols-1 gap-3 md:gap-4 md:grid-cols-2">
        <div>
          <Input
            label="이름"
            required
            placeholder="예) 홍길동"
            value={form.name}
            onChange={e => onChangeForm(f => f ? ({ ...f, name: e.target.value }) : null)}
            error={fieldErrors?.name}
          />
        </div>
        <div>
          <Input
            label="전화번호(선택)"
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
        {!form.id && (
          <div>
            <Input
              label="초기 포인트(선택)"
              type="number"
              value={initialPoints === null || initialPoints === undefined || initialPoints === 0 ? '' : initialPoints}
              onChange={e => {
                const val = e.target.value
                onChangeInitialPoints(val === '' ? 0 : (isNaN(Number(val)) ? 0 : Number(val)))
              }}
              placeholder="예: 1,000"
            />
            <p className="mt-1 text-xs text-neutral-500">
              새 고객 저장 후 초기 포인트로 반영됩니다.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

