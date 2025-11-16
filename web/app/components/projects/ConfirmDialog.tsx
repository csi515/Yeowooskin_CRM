'use client'

import Modal, { ModalBody, ModalFooter, ModalHeader } from '../ui/Modal'

export default function ConfirmDialog({
  open,
  title = '정말 삭제하시겠어요?',
  description = '이 동작은 되돌릴 수 없습니다. 계속하시려면 삭제를 눌러주세요.',
  confirmText = '삭제',
  cancelText = '취소',
  onConfirm,
  onCancel
}: {
  open: boolean
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null
  return (
    <Modal open={open} onClose={onCancel} size="sm">
      <ModalHeader title={title} />
      <ModalBody>
        <p className="text-sm text-neutral-600">{description}</p>
      </ModalBody>
      <ModalFooter>
        <button onClick={onCancel} className="h-9 px-3 rounded-xl text-sm bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 shadow-sm"> {cancelText} </button>
        <button onClick={onConfirm} className="h-9 px-3 rounded-xl text-sm bg-red-600 hover:bg-red-700 text-white shadow-sm"> {confirmText} </button>
      </ModalFooter>
    </Modal>
  )
}


