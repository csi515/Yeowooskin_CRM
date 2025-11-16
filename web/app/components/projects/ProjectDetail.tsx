'use client'

import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Project } from '@/app/lib/mock/projects'
import { updateProject, deleteProject } from '@/app/lib/mock/projects'
import EditProjectModal from './EditProjectModal'
import ConfirmDialog from './ConfirmDialog'

export default function ProjectDetail({ project }: { project: Project }) {
  const router = useRouter()
  const [current, setCurrent] = useState<Project>(project)
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const onSave = (title: string, content: string) => {
    if (!title) return
    const next = updateProject(current.id, { title, content })
    if (next) setCurrent(next)
    setEditing(false)
  }

  const onDelete = () => {
    deleteProject(current.id)
    setConfirming(false)
    router.replace('/projects')
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-neutral-100 p-5 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight">{current.title}</h2>
          <p className="mt-2 text-neutral-700 whitespace-pre-wrap">{current.content}</p>
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-4 border-t border-neutral-100 mt-6">
        <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1 px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white">
          <Pencil className="h-4 w-4" /> 수정
        </button>
        <button onClick={() => setConfirming(true)} className="inline-flex items-center gap-1 px-3 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white">
          <Trash2 className="h-4 w-4" /> 삭제
        </button>
      </div>

      <EditProjectModal open={editing} project={current} onClose={() => setEditing(false)} onSave={onSave} />
      <ConfirmDialog open={confirming} onCancel={() => setConfirming(false)} onConfirm={onDelete} />
    </div>
  )
}


