'use client'

import { AlertTriangle } from 'lucide-react'
import clsx from 'clsx'
import Modal, { ModalBody, ModalFooter, ModalHeader } from './Modal'
import Button from './Button'

type Props = {
  open: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
  loading?: boolean
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  variant = 'warning',
  loading = false
}: Props) {
  const handleConfirm = async () => {
    await onConfirm()
    onClose()
  }

  const variantStyles = {
    danger: 'text-error-600',
    warning: 'text-warning-600',
    info: 'text-secondary-600'
  }

  const confirmButtonVariant = variant === 'danger' ? 'danger' : 'primary'

  return (
    <Modal open={open} onClose={onClose} size="sm" closeOnOutsideClick={!loading}>
      <ModalHeader
        title={title}
        icon={<AlertTriangle className={clsx('h-5 w-5', variantStyles[variant])} />}
      />
      <ModalBody>
        <p className="text-base text-neutral-700 leading-relaxed">{message}</p>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={loading}
          className="w-full md:w-auto"
        >
          {cancelLabel}
        </Button>
        <Button
          variant={confirmButtonVariant}
          onClick={handleConfirm}
          disabled={loading}
          loading={loading}
          className="w-full md:w-auto"
        >
          {confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
