'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { Building, Users, Clock, UserPlus, CheckCircle } from 'lucide-react'
import { branchApi } from '@/app/lib/api/branches'
import type { Branch } from '@/types/entities'

interface HQSummary {
  totalBranches: number
  pendingUsers: number
  recentBranches: Branch[]
}

export default function HQDashboardSummary() {
  const router = useRouter()
  const [summary, setSummary] = useState<HQSummary>({
    totalBranches: 0,
    pendingUsers: 0,
    recentBranches: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSummary()
  }, [])

  const loadSummary = async () => {
    try {
      setLoading(true)
      
      // 지점 목록 조회
      const branches = await branchApi.list({ limit: 100 })
      
      // 승인 대기 사용자 수 조회
      const pendingRes = await fetch('/api/admin/pending-count', {
        credentials: 'include',
      })
      const pendingData = pendingRes.ok ? await pendingRes.json() : { count: 0 }
      
      setSummary({
        totalBranches: branches.length,
        pendingUsers: pendingData.count || 0,
        recentBranches: branches.slice(0, 3),
      })
    } catch (err) {
      console.error('Failed to load HQ summary:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="p-4 sm:p-5">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-neutral-200 rounded w-1/3"></div>
          <div className="h-4 bg-neutral-200 rounded w-2/3"></div>
          <div className="h-20 bg-neutral-200 rounded"></div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">본사 관리</h2>
          <p className="text-sm text-neutral-600 mt-1">전체 지점 및 사용자 현황</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <Building className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">전체 지점</span>
          </div>
          <div className="text-2xl font-bold text-blue-700">{summary.totalBranches}</div>
        </div>

        <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-5 w-5 text-amber-600" />
            <span className="text-sm font-medium text-amber-900">승인 대기</span>
          </div>
          <div className="text-2xl font-bold text-amber-700">{summary.pendingUsers}</div>
        </div>
      </div>

      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => router.push('/branches')}
        >
          <Building className="h-4 w-4 mr-2" />
          지점 관리
        </Button>
        {summary.pendingUsers > 0 && (
          <Button
            variant="primary"
            className="w-full justify-start"
            onClick={() => router.push('/admin')}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            승인 대기 사용자 ({summary.pendingUsers}명)
          </Button>
        )}
      </div>

      {summary.recentBranches.length > 0 && (
        <div className="mt-4 pt-4 border-t border-neutral-200">
          <h3 className="text-sm font-semibold text-neutral-900 mb-2">최근 지점</h3>
          <div className="space-y-2">
            {summary.recentBranches.map((branch) => (
              <div
                key={branch.id}
                className="flex items-center justify-between p-2 bg-neutral-50 rounded text-sm"
              >
                <div>
                  <div className="font-medium text-neutral-900">{branch.name}</div>
                  <div className="text-xs text-neutral-500">{branch.code}</div>
                </div>
                <button
                  onClick={() => router.push('/branches')}
                  className="text-xs text-pink-600 hover:text-pink-700"
                >
                  보기
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

