import React from 'react'
import { Link } from 'react-router-dom'
import type { Report } from '../../utils/supabase'

type Props = { reports: Report[] }

export const ReportsList: React.FC<Props> = ({ reports }) => {
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
    <div className="divide-y divide-gray-100">
      {reports.map(r => (
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
  )
}

export default ReportsList
