import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Contact } from '../../utils/supabase'

type Props = {
  contacts: Contact[]
}

export const ContactList: React.FC<Props> = ({ contacts }) => {
  const [query, setQuery] = useState('')
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
  const [sortKey, setSortKey] = useState<'name_asc' | 'name_desc' | 'company_asc' | 'last_desc' | 'last_asc'>('name_asc')

  if (!contacts || contacts.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <p className="text-gray-500 font-medium">최근 고객이 없습니다</p>
        <p className="text-sm text-gray-400 mt-1">고객을 추가하면 여기에 표시됩니다</p>
      </div>
    )
  }

  const companies = useMemo(() => {
    const set = new Set<string>()
    contacts.forEach((c) => { if (c.company) set.add(String(c.company)) })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [contacts])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = contacts
    if (q) {
      list = list.filter((c) => {
        const fields = [c.name, c.company, c.position, c.phone, c.email]
          .filter(Boolean)
          .map((v) => String(v).toLowerCase())
        return fields.some((f) => f.includes(q))
      })
    }

    if (selectedCompanies.length > 0) {
      const sel = new Set(selectedCompanies)
      list = list.filter((c) => (c.company ? sel.has(String(c.company)) : false))
    }

    const toTime = (v: any) => {
      const t = v ? new Date(v as any).getTime() : 0
      return isNaN(t) ? 0 : t
    }

    const sorted = [...list].sort((a, b) => {
      switch (sortKey) {
        case 'name_desc':
          return (b.name || '').localeCompare(a.name || '')
        case 'company_asc':
          return (a.company || '').localeCompare(b.company || '') || (a.name || '').localeCompare(b.name || '')
        case 'last_desc':
          return toTime(b.last_contact) - toTime(a.last_contact)
        case 'last_asc':
          return toTime(a.last_contact) - toTime(b.last_contact)
        case 'name_asc':
        default:
          return (a.name || '').localeCompare(b.name || '')
      }
    })

    return sorted
  }, [contacts, query, selectedCompanies, sortKey])

  return (
    <div className="p-6">
      {/* Search Bar */}
      <div className="mb-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="relative w-full sm:w-80">
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            className="input h-9 pl-9 pr-8"
            type="text"
            placeholder="검색 (이름, 회사, 직함, 전화, 이메일)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="연락처 검색"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="검색어 지우기"
              className="absolute right-2 top-1.5 inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            className="select h-9 text-sm"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as any)}
            aria-label="정렬"
          >
            <option value="name_asc">이름 A→Z</option>
            <option value="name_desc">이름 Z→A</option>
            <option value="company_asc">회사 A→Z</option>
            <option value="last_desc">최근 연락일 최신순</option>
            <option value="last_asc">최근 연락일 오래된순</option>
          </select>
          {(selectedCompanies.length > 0 || query) && (
            <button className="btn btn-ghost h-9 px-3 text-sm" onClick={() => { setSelectedCompanies([]); setQuery('') }}>초기화</button>
          )}
        </div>
      </div>

      {/* Tag chips (companies) */}
      {companies.length > 0 && (
        <div className="mb-4 -mx-1 overflow-x-auto no-scrollbar">
          <div className="px-1 flex items-center gap-2 min-w-max">
            {companies.map((co) => {
              const active = selectedCompanies.includes(co)
              return (
                <button
                  key={co}
                  type="button"
                  onClick={() => setSelectedCompanies((prev) => active ? prev.filter(p => p !== co) : [...prev, co])}
                  className={`badge ${active ? 'badge-primary' : 'badge-gray'}`}
                  aria-pressed={active}
                >
                  {co}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <p className="text-gray-600 font-medium">검색 결과가 없습니다</p>
          <p className="text-sm text-gray-400 mt-1">다른 키워드로 검색해 보세요</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(c => (
        <Link
          key={c.id}
          to={`/contacts/${c.id}`}
          className="group block bg-white rounded-2xl border border-gray-100 shadow-md shadow-gray-200/30 hover:shadow-xl hover:shadow-gray-300/40 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
        >
          <div className="p-5">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center font-bold text-base shadow-lg ring-1 ring-white/40">
                {c.name?.charAt(0) || '?'}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors text-sm">{c.name}</h3>
                <div className="text-xs text-gray-600 truncate">{c.company}</div>
                {c.position && <div className="text-xs text-gray-500 truncate">{c.position}</div>}
              </div>
            </div>

            <div className="space-y-1.5">
              {c.phone && (
                <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded-lg">
                  <svg className="w-3 h-3 flex-shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.89.34 1.76.65 2.59a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.49-1.22a2 2 0 0 1 2.11-.45c.83.31 1.7.53 2.59.65A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span className="truncate flex-1">{c.phone}</span>
                </div>
              )}
              {c.email && (
                <div className="flex items-center gap-1.5 text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded-lg">
                  <svg className="w-3 h-3 flex-shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <span className="truncate flex-1">{c.email}</span>
                </div>
              )}
            </div>
          </div>
        </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default ContactList
