import React from 'react'
import type { Database } from '../../types/supabase'

type Action = Database['public']['Tables']['actions']['Row']

type Props = { actions: Action[] }

export const ActionsList: React.FC<Props> = ({ actions }) => {
  if (!actions || actions.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-50 rounded-full mb-4">
          <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-gray-500 font-medium">예정된 일정이 없습니다</p>
        <p className="text-sm text-gray-400 mt-1">일정을 추가하면 여기에 표시됩니다</p>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700'
      case 'in_progress': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '완료'
      case 'in_progress': return '진행중'
      default: return '대기'
    }
  }

  return (
    <div className="divide-y divide-gray-100">
      {actions.map(a => (
        <div 
          key={a.id} 
          className="p-6 hover:bg-green-50/30 transition-all duration-200 group"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3 flex-1">
              <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-semibold text-gray-900">{a.type}</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(a.status)}`}>
                    {getStatusText(a.status)}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {new Date(a.due_date).toLocaleString('ko-KR', { 
                    month: 'long', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          </div>
          <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed ml-13">{a.description}</p>
        </div>
      ))}
    </div>
  )
}

export default ActionsList
