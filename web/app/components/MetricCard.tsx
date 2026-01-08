import { memo } from 'react'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'

function MetricCard({
  label,
  value,
  delta,
  hint,
  className = '',
  colorIndex = 0,
}: {
  label: string
  value: string | number
  delta?: { value: string; tone?: 'up' | 'down' | 'neutral' }
  hint?: string
  className?: string
  colorIndex?: number
}) {
  const colorSchemes = [
    { bg: 'linear-gradient(135deg, #fdf2f8 0%, #ffe4e6 100%)', border: '#fbcfe8', text: '#be185d', tone: 'pink' }, // Pink/Rose
    { bg: 'linear-gradient(135deg, #eff6ff 0%, #cffafe 100%)', border: '#bfdbfe', text: '#1d4ed8', tone: 'blue' }, // Blue/Cyan
    { bg: 'linear-gradient(135deg, #ecfdf5 0%, #ccfbf1 100%)', border: '#a7f3d0', text: '#047857', tone: 'emerald' }, // Emerald/Teal
    { bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', border: '#fde68a', text: '#b45309', tone: 'amber' }, // Amber/Yellow
    { bg: 'linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%)', border: '#e9d5ff', text: '#7e22ce', tone: 'purple' }, // Purple/Violet
    { bg: 'linear-gradient(135deg, #eef2ff 0%, #dbeafe 100%)', border: '#c7d2fe', text: '#4338ca', tone: 'indigo' }, // Indigo/Blue
  ]

  const scheme = colorSchemes[colorIndex % colorSchemes.length] ?? colorSchemes[0]!

  const getDeltaColor = () => {
    if (delta?.tone === 'up') return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' }
    if (delta?.tone === 'down') return { bg: '#fff1f2', text: '#e11d48', border: '#fecdd3' }
    return { bg: '#f9fafb', text: '#4b5563', border: '#e5e7eb' }
  }
  const deltaColor = getDeltaColor()

  return (
    <Paper
      elevation={0}
      sx={{
        background: scheme.bg,
        borderRadius: 3, // 12px
        border: `2px solid ${scheme.border}`,
        p: { xs: 1.5, md: 3 }, // Compact padding
        height: '100%',
        transition: 'all 300ms ease-out',
        '&:hover': {
          boxShadow: { xs: 'none', md: 3 }, // shadow-lg
        }
      }}
      className={className}
    >
      <Typography variant="body2" fontWeight={500} sx={{ color: scheme.text, opacity: 0.9, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
        {label}
      </Typography>
      <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="h4" fontWeight={700} sx={{ color: scheme.text, letterSpacing: '-0.02em', fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2rem' }, wordBreak: 'break-all' }}>
          {value}
        </Typography>
        {delta?.value && (
          <Chip
            label={delta.value}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.75rem',
              bgcolor: deltaColor.bg,
              color: deltaColor.text,
              border: `1px solid ${deltaColor.border}`
            }}
          />
        )}
      </Box>
      {hint && (
        <Typography variant="caption" sx={{ mt: 1, display: 'block', color: scheme.text, opacity: 0.7 }}>
          {hint}
        </Typography>
      )}
    </Paper>
  )
}

export default memo(MetricCard)
