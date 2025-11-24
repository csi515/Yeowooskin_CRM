'use client'

import { useEffect, useState } from 'react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { useAppToast } from '@/app/lib/ui/toast'
import { useAuth } from '@/app/components/AuthProvider'
import { Lock } from 'lucide-react'

export default function AccountSettingsSection() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const toast = useAppToast()
  const { supabase } = useAuth()

  const handlePasswordChange = async () => {
    setError('')
    setSuccess('')

    // 유효성 검사
    if (!newPassword) {
      setError('새 비밀번호를 입력해주세요.')
      return
    }

    if (newPassword.length < 6) {
      setError('새 비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.')
      return
    }

    try {
      setLoading(true)
      
      // 현재 세션 확인
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        setError('세션을 확인할 수 없습니다. 다시 로그인해주세요.')
        setLoading(false)
        return
      }
      
      // 새 비밀번호로 업데이트
      const { error: updateError } = await supabase.auth.updateUser({ 
        password: newPassword 
      })

      if (updateError) {
        setError(updateError.message || '비밀번호 변경에 실패했습니다.')
        setLoading(false)
        return
      }

      setSuccess('비밀번호가 성공적으로 변경되었습니다.')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('비밀번호가 변경되었습니다.')
    } catch (err) {
      const message = err instanceof Error ? err.message : '비밀번호 변경 중 오류가 발생했습니다.'
      setError(message)
      toast.error('비밀번호 변경 실패', message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-6">
        <Lock className="h-5 w-5 text-[#F472B6]" />
        <h2 className="text-xl font-bold text-neutral-900">계정 설정</h2>
      </div>
      
      <div className="space-y-4">
        <div className="border-b border-neutral-200 pb-4">
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">비밀번호 변경</h3>
          
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg">
              {success}
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="새 비밀번호"
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value)
                setError('')
                setSuccess('')
              }}
              placeholder="새 비밀번호를 입력하세요 (최소 6자)"
              disabled={loading}
              helperText="비밀번호는 최소 6자 이상이어야 합니다."
            />
            
            <Input
              label="새 비밀번호 확인"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                setError('')
                setSuccess('')
              }}
              placeholder="새 비밀번호를 다시 입력하세요"
              disabled={loading}
            />
            
            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                onClick={handlePasswordChange}
                disabled={loading || !newPassword || !confirmPassword}
                loading={loading}
              >
                비밀번호 변경
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

