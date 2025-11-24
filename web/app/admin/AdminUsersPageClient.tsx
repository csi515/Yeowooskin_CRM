'use client'

import { useState } from 'react'
import ApproveButton from './ApproveButton'
import UserDetailModal from './UserDetailModal'
import BatchApproveActions from './BatchApproveActions'
import type { PendingUser } from './page'

export default function AdminUsersPageClient({ pending }: { pending: PendingUser[] }) {
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  
  return (
    <main className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">사용자 승인 관리</h1>
        <p className="text-sm text-neutral-600">
          회원가입한 사용자들의 승인을 관리합니다. 승인된 사용자만 로그인할 수 있습니다.
        </p>
      </div>

      {pending.length === 0 ? (
        <div className="bg-white rounded-lg border border-neutral-200 p-8 text-center">
          <p className="text-neutral-500">승인 대기 중인 사용자가 없습니다.</p>
        </div>
      ) : (
        <>
          <BatchApproveActions
            selectedIds={Array.from(selectedIds)}
            onSuccess={() => {
              setSelectedIds(new Set())
              window.location.reload()
            }}
          />
          
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === pending.length && pending.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(new Set(pending.map(u => u.id)))
                          } else {
                            setSelectedIds(new Set())
                          }
                        }}
                        className="w-4 h-4 rounded border-neutral-300 text-action-blue-600 focus:ring-action-blue-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-900">이메일</th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-900">이름</th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-900">역할</th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-900">지점</th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-900">전화번호</th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-900">가입일</th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-900">동작</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {pending.map((u) => (
                    <tr key={u.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(u.id)}
                          onChange={(e) => {
                            const newSet = new Set(selectedIds)
                            if (e.target.checked) {
                              newSet.add(u.id)
                            } else {
                              newSet.delete(u.id)
                            }
                            setSelectedIds(newSet)
                          }}
                          className="w-4 h-4 rounded border-neutral-300 text-action-blue-600 focus:ring-action-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setSelectedUser(u)
                            setDetailOpen(true)
                          }}
                          className="text-action-blue-600 hover:text-action-blue-700 hover:underline text-left"
                        >
                          {u.email}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-neutral-700">{u.name || '-'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            u.role === 'OWNER'
                              ? 'bg-blue-100 text-blue-800'
                              : u.role === 'HQ'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {u.role === 'OWNER' ? '점주' : u.role === 'HQ' ? '본사' : '직원'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-700">
                        {u.branches ? (
                          <div>
                            <div className="font-medium">{u.branches.name}</div>
                            <div className="text-xs text-neutral-500">{u.branches.code}</div>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3 text-neutral-700">{u.phone || '-'}</td>
                      <td className="px-4 py-3 text-neutral-600">
                        {new Date(u.created_at).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <ApproveButton userId={u.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <UserDetailModal
            open={detailOpen}
            onClose={() => {
              setDetailOpen(false)
              setSelectedUser(null)
            }}
            user={selectedUser}
          />
        </>
      )}
    </main>
  )
}

