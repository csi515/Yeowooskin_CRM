'use client'

import { useState, useMemo } from 'react'
import { Search, UserCheck, Users, Filter } from 'lucide-react'
import Input from '@/app/components/ui/Input'
import Button from '@/app/components/ui/Button'
import Card from '@/app/components/ui/Card'
import UserActionButtons from './UserActionButtons'

type PendingUser = {
    id: string
    email: string
    name: string | null
    phone: string | null
    birthdate: string | null
    approved: boolean
    created_at: string
}

interface Props {
    initialUsers: PendingUser[]
}

type FilterType = 'all' | 'pending' | 'approved'

export default function AdminUsersList({ initialUsers }: Props) {
    const [searchQuery, setSearchQuery] = useState('')
    const [filter, setFilter] = useState<FilterType>('pending')

    const filteredUsers = useMemo(() => {
        return initialUsers.filter((u) => {
            // 검색 필터
            const matchesSearch =
                !searchQuery ||
                u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.name?.toLowerCase().includes(searchQuery.toLowerCase())

            // 상태 필터
            const matchesFilter =
                filter === 'all' ||
                (filter === 'pending' && !u.approved) ||
                (filter === 'approved' && u.approved)

            return matchesSearch && matchesFilter
        })
    }, [initialUsers, searchQuery, filter])

    const pendingCount = initialUsers.filter((u) => !u.approved).length
    const approvedCount = initialUsers.filter((u) => u.approved).length

    return (
        <div className="space-y-6">
            {/* 헤더 및 통계 */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">사용자 관리</h1>
                    <p className="text-sm text-neutral-600 mt-1">
                        가입 요청을 승인하거나 거절할 수 있습니다.
                    </p>
                </div>
                <div className="flex gap-2">
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <UserCheck className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">
                            승인 대기: {pendingCount}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                        <Users className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-900">
                            승인 완료: {approvedCount}
                        </span>
                    </div>
                </div>
            </div>

            {/* 검색 및 필터 */}
            <Card>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                        <Input
                            placeholder="이메일 또는 이름으로 검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            leftIcon={<Search className="h-4 w-4 text-neutral-400" />}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant={filter === 'all' ? 'primary' : 'outline'}
                            size="md"
                            onClick={() => setFilter('all')}
                            leftIcon={<Filter className="h-4 w-4" />}
                        >
                            전체
                        </Button>
                        <Button
                            variant={filter === 'pending' ? 'primary' : 'outline'}
                            size="md"
                            onClick={() => setFilter('pending')}
                        >
                            대기 중
                        </Button>
                        <Button
                            variant={filter === 'approved' ? 'primary' : 'outline'}
                            size="md"
                            onClick={() => setFilter('approved')}
                        >
                            승인됨
                        </Button>
                    </div>
                </div>
            </Card>

            {/* 사용자 카드 그리드 */}
            {filteredUsers.length === 0 ? (
                <Card>
                    <div className="text-center py-12">
                        <Users className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                            사용자가 없습니다
                        </h3>
                        <p className="text-sm text-neutral-500">
                            {filter === 'pending'
                                ? '승인 대기 중인 사용자가 없습니다.'
                                : filter === 'approved'
                                    ? '승인된 사용자가 없습니다.'
                                    : '등록된 사용자가 없습니다.'}
                        </p>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredUsers.map((user) => (
                        <Card key={user.id}>
                            <div className="space-y-4">
                                {/* 헤더 */}
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-semibold text-neutral-900 truncate">
                                            {user.email}
                                        </h3>
                                        <div className="mt-1">
                                            {user.approved ? (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    승인됨
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                    승인 대기
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 사용자 정보 */}
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-neutral-600">
                                        <span className="font-medium">이름:</span>
                                        <span>{user.name || '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-neutral-600">
                                        <span className="font-medium">전화:</span>
                                        <span>{user.phone || '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-neutral-600">
                                        <span className="font-medium">생년월일:</span>
                                        <span>{user.birthdate || '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-neutral-600">
                                        <span className="font-medium">가입일:</span>
                                        <span>{new Date(user.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                {/* 액션 버튼 */}
                                {!user.approved && (
                                    <div className="pt-4 border-t border-neutral-200">
                                        <UserActionButtons userId={user.id} userName={user.name} />
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
