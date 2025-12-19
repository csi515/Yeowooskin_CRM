'use client'

import { useState } from 'react'
import { Card, Grid, Typography, Box } from '@mui/material'
import { User, Phone, MapPin, Mail, FileText, Trash2 } from 'lucide-react'
import Input from '../../ui/Input'
import Textarea from '../../ui/Textarea'
import Button from '../../ui/Button'
import ConfirmDialog from '../../ui/ConfirmDialog'
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  if (!form) return null

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Card variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <User size={20} className="text-primary-main" />
          <Typography variant="subtitle1" fontWeight={700}>
            기본 정보
          </Typography>
        </Box>

        <Grid container spacing={2.5}>
          <Grid item xs={12} md={6}>
            <Input
              label="이름"
              required
              fullWidth
              placeholder="예) 홍길동"
              value={form.name}
              onChange={e => onChangeForm(f => f ? ({ ...f, name: e.target.value }) : null)}
              {...(fieldErrors?.name && { error: fieldErrors.name })}
              leftIcon={<User size={18} />}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Input
              label="전화번호"
              required
              fullWidth
              placeholder="예) 010-1234-5678"
              value={form.phone || ''}
              onChange={e => onChangeForm(f => f ? ({ ...f, phone: e.target.value }) : null)}
              {...(fieldErrors?.phone && { error: fieldErrors.phone })}
              leftIcon={<Phone size={18} />}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Input
              label="이메일 (선택)"
              fullWidth
              placeholder="예) user@example.com"
              type="email"
              value={form.email || ''}
              onChange={e => onChangeForm(f => f ? ({ ...f, email: e.target.value }) : null)}
              {...(fieldErrors?.email && { error: fieldErrors.email })}
              leftIcon={<Mail size={18} />}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Input
              label="주소 (선택)"
              fullWidth
              placeholder="예) 서울시 ○○구 ○○로 12"
              value={form.address || ''}
              onChange={e => onChangeForm(f => f ? ({ ...f, address: e.target.value }) : null)}
              leftIcon={<MapPin size={18} />}
            />
          </Grid>
        </Grid>
      </Card>

      <Card variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <FileText size={20} className="text-primary-main" />
          <Typography variant="subtitle1" fontWeight={700}>
            고객 특징 및 특이사항
          </Typography>
        </Box>
        <Textarea
          placeholder="고객 성향, 선호도, 주의사항 등을 상세히 기록하세요"
          value={features}
          onChange={e => onChangeFeatures(e.target.value)}
          minRows={4}
        />
      </Card>

      {!isNewCustomer && onDelete && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="ghost"
            className="text-rose-600 hover:bg-rose-50"
            onClick={() => setIsDeleteDialogOpen(true)}
            leftIcon={<Trash2 size={18} />}
          >
            고객 데이터 삭제
          </Button>
        </Box>
      )}

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={onDelete || (() => { })}
        title="고객 정보 삭제"
        description={`'${form.name}' 고객의 모든 정보와 거래 내역이 영구적으로 삭제됩니다. 계속하시겠습니까?`}
        confirmText="삭제하기"
        variant="danger"
      />
    </Box>
  )
}

