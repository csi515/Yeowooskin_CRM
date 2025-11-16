'use client'

import { useState, useEffect } from 'react'
import type { Project } from '@/app/lib/mock/projects'
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../ui/Modal'
import Button from '../ui/Button'
import Textarea from '../ui/Textarea'

export default function EditProjectModal({
  open,
  project,
  onClose,
  onSave
}: {
  open: boolean
  project: Project | null
  onClose: () => void
  onSave: (title: string, content: string) => void
}) {
  const [title, setTitle] = useState(project?.title || '')
  const [content, setContent] = useState(project?.content || '')

  useEffect(() => {
    setTitle(project?.title || '')
    setContent(project?.content || '')
  }, [project])

  if (!open || !project) return null
  return (
    <Modal open={open} onClose={onClose} size="lg">
      <ModalHeader title="프로젝트 수정" description="프로젝트의 제목과 내용을 수정합니다. 저장 시 즉시 반영됩니다." />
      <ModalBody>
        <div className="grid gap-4 md:grid-cols-[240px,1fr]">
          <div />
          <div className="md:pl-6 md:border-l md:border-neutral-200 space-y-3">
            <div className="crm-section space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">제목</label>
                <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm text-gray-700 outline-none shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
              </div>
              <div>
                <Textarea
                  label="내용"
                  value={content}
                  onChange={e=>setContent(e.target.value)}
                  rows={5}
                />
              </div>
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>취소</Button>
        <Button variant="primary" onClick={() => onSave(title.trim(), content.trim())}>저장</Button>
      </ModalFooter>
    </Modal>
  )
}



