'use client'

import { useState, useEffect } from 'react'
import { Box, Grid, Typography, Divider, Chip } from '@mui/material'
import { Edit, Save, DollarSign, FileText, User, Calendar } from 'lucide-react'
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Textarea from '../ui/Textarea'
import { useAppToast } from '../../lib/ui/toast'
import type { PayrollRecord } from '@/types/entities'

interface PayrollDetailModalProps {
    open: boolean
    onClose: () => void
    record: PayrollRecord | null
    staffName?: string | undefined
    onSaved: () => void
}

interface EditableFields {
    base_salary: number
    overtime_pay: number
    incentive_pay: number
    memo: string
}

export default function PayrollDetailModal({
    open,
    onClose,
    record,
    staffName,
    onSaved
}: PayrollDetailModalProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState<EditableFields>({
        base_salary: 0,
        overtime_pay: 0,
        incentive_pay: 0,
        memo: ''
    })
    const toast = useAppToast()

    // 모달이 열리거나 record가 변경될 때 폼 데이터 초기화
    useEffect(() => {
        if (record && open) {
            setFormData({
                base_salary: record.base_salary || 0,
                overtime_pay: record.overtime_pay || 0,
                incentive_pay: record.incentive_pay || 0,
                memo: record.memo || ''
            })
            setIsEditing(false)
        }
    }, [record, open])

    const handleSave = async () => {
        if (!record) return

        try {
            setSaving(true)

            // 총 지급액 재계산
            const totalGross = formData.base_salary + formData.overtime_pay + formData.incentive_pay

            // 공제액 재계산 (기존 비율 유지)
            const deductions = record.total_deductions || 0
            const netSalary = totalGross - deductions

            const updateData = {
                base_salary: formData.base_salary,
                overtime_pay: formData.overtime_pay,
                incentive_pay: formData.incentive_pay,
                total_gross: totalGross,
                total_deductions: deductions,
                net_salary: netSalary,
                memo: formData.memo
            }

            const response = await fetch('/api/payroll/records', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    staff_id: record.staff_id,
                    month: record.month,
                    ...updateData
                })
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || '급여 수정에 실패했습니다')
            }

            toast.success('급여 정보가 수정되었습니다')
            setIsEditing(false)
            onSaved()
        } catch (error) {
            console.error('Error updating payroll:', error)
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
            toast.error(`급여 수정 실패: ${errorMessage}`)
        } finally {
            setSaving(false)
        }
    }

    const handleFieldChange = (field: keyof EditableFields, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            [field]: field === 'memo' ? value : Number(value) || 0
        }))
    }

    if (!record) return null

    const totalGross = formData.base_salary + formData.overtime_pay + formData.incentive_pay
    const totalDeductions = record.total_deductions || 0
    const netSalary = totalGross - totalDeductions

    return (
        <Modal open={open} onClose={onClose} size="xl">
            <ModalHeader title={`${staffName || '직원'} 급여 상세`} onClose={onClose} />

            <ModalBody>
                <Box className="space-y-6">
                    {/* 기본 정보 */}
                    <Box className="bg-gray-50 p-4 rounded-lg">
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <Box className="flex items-center gap-2 mb-2">
                                    <User size={16} className="text-gray-500" />
                                    <Typography variant="body2" color="text.secondary">직원</Typography>
                                </Box>
                                <Typography variant="body1" fontWeight={600}>
                                    {staffName || '직원'}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Box className="flex items-center gap-2 mb-2">
                                    <Calendar size={16} className="text-gray-500" />
                                    <Typography variant="body2" color="text.secondary">급여 월</Typography>
                                </Box>
                                <Typography variant="body1" fontWeight={600}>
                                    {record.month}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* 수정 모드 토글 */}
                    <Box className="flex justify-between items-center">
                        <Typography variant="h6" fontWeight={600}>급여 내역</Typography>
                        <Button
                            variant={isEditing ? "secondary" : "primary"}
                            size="sm"
                            leftIcon={isEditing ? <Save size={16} /> : <Edit size={16} />}
                            onClick={() => {
                                if (isEditing) {
                                    handleSave()
                                } else {
                                    setIsEditing(true)
                                }
                            }}
                            loading={saving}
                        >
                            {isEditing ? '저장' : '수정'}
                        </Button>
                    </Box>

                    <Divider />

                    {/* 급여 항목 */}
                    <Grid container spacing={3}>
                        {/* 지급 항목 */}
                        <Grid item xs={12} md={6}>
                            <Box className="bg-green-50 p-4 rounded-lg border border-green-200">
                                <Typography variant="subtitle1" fontWeight={600} color="success.main" className="mb-3">
                                    지급 항목
                                </Typography>

                                <Box className="space-y-3">
                                    <Box className="flex justify-between items-center">
                                        <Typography variant="body2">기본급</Typography>
                                        {isEditing ? (
                                            <Input
                                                value={formData.base_salary}
                                                onChange={(e) => handleFieldChange('base_salary', e.target.value)}
                                                size="sm"
                                                className="w-32"
                                                rightIcon={<Typography variant="caption">원</Typography>}
                                            />
                                        ) : (
                                            <Typography variant="body2" fontWeight={600}>
                                                ₩{record.base_salary.toLocaleString()}
                                            </Typography>
                                        )}
                                    </Box>

                                    <Box className="flex justify-between items-center">
                                        <Typography variant="body2">연장/시급 수당</Typography>
                                        {isEditing ? (
                                            <Input
                                                value={formData.overtime_pay}
                                                onChange={(e) => handleFieldChange('overtime_pay', e.target.value)}
                                                size="sm"
                                                className="w-32"
                                                rightIcon={<Typography variant="caption">원</Typography>}
                                            />
                                        ) : (
                                            <Typography variant="body2" fontWeight={600}>
                                                ₩{record.overtime_pay.toLocaleString()}
                                            </Typography>
                                        )}
                                    </Box>

                                    <Box className="flex justify-between items-center">
                                        <Typography variant="body2">인센티브</Typography>
                                        {isEditing ? (
                                            <Input
                                                value={formData.incentive_pay}
                                                onChange={(e) => handleFieldChange('incentive_pay', e.target.value)}
                                                size="sm"
                                                className="w-32"
                                                rightIcon={<Typography variant="caption">원</Typography>}
                                            />
                                        ) : (
                                            <Typography variant="body2" fontWeight={600}>
                                                ₩{record.incentive_pay.toLocaleString()}
                                            </Typography>
                                        )}
                                    </Box>

                                    <Divider />

                                    <Box className="flex justify-between items-center">
                                        <Typography variant="body1" fontWeight={600}>총 지급액</Typography>
                                        <Typography variant="body1" fontWeight={700} color="success.main">
                                            ₩{totalGross.toLocaleString()}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Grid>

                        {/* 공제 항목 */}
                        <Grid item xs={12} md={6}>
                            <Box className="bg-red-50 p-4 rounded-lg border border-red-200">
                                <Typography variant="subtitle1" fontWeight={600} color="error.main" className="mb-3">
                                    공제 항목
                                </Typography>

                                <Box className="space-y-2">
                                    <Box className="flex justify-between items-center">
                                        <Typography variant="body2">국민연금</Typography>
                                        <Typography variant="body2" color="error.main">
                                            -₩{record.national_pension.toLocaleString()}
                                        </Typography>
                                    </Box>

                                    <Box className="flex justify-between items-center">
                                        <Typography variant="body2">건강보험</Typography>
                                        <Typography variant="body2" color="error.main">
                                            -₩{record.health_insurance.toLocaleString()}
                                        </Typography>
                                    </Box>

                                    <Box className="flex justify-between items-center">
                                        <Typography variant="body2">고용보험</Typography>
                                        <Typography variant="body2" color="error.main">
                                            -₩{record.employment_insurance.toLocaleString()}
                                        </Typography>
                                    </Box>

                                    <Box className="flex justify-between items-center">
                                        <Typography variant="body2">소득세</Typography>
                                        <Typography variant="body2" color="error.main">
                                            -₩{record.income_tax.toLocaleString()}
                                        </Typography>
                                    </Box>

                                    <Divider />

                                    <Box className="flex justify-between items-center">
                                        <Typography variant="body1" fontWeight={600}>총 공제액</Typography>
                                        <Typography variant="body1" fontWeight={600} color="error.main">
                                            -₩{totalDeductions.toLocaleString()}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>

                    {/* 최종 금액 */}
                    <Box className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <Box className="flex justify-between items-center">
                            <Typography variant="h6" fontWeight={700}>실지급액</Typography>
                            <Typography variant="h5" fontWeight={700} color="primary.main">
                                ₩{netSalary.toLocaleString()}
                            </Typography>
                        </Box>
                    </Box>

                    {/* 메모 */}
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600} className="mb-2">메모</Typography>
                        {isEditing ? (
                            <Textarea
                                value={formData.memo}
                                onChange={(e) => handleFieldChange('memo', e.target.value)}
                                placeholder="급여 관련 메모를 입력하세요"
                                rows={3}
                            />
                        ) : (
                            <Box className="bg-gray-50 p-3 rounded border min-h-[80px]">
                                <Typography variant="body2" color={record.memo ? 'text.primary' : 'text.secondary'}>
                                    {record.memo || '메모가 없습니다'}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
            </ModalBody>

            <ModalFooter>
                <div className="flex justify-end gap-2 w-full">
                    <Button variant="ghost" onClick={onClose}>닫기</Button>
                    {isEditing && (
                        <Button
                            variant="primary"
                            onClick={handleSave}
                            loading={saving}
                            leftIcon={<Save size={18} />}
                        >
                            저장하기
                        </Button>
                    )}
                </div>
            </ModalFooter>
        </Modal>
    )
}
