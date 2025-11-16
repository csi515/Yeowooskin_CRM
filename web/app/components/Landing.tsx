'use client'

import Link from 'next/link'
import { useState } from 'react'
import Card from './ui/Card'
import Input from './ui/Input'
import Button from './ui/Button'

export default function Landing() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')

  return (
    <main className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      {/* Soft gradient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-50)] via-white to-[var(--champagne-100)]" />
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgba(255,107,138,0.18),transparent)] blur-2xl" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-[radial-gradient(closest-side,rgba(255,190,157,0.22),transparent)] blur-3xl" />
      </div>

      <Card className="w-[min(96vw,880px)] grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden border-[var(--brand-100)] shadow-soft">
        <div className="p-8 md:p-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">여우스킨 CRM</h1>
          <p className="mt-3 text-sm md:text-base text-slate-600">
            예약·고객·매출 관리를 한 곳에서. 지금 계정을 만들거나 데모로 살펴보세요.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Link href="/login" className="inline-flex h-10 items-center justify-center rounded-md bg-[var(--brand-500)] px-4 text-white hover:bg-[var(--brand-600)] transition-colors">
              로그인
            </Link>
            <Link href="/dev" className="inline-flex h-10 items-center justify-center rounded-md bg-[var(--champagne-100)] px-4 text-[var(--brand-700)] hover:bg-[var(--champagne-200)] transition-colors">
              데모 보기
            </Link>
          </div>

          <ul className="mt-8 space-y-2 text-sm text-slate-600">
            <li className="flex items-center gap-2">• 직관적인 예약 캘린더</li>
            <li className="flex items-center gap-2">• 고객/상품/결제 관리</li>
            <li className="flex items-center gap-2">• 수입·지출 대시보드</li>
          </ul>
        </div>

        <div className="bg-white/70 backdrop-blur-sm border-t md:border-t-0 md:border-l border-[var(--brand-100)] p-6 md:p-8">
          <h2 className="text-lg font-semibold text-slate-900">빠른 문의</h2>
          <p className="mt-1 text-xs text-slate-500">연락처를 남겨주시면 안내해 드려요.</p>
          <form
            className="mt-5 space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              window.location.href = '/login'
            }}
          >
            <Input placeholder="이름" value={fullName} onChange={(e: any) => setFullName(e.target.value)} />
            <Input placeholder="이메일" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} />
            <Input placeholder="전화번호" value={phone} onChange={(e: any) => setPhone(e.target.value)} />
            <textarea
              placeholder="메모(선택)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-24 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            <div className="pt-2 flex items-center gap-2">
              <Button variant="primary" className="hover:translate-y-[-1px] transition-transform">시작하기</Button>
              <Link href="/signup" className="text-sm text-[var(--brand-600)] hover:text-[var(--brand-700)] underline underline-offset-2">
                회원가입
              </Link>
            </div>
          </form>
        </div>
      </Card>
    </main>
  )
}


