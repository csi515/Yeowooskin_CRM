'use client'

import { Users, Clock, Calendar, TrendingUp } from 'lucide-react'
import { Grid, Paper, Typography, Box } from '@mui/material'
import { StaffStats } from '@/types/staff'

interface StaffStatsCardsProps {
  stats: StaffStats
  schedulesCount: number
}

export default function StaffStatsCards({ stats, schedulesCount }: StaffStatsCardsProps) {
  return (
    <>
      <Box sx={{ mb: 1 }}>
        <Typography variant="h6" fontWeight={600} color="text.primary" sx={{ mb: 3 }}>
          대시보드 개요
        </Typography>
      </Box>
      <Grid container spacing={3}>
        {[
          {
            label: '전체 직원',
            value: stats.total,
            color: 'primary',
            bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            icon: <Users size={24} />,
            description: '등록된 총 직원 수'
          },
          {
            label: '현재 근무 중',
            value: stats.atOffice,
            color: 'success',
            bgColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            icon: <Clock size={24} />,
            description: '실시간 근무 현황'
          },
          {
            label: '현재 휴무 중',
            value: stats.away,
            color: 'warning',
            bgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            icon: <Calendar size={24} />,
            description: '휴가 및 외출 중'
          },
          {
            label: '이번달 스케줄',
            value: schedulesCount,
            color: 'info',
            bgColor: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)',
            icon: <TrendingUp size={24} />,
            description: '등록된 근무 스케줄'
          },
        ].map((s) => (
          <Grid item xs={12} sm={6} lg={3} key={s.label}>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: 'white',
                border: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                },
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* 배경 그라데이션 */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '120px',
                  height: '120px',
                  background: s.bgColor,
                  borderRadius: '50%',
                  transform: 'translate(40px, -40px)',
                  opacity: 0.1,
                  zIndex: 0
                }}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative', zIndex: 1 }}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    background: s.bgColor,
                    color: 'white',
                    display: 'flex',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                >
                  {s.icon}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mb: 0.5 }}>
                    {s.label}
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="text.primary" sx={{ mb: 0.5 }}>
                    {s.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {s.description}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </>
  )
}
