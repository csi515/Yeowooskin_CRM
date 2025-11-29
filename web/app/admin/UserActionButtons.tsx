'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle } from 'lucide-react'
import Button from '@/app/components/ui/Button'
import Modal from '@/app/components/ui/Modal'
import { ModalBody, ModalFooter } from '@/app/components/ui/Modal'
import { useAppToast } from '@/app/lib/ui/toast'

interface Props {
    userId: string
    userName?: string | null
}

export default function UserActionButtons({ userId, userName }: Props) {
    const router = useRouter()
    const toast = useAppToast()
    const [pending, startTransition] = useTransition()
    const [showRejectModal, setShowRejectModal] = useState(false)
    const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null)

    const handleApprove = () => {
        setActionType('approve')
        startTransition(async () => {
            try {
                const { adminApi } = await import('@/app/lib/api/admin')
                await adminApi.approveUser({ userId, approved: true })
                toast.success('사용자가 승인되었습니다.')
                router.refresh()
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : '승인 실패'
                toast.error('승인 실패', errorMessage)
            } finally {
                setActionType(null)
            }
        })
    }

    const handleReject = () => {
        setShowRejectModal(true)
    }

    const confirmReject = () => {
        setActionType('reject')
        setShowRejectModal(false)
        startTransition(async () => {
            try {
                const { adminApi } = await import('@/app/lib/api/admin')
                await adminApi.rejectUser(userId)
                toast.success('사용자가 거절되었습니다.')
                router.refresh()
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : '거절 실패'
                toast.error('거절 실패', errorMessage)
            } finally {
                setActionType(null)
            }
        })
    }

    const isApproving = pending && actionType === 'approve'
    const isRejecting = pending && actionType === 'reject'

    return (
        <>
            <div className="flex items-center gap-2">
                <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<CheckCircle className="h-4 w-4" />}
                    loading={isApproving}
                    disabled={pending}
                    onClick={handleApprove}
                >
                    승인
                </Button>
                <Button
                    variant="danger"
                    size="sm"
                    leftIcon={<XCircle className="h-4 w-4" />}
                    loading={isRejecting}
                    disabled={pending}
                    onClick={handleReject}
                >
                    거절
                </Button>
            </div>

            {/* 거절 확인 모달 */}
            <Modal open={showRejectModal} onClose={() => setShowRejectModal(false)} size="md">
                <ModalBody>
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-neutral-900">사용자 거절</h3>
                        <p className="text-sm text-neutral-600">
                            {userName ? `${userName}` : '이 사용자'}의 가입 요청을 거절하시겠습니까?
                        </p>
                        <p className="text-sm font-semibold text-rose-600">
                            거절된 사용자는 로그인할 수 없습니다.
                        </p>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
                        취소
                    </Button>
                    <Button variant="danger" onClick={confirmReject}>
                        거절
                    </Button>
                </ModalFooter>
            </Modal>
        </>
    )
}
