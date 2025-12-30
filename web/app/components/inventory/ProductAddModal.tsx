'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    FormControlLabel,
    Checkbox,
    Box,
    Typography,
    InputAdornment,
} from '@mui/material'
import { useAppToast } from '../../lib/ui/toast'
import { productsApi } from '../../lib/api/products'
import type { ProductCreateInput } from '@/types/entities'

interface ProductAddModalProps {
    open: boolean
    onClose: () => void
    onSuccess: () => void
}

interface FormData {
    name: string
    price: number
    description: string
    stock_count: number
    safety_stock: number
    active: boolean
}

interface FormErrors {
    name?: string
    price?: string
    stock_count?: string
    safety_stock?: string
}

export default function ProductAddModal({ open, onClose, onSuccess }: ProductAddModalProps) {
    const toast = useAppToast()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<FormData>({
        name: '',
        price: 0,
        description: '',
        stock_count: 0,
        safety_stock: 5,
        active: true,
    })
    const [errors, setErrors] = useState<FormErrors>({})
    const [touched, setTouched] = useState<Record<string, boolean>>({})

    // Reset form when modal opens
    useEffect(() => {
        if (open) {
            setFormData({
                name: '',
                price: 0,
                description: '',
                stock_count: 0,
                safety_stock: 5,
                active: true,
            })
            setErrors({})
            setTouched({})
        }
    }, [open])

    const validateField = (field: keyof FormData, value: any): string | undefined => {
        switch (field) {
            case 'name':
                if (!value || typeof value === 'string' && value.trim() === '') {
                    return '제품명은 필수입니다'
                }
                return undefined
            case 'price':
                if (value < 0) {
                    return '가격은 0 이상이어야 합니다'
                }
                return undefined
            case 'stock_count':
                if (value < 0) {
                    return '초기 재고는 0 이상이어야 합니다'
                }
                return undefined
            case 'safety_stock':
                if (value < 0) {
                    return '안전 재고는 0 이상이어야 합니다'
                }
                return undefined
            default:
                return undefined
        }
    }

    const handleFieldChange = (field: keyof FormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))

        // Clear error when field is being edited
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }))
        }
    }

    const handleFieldBlur = (field: keyof FormData) => {
        setTouched(prev => ({ ...prev, [field]: true }))
        const error = validateField(field, formData[field])
        if (error) {
            setErrors(prev => ({ ...prev, [field]: error }))
        }
    }

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {}
        let isValid = true

        // Check required fields
        const nameError = validateField('name', formData.name)
        if (nameError) {
            newErrors.name = nameError
            isValid = false
        }

        // Check other fields
        const priceError = validateField('price', formData.price)
        if (priceError) {
            newErrors.price = priceError
            isValid = false
        }

        const stockError = validateField('stock_count', formData.stock_count)
        if (stockError) {
            newErrors.stock_count = stockError
            isValid = false
        }

        const safetyError = validateField('safety_stock', formData.safety_stock)
        if (safetyError) {
            newErrors.safety_stock = safetyError
            isValid = false
        }

        setErrors(newErrors)
        setTouched({
            name: true,
            price: true,
            stock_count: true,
            safety_stock: true,
        })

        return isValid
    }

    const handleSubmit = async () => {
        if (!validateForm()) {
            return
        }

        try {
            setLoading(true)

            const productData: ProductCreateInput = {
                name: formData.name.trim(),
                active: formData.active,
                stock_count: formData.stock_count,
                safety_stock: formData.safety_stock,
            }

            // Optional fields
            if (formData.price > 0) {
                productData.price = formData.price
            }
            if (formData.description.trim()) {
                productData.description = formData.description.trim()
            }

            await productsApi.create(productData)

            toast.success('제품이 성공적으로 추가되었습니다')
            onSuccess()
            onClose()

        } catch (error: any) {
            console.error('Error creating product:', error)
            toast.error(error.message || '제품 추가에 실패했습니다')
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        if (!loading) {
            onClose()
        }
    }

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            disableEscapeKeyDown={loading}
        >
            <DialogTitle>제품 추가</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        label="제품명"
                        fullWidth
                        required
                        value={formData.name}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        onBlur={() => handleFieldBlur('name')}
                        error={Boolean(errors.name && touched.name)}
                        helperText={errors.name && touched.name ? errors.name : undefined}
                        disabled={loading}
                    />

                    <TextField
                        label="가격"
                        fullWidth
                        type="number"
                        value={formData.price}
                        onChange={(e) => handleFieldChange('price', Number(e.target.value) || 0)}
                        onBlur={() => handleFieldBlur('price')}
                        error={Boolean(errors.price && touched.price)}
                        helperText={errors.price && touched.price ? errors.price : "부가세 포함 여부는 별도 표시 기준을 따릅니다."}
                        InputProps={{
                            endAdornment: <InputAdornment position="end">원</InputAdornment>,
                        }}
                        disabled={loading}
                    />

                    <TextField
                        label="설명"
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="간단한 특징, 용량, 구성 등을 입력하세요"
                        value={formData.description}
                        onChange={(e) => handleFieldChange('description', e.target.value)}
                        disabled={loading}
                    />

                    <TextField
                        label="초기 재고 수량"
                        fullWidth
                        type="number"
                        value={formData.stock_count}
                        onChange={(e) => handleFieldChange('stock_count', Number(e.target.value) || 0)}
                        onBlur={() => handleFieldBlur('stock_count')}
                        error={Boolean(errors.stock_count && touched.stock_count)}
                        helperText={errors.stock_count && touched.stock_count ? errors.stock_count : "제품 등록 시 초기 재고 수량을 설정합니다"}
                        disabled={loading}
                    />

                    <TextField
                        label="안전 재고 수량"
                        fullWidth
                        type="number"
                        value={formData.safety_stock}
                        onChange={(e) => handleFieldChange('safety_stock', Number(e.target.value) || 0)}
                        onBlur={() => handleFieldBlur('safety_stock')}
                        error={Boolean(errors.safety_stock && touched.safety_stock)}
                        helperText={errors.safety_stock && touched.safety_stock ? errors.safety_stock : "재고가 이 수량 이하로 떨어지면 알림이 표시됩니다"}
                        disabled={loading}
                    />

                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={formData.active}
                                onChange={(e) => handleFieldChange('active', e.target.checked)}
                                disabled={loading}
                            />
                        }
                        label="활성 상태"
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>
                    취소
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading || !formData.name.trim()}
                >
                    {loading ? '저장 중...' : '저장'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
