import React, { useState, useMemo } from 'react'
import type { Database } from '../../types/supabase'

type SmalltalkCache = Database['public']['Tables']['smalltalk_cache']['Row']

type Props = {
  items: SmalltalkCache[]
  itemsPerPage?: number
}

const formatDate = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(d)
}

const getSourceLabel = (meta?: any): { label: string; color: string; icon?: string } => {
  if (!meta || typeof meta !== 'object') return { label: '', color: '' }
  const source = meta.source
  const type = meta.type
  
  if (type === 'product_recommendation' || type === 'product') {
    return { label: '상품 추천', color: 'bg-purple-100 text-purple-700', icon: '🛍️' }
  }
  if (source === 'openai') return { label: 'AI', color: 'bg-green-100 text-green-700', icon: '🤖' }
  if (source === 'fallback') return { label: 'Template', color: 'bg-gray-100 text-gray-600', icon: '📝' }
  return { label: '', color: '' }
}

export const SmalltalkPanel: React.FC<Props> = ({ items, itemsPerPage = 3 }) => {
  const [currentPage, setCurrentPage] = useState(1)

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return items.slice(startIndex, endIndex)
  }, [items, currentPage, itemsPerPage])

  const totalPages = Math.ceil(items.length / itemsPerPage)
  const showPagination = items.length > itemsPerPage

  if (!items || items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-gray-800">스몰토크 소재가 없습니다</p>
            <p className="text-sm text-gray-500">통화 요약이나 메모를 추가하면 여기서 빠르게 확인할 수 있어요</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">스몰토크</h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">전체 {items.length}개</span>
          {showPagination && (
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              {currentPage} / {totalPages} 페이지
            </span>
          )}
        </div>
      </div>
      <div className="space-y-4">
        {paginatedData.map((it) => {
          const sourceBadge = getSourceLabel(it.meta)
          return (
            <div key={it.id} className="rounded-xl border border-gray-100 p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <span className="badge badge-primary">{it.topic}</span>
                {sourceBadge.label && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sourceBadge.color} flex items-center gap-1`}>
                    {sourceBadge.icon && <span>{sourceBadge.icon}</span>}
                    {sourceBadge.label}
                  </span>
                )}
                <span className="text-xs text-gray-400">만료: {formatDate(it.expires_at)}</span>
              </div>
              <p className="text-sm text-gray-800 whitespace-pre-line line-clamp-4">{it.content}</p>
            </div>
          )
        })}
      </div>
      
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            이전
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-3 py-2 text-sm font-medium rounded-lg ${
                  pageNum === currentPage
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

export default SmalltalkPanel
