import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../config/supabase'
import type { Database } from '../types/supabase'
import SkeletonLoader from '../components/ui/SkeletonLoader'

type Contact = Database['public']['Tables']['contacts']['Row']
import ContactList from '../components/dashboard/ContactList'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'

const PAGE_SIZE = 24

export const ContactsPage: React.FC = () => {
  const navigate = useNavigate()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState<number | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()

  // 초기 페이지 동기화
  useEffect(() => {
    const p = Number(searchParams.get('page') || '1')
    setPage(Number.isFinite(p) && p > 0 ? p : 1)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 서버 페이지네이션 로딩
  const fetchContacts = async () => {
    setLoading(true)
    try {
      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      const { data, error, count } = await supabase
        .from('contacts')
        .select('*', { count: 'exact' })
        .order('last_contact', { ascending: false })
        .range(from, to)

      if (error) throw error
      setContacts((prev) => page === 1 ? (data ?? []) : [...prev, ...(data ?? [])])
      if (typeof count === 'number') setTotal(count)
      setSearchParams((prev) => {
        const p = new URLSearchParams(prev as any)
        p.set('page', String(page))
        return p
      })
    } catch (e) {
      console.error('Failed to load contacts:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContacts()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const hasMore = useMemo(() => {
    if (total == null) return true
    return contacts.length < total
  }, [contacts.length, total])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">전체 고객</h1>
            {typeof total === 'number' && (
              <p className="text-sm text-gray-500 mt-1">총 {total.toLocaleString('ko-KR')}명</p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/contacts/new')}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              ➕ 신규 등록
            </button>
            <Link to="/" className="btn btn-secondary">대시보드</Link>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">
          {loading && contacts.length === 0 ? (
            <div className="p-8">
              <SkeletonLoader variant="card" count={6} className="mb-4" />
            </div>
          ) : (
            <ContactList contacts={contacts} />
          )}
        </div>

        {hasMore && (
          <div className="mt-6 flex justify-center">
            <button className="btn btn-primary" disabled={loading} onClick={() => setPage((p) => p + 1)}>
              {loading ? '불러오는 중…' : '더 보기'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ContactsPage
