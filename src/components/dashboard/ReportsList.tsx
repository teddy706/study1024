import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { Database } from '../../types/supabase'

type Report = Database['public']['Tables']['reports']['Row']

type Props = { 
  reports: Report[]
  itemsPerPage?: number
}

export const ReportsList: React.FC<Props> = ({ reports, itemsPerPage = 5 }) => {
  const [currentPage, setCurrentPage] = useState(1)

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return reports.slice(startIndex, endIndex)
  }, [reports, currentPage, itemsPerPage])

  const totalPages = Math.ceil(reports.length / itemsPerPage)
  const showPagination = reports.length > itemsPerPage
  if (!reports || reports.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-50 rounded-full mb-4">
          <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-gray-500 font-medium">리포트가 없습니다</p>
        <p className="text-sm text-gray-400 mt-1">리포트를 추가하면 여기에 표시됩니다</p>
      </div>
    )
  }

  return (
    <div>
      {/* 페이지 정보 표시 */}
      {showPagination && (
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">전체 {reports.length}개</span>
            <span className="text-sm text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
              {currentPage} / {totalPages} 페이지
            </span>
          </div>
        </div>
      )}
      
      <div className="divide-y divide-gray-100">
        {paginatedData.map(r => (
        <Link 
          key={r.id} 
          to={`/reports/${r.id}`} 
          className="block p-6 hover:bg-purple-50/30 transition-all duration-200 group"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <span className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">{r.type}</span>
                <p className="text-sm text-gray-500 mt-1">{new Date(r.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
            <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all flex-shrink-0" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">{r.content}</p>
        </Link>
        ))}
      </div>
      
      {/* 페이지네이션 컨트롤 */}
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
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
                    ? 'bg-purple-600 text-white'
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

export default ReportsList
