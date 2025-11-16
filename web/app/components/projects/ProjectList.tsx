'use client'

import Link from 'next/link'
import { Pencil } from 'lucide-react'
import type { Project } from '@/app/lib/mock/projects'

export default function ProjectList({ projects }: { projects: Project[] }) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-neutral-100">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-neutral-600 border-b border-neutral-100">
            <tr>
              <th className="px-4 py-3 font-medium">제목</th>
              <th className="px-4 py-3 font-medium">최근 수정</th>
              <th className="px-4 py-3 font-medium w-40 text-right">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {projects.map((p) => (
              <tr key={p.id} className="hover:bg-neutral-50/60">
                <td className="px-4 py-3">{p.title}</td>
                <td className="px-4 py-3 text-neutral-500">{new Date(p.updatedAt).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <Link
                      href={`/projects/${p.id}`}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-neutral-200 hover:bg-neutral-100"
                      aria-label="상세보기"
                      title="상세보기"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-neutral-500" colSpan={3}>프로젝트가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}


