'use client'

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Grid,
    Paper,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Divider
} from '@mui/material'
import { type Staff, type PayrollCalculationResult } from '@/types/payroll'

interface PayrollCalculationModalProps {
    open: boolean
    onClose: () => void
    staff: Staff[]
    selectedStaffId: string
    selectedMonth: string
    calculationResult: PayrollCalculationResult | null
    onStaffChange: (staffId: string) => void
    onMonthChange: (month: string) => void
    onCalculate: () => void
}

export default function PayrollCalculationModal({
    open,
    onClose,
    staff,
    selectedStaffId,
    selectedMonth,
    calculationResult,
    onStaffChange,
    onMonthChange,
    onCalculate
}: PayrollCalculationModalProps) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>급여 자동 계산</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControl fullWidth>
                        <InputLabel>직원 선택</InputLabel>
                        <Select
                            value={selectedStaffId}
                            onChange={(e) => onStaffChange(e.target.value)}
                            label="직원 선택"
                        >
                            {staff.map((s) => (
                                <MenuItem key={s.id} value={s.id}>
                                    {s.name} {s.role && `(${s.role})`}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField
                        type="month"
                        label="계산 월"
                        value={selectedMonth}
                        onChange={(e) => onMonthChange(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                    />

                    {calculationResult && (
                        <Box sx={{ mt: 2 }}>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="h6" gutterBottom>
                                계산 결과
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Paper variant="outlined" sx={{ p: 2 }}>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            총 근무시간
                                        </Typography>
                                        <Typography variant="h6">
                                            {calculationResult.calculation_details?.total_work_hours || 0}시간
                                        </Typography>
                                    </Paper>
                                </Grid>

                                <Grid item xs={4}>
                                    <Paper variant="outlined" sx={{ p: 2 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            기본급
                                        </Typography>
                                        <Typography variant="body1" fontWeight={600}>
                                            ₩{(calculationResult.calculation_details?.base_salary || 0).toLocaleString()}
                                        </Typography>
                                    </Paper>
                                </Grid>

                                <Grid item xs={4}>
                                    <Paper variant="outlined" sx={{ p: 2 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            시급
                                        </Typography>
                                        <Typography variant="body1" fontWeight={600}>
                                            ₩{(calculationResult.calculation_details?.hourly_pay || 0).toLocaleString()}
                                        </Typography>
                                    </Paper>
                                </Grid>

                                <Grid item xs={4}>
                                    <Paper variant="outlined" sx={{ p: 2 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            인센티브
                                        </Typography>
                                        <Typography variant="body1" fontWeight={600}>
                                            ₩{(calculationResult.calculation_details?.incentive_pay || 0).toLocaleString()}
                                        </Typography>
                                    </Paper>
                                </Grid>

                                <Grid item xs={12}>
                                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'success.light' }}>
                                        <Typography variant="body2" color="success.dark" gutterBottom>
                                            총 지급액 (세전)
                                        </Typography>
                                        <Typography variant="h5" fontWeight={700}>
                                            ₩{(calculationResult.calculation_details?.total_gross || 0).toLocaleString()}
                                        </Typography>
                                    </Paper>
                                </Grid>

                                <Grid item xs={12}>
                                    <Typography variant="body2" fontWeight={600} gutterBottom>
                                        공제 내역
                                    </Typography>
                                    <Grid container spacing={1}>
                                        <Grid item xs={6}>
                                            <Typography variant="caption">국민연금</Typography>
                                            <Typography variant="body2">
                                                -₩{(calculationResult.calculation_details?.deductions?.national_pension || 0).toLocaleString()}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption">건강보험</Typography>
                                            <Typography variant="body2">
                                                -₩{(calculationResult.calculation_details?.deductions?.health_insurance || 0).toLocaleString()}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption">고용보험</Typography>
                                            <Typography variant="body2">
                                                -₩{(calculationResult.calculation_details?.deductions?.employment_insurance || 0).toLocaleString()}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption">소득세</Typography>
                                            <Typography variant="body2">
                                                -₩{(calculationResult.calculation_details?.deductions?.income_tax || 0).toLocaleString()}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Grid>

                                <Grid item xs={12}>
                                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'primary.light' }}>
                                        <Typography variant="body2" color="primary.dark" gutterBottom>
                                            실지급액 (세후)
                                        </Typography>
                                        <Typography variant="h4" fontWeight={700}>
                                            ₩{(calculationResult.calculation_details?.net_salary || 0).toLocaleString()}
                                        </Typography>
                                    </Paper>
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>닫기</Button>
                {!calculationResult && (
                    <Button onClick={onCalculate} variant="contained">
                        계산하기
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    )
}
