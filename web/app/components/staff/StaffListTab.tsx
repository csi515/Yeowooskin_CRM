'use client'

import { Staff } from '@/types/entities'
import StaffDataGrid from './StaffDataGrid'

interface StaffListTabProps {
  staff: Staff[]
  onEdit: (staff: Staff) => void
  onStatusClick: (staff: Staff) => void
}

export default function StaffListTab({
  staff,
  onEdit,
  onStatusClick
}: StaffListTabProps) {
  return (
    <StaffDataGrid
      rows={staff}
      onEdit={onEdit}
      onStatusClick={onStatusClick}
    />
  )
}
