'use client'

import { useState } from 'react'
import { TextField, InputAdornment, IconButton } from '@mui/material'
import { Search, X } from 'lucide-react'

interface SearchBarProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    fullWidth?: boolean
}

export default function SearchBar({ value, onChange, placeholder = '제품명 검색...', fullWidth = true }: SearchBarProps) {
    const [localValue, setLocalValue] = useState(value)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value
        setLocalValue(newValue)

        // Debounce: call onChange after 300ms of no typing
        const timeoutId = setTimeout(() => {
            onChange(newValue)
        }, 300)

        return () => clearTimeout(timeoutId)
    }

    const handleClear = () => {
        setLocalValue('')
        onChange('')
    }

    return (
        <TextField
            value={localValue}
            onChange={handleChange}
            placeholder={placeholder}
            fullWidth={fullWidth}
            size="small"
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <Search size={20} />
                    </InputAdornment>
                ),
                endAdornment: localValue && (
                    <InputAdornment position="end">
                        <IconButton size="small" onClick={handleClear}>
                            <X size={18} />
                        </IconButton>
                    </InputAdornment>
                ),
            }}
        />
    )
}
