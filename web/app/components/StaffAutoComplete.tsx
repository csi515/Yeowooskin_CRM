'use client'

import { useEffect, useMemo, useState } from 'react'
import { useClickOutside } from '@/app/lib/hooks/useClickOutside'

type Staff = { id: string; name: string; email?: string | null; phone?: string | null; role?: string | null }

export default function StaffAutoComplete({ value, onChange }: { value?: string; onChange: (id?: string) => void }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [list, setList] = useState<Staff[]>([])
  const [selected, setSelected] = useState<Staff | null>(null)
  const wrapperRef = useClickOutside<HTMLDivElement>(() => setOpen(false), open)

  useEffect(() => {
    // Load selected staff display
    const loadSelected = async () => {
      if (!value) { setSelected(null); return }
      try {
        const { staffApi } = await import('@/app/lib/api/staff')
        const data = await staffApi.get(value)
        setSelected(data || null)
        setQ(data?.name || '')
      } catch {
        setSelected(null)
        setQ('')
      }
    }
    loadSelected()
  }, [value])

  useEffect(() => {
    const load = async () => {
      try {
        const { staffApi } = await import('@/app/lib/api/staff')
        const data = await staffApi.list(q.trim() ? { search: q, limit: 50 } : { limit: 50 })
        setList(Array.isArray(data) ? data : [])
      } catch {
        setList([])
      }
    }
    if (open) load()
  }, [q, open])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return list.slice(0, 8)
    return list.filter(s =>
      (s.name || '').toLowerCase().includes(query) ||
      (s.email || '').toLowerCase().includes(query) ||
      (s.phone || '').toLowerCase().includes(query) ||
      (s.role || '').toLowerCase().includes(query)
    ).slice(0, 8)
  }, [q, list])

  return (
    <div className="relative" ref={wrapperRef}>
      <input
        className="h-10 w-full rounded-lg border border-neutral-300 px-3 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-300"
        placeholder="담당 직원을 검색하여 선택"
        value={q}
        onChange={e => { setQ(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onKeyDown={e => {
          if (e.key === 'Enter' && filtered.length > 0) {
            const s = filtered[0]
            onChange(s.id)
            setQ(s.name || '')
            setOpen(false)
            e.preventDefault()
          }
          if (e.key === 'Escape') setOpen(false)
        }}
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full max-h-56 overflow-auto border border-neutral-200 bg-white rounded-md shadow-sm">
          {filtered.map(s => (
            <li
              key={s.id}
              className="px-3 py-2 text-sm hover:bg-neutral-50 cursor-pointer"
              onMouseDown={() => {
                onChange(s.id)
                setQ(s.name || '')
                setOpen(false)
              }}
            >
              <div className="font-medium">{s.name}</div>
              <div className="text-xs text-neutral-500">{s.role || s.email || s.phone || '-'}</div>
            </li>
          ))}
        </ul>
      )}
      {value && (
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          onClick={() => { onChange(undefined); setQ(''); setSelected(null) }}
        >지움</button>
      )}
    </div>
  )
}


