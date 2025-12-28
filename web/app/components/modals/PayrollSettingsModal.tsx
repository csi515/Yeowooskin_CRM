import { useState, useEffect } from 'react'
import { Box, Grid, Typography } from '@mui/material'
import { Save, Percent } from 'lucide-react'
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { useAppToast } from '../../lib/ui/toast'

interface PayrollSettingsModalProps {
    open: boolean
    onClose: () => void
    staffId: string
    staffName: string
    onSaved: () => void
}

interface SettingsForm {
    base_salary: number
    hourly_rate: number
    national_pension_rate: number
    health_insurance_rate: number
    employment_insurance_rate: number
    income_tax_rate: number
}

const DEFAULT_SETTINGS: SettingsForm = {
    base_salary: 0,
    hourly_rate: 9860, // 2024 minimum wage as default
    national_pension_rate: 4.5,
    health_insurance_rate: 3.545,
    employment_insurance_rate: 0.9,
    income_tax_rate: 3.3,
}

export default function PayrollSettingsModal({
    open,
    onClose,
    staffId,
    staffName,
    onSaved
}: PayrollSettingsModalProps) {
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState<SettingsForm>(DEFAULT_SETTINGS)
    const toast = useAppToast()

    useEffect(() => {
        if (open && staffId) {
            fetchSettings()
        }
    }, [open, staffId])

    const fetchSettings = async () => {
        try {
            const res = await fetch(`/api/payroll/settings?staff_id=${staffId}`)
            if (res.ok) {
                const data = await res.json()
                if (data) {
                    setForm({
                        base_salary: data.base_salary ?? 0,
                        hourly_rate: data.hourly_rate ?? 0,
                        national_pension_rate: (data.national_pension_rate ?? 0.045) * 100, // DB stores as decimal, UI uses percentage
                        health_insurance_rate: (data.health_insurance_rate ?? 0.03545) * 100,
                        employment_insurance_rate: (data.employment_insurance_rate ?? 0.009) * 100,
                        income_tax_rate: (data.income_tax_rate ?? 0.033) * 100,
                    })
                }
            }
        } catch (error) {
            console.error('Error fetching settings:', error)
            toast.error('설정을 불러오는데 실패했습니다')
        }
    }

    const handleSubmit = async () => {
        try {
            setSaving(true)
            const payload = {
                staff_id: staffId,
                base_salary: Number(form.base_salary),
                hourly_rate: Number(form.hourly_rate),
                national_pension_rate: Number(form.national_pension_rate) / 100,
                health_insurance_rate: Number(form.health_insurance_rate) / 100,
                employment_insurance_rate: Number(form.employment_insurance_rate) / 100,
                income_tax_rate: Number(form.income_tax_rate) / 100,
            }

            const res = await fetch('/api/payroll/settings', {
                method: 'PATCH', // API uses upsert logic on PATCH usually, checking fetch logic
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            if (!res.ok) throw new Error('Failed to save')

            toast.success('설정이 저장되었습니다')
            onSaved()
            onClose()
        } catch (error) {
            console.error('Error saving settings:', error)
            toast.error('저장에 실패했습니다')
        } finally {
            setSaving(false)
        }
    }

    const handleChange = (field: keyof SettingsForm, value: string) => {
        // Allow only numbers and decimals
        if (!/^\d*\.?\d*$/.test(value)) return
        setForm(prev => ({ ...prev, [field]: value }))
    }

    return (
        <Modal open={open} onClose={onClose} size="md">
            <ModalHeader title={`${staffName}님 급여 설정`} onClose={onClose} />
            <ModalBody>
                <Box className="space-y-6">
                    <Box>
                        <Typography variant="subtitle2" className="mb-3 font-bold text-gray-700">기본 급여 정보</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Input
                                    label="기본급 (월)"
                                    placeholder="0"
                                    value={form.base_salary}
                                    onChange={(e) => handleChange('base_salary', e.target.value)}
                                    rightIcon={<Typography variant="caption">원</Typography>}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Input
                                    label="시급 (기본급 없거나 초과근무시)"
                                    placeholder="9860"
                                    value={form.hourly_rate}
                                    onChange={(e) => handleChange('hourly_rate', e.target.value)}
                                    rightIcon={<Typography variant="caption">원</Typography>}
                                    fullWidth
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    <Box>
                        <Typography variant="subtitle2" className="mb-3 font-bold text-gray-700">공제 세율 설정 (%)</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Input
                                    label="국민연금"
                                    value={form.national_pension_rate}
                                    onChange={(e) => handleChange('national_pension_rate', e.target.value)}
                                    rightIcon={<Percent size={14} />}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <Input
                                    label="건강보험"
                                    value={form.health_insurance_rate}
                                    onChange={(e) => handleChange('health_insurance_rate', e.target.value)}
                                    rightIcon={<Percent size={14} />}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <Input
                                    label="고용보험"
                                    value={form.employment_insurance_rate}
                                    onChange={(e) => handleChange('employment_insurance_rate', e.target.value)}
                                    rightIcon={<Percent size={14} />}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <Input
                                    label="소득세 (3.3% 등)"
                                    value={form.income_tax_rate}
                                    onChange={(e) => handleChange('income_tax_rate', e.target.value)}
                                    rightIcon={<Percent size={14} />}
                                    fullWidth
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </Box>
            </ModalBody>
            <ModalFooter>
                <div className="flex justify-end gap-2 w-full">
                    <Button variant="ghost" onClick={onClose}>취소</Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        loading={saving}
                        leftIcon={<Save size={18} />}
                    >
                        저장하기
                    </Button>
                </div>
            </ModalFooter>
        </Modal>
    )
}
