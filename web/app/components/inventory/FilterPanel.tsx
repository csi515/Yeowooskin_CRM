'use client'

import {
    Box,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Stack,
    Chip,
    Button
} from '@mui/material'
import { ChevronDown, RotateCcw } from 'lucide-react'

export interface InventoryFilters {
    status: string
    minPrice: string
    maxPrice: string
    minStock: string
    maxStock: string
}

interface FilterPanelProps {
    filters: InventoryFilters
    onFilterChange: (filters: InventoryFilters) => void
    onReset: () => void
}

export default function FilterPanel({ filters, onFilterChange, onReset }: FilterPanelProps) {
    const handleChange = (key: keyof InventoryFilters, value: string) => {
        onFilterChange({
            ...filters,
            [key]: value
        })
    }

    const activeFilterCount = Object.values(filters).filter(v => v !== '').length

    const hasActiveFilters = activeFilterCount > 0

    return (
        <Accordion>
            <AccordionSummary expandIcon={<ChevronDown />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1" fontWeight={600}>
                        필터
                    </Typography>
                    {hasActiveFilters && (
                        <Chip label={`${activeFilterCount}개 적용됨`} size="small" color="primary" />
                    )}
                </Box>
            </AccordionSummary>
            <AccordionDetails>
                <Stack spacing={2}>
                    {/* Status Filter */}
                    <FormControl fullWidth size="small">
                        <InputLabel>재고 상태</InputLabel>
                        <Select
                            value={filters.status}
                            onChange={(e) => handleChange('status', e.target.value)}
                            label="재고 상태"
                        >
                            <MenuItem value="">전체</MenuItem>
                            <MenuItem value="normal">정상</MenuItem>
                            <MenuItem value="low_stock">재고 부족</MenuItem>
                            <MenuItem value="out_of_stock">품절</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Price Range */}
                    <Box>
                        <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                            가격 범위
                        </Typography>
                        <Stack direction="row" spacing={1}>
                            <TextField
                                size="small"
                                type="number"
                                placeholder="최소"
                                value={filters.minPrice}
                                onChange={(e) => handleChange('minPrice', e.target.value)}
                                fullWidth
                            />
                            <Typography sx={{ alignSelf: 'center' }}>-</Typography>
                            <TextField
                                size="small"
                                type="number"
                                placeholder="최대"
                                value={filters.maxPrice}
                                onChange={(e) => handleChange('maxPrice', e.target.value)}
                                fullWidth
                            />
                        </Stack>
                    </Box>

                    {/* Stock Range */}
                    <Box>
                        <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                            재고 수량 범위
                        </Typography>
                        <Stack direction="row" spacing={1}>
                            <TextField
                                size="small"
                                type="number"
                                placeholder="최소"
                                value={filters.minStock}
                                onChange={(e) => handleChange('minStock', e.target.value)}
                                fullWidth
                            />
                            <Typography sx={{ alignSelf: 'center' }}>-</Typography>
                            <TextField
                                size="small"
                                type="number"
                                placeholder="최대"
                                value={filters.maxStock}
                                onChange={(e) => handleChange('maxStock', e.target.value)}
                                fullWidth
                            />
                        </Stack>
                    </Box>

                    {/* Reset Button */}
                    {hasActiveFilters && (
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<RotateCcw size={16} />}
                            onClick={onReset}
                        >
                            필터 초기화
                        </Button>
                    )}
                </Stack>
            </AccordionDetails>
        </Accordion>
    )
}
