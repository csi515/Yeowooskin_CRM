'use client'

import React from 'react'
import TextField from '@mui/material/TextField'
import type { TextFieldProps } from '@mui/material/TextField'

type Props = Omit<TextFieldProps, 'variant' | 'error'> & {
  label?: string
  helpText?: string
  variant?: 'outlined' | 'filled' | 'standard'
  error?: boolean | string
}

const Textarea = ({ label, helpText, error, className = '', required, variant = 'outlined', ...rest }: Props) => {
  return (
    <TextField
      label={label}
      multiline
      minRows={3}
      variant={variant}
      error={!!error}
      helperText={typeof error === 'string' ? error : helpText}
      fullWidth
      required={!!required}
      className={className} // Can affect container
      sx={{
        '& .MuiInputBase-root': {
          borderRadius: 2
        }
      }}
      {...rest}
    />
  )
}

Textarea.displayName = 'Textarea'

export default Textarea
