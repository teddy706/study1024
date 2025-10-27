import React from 'react'
import type { Database } from '../../types/supabase'

type SmalltalkCache = Database['public']['Tables']['smalltalk_cache']['Row']

type Props = {
  items: SmalltalkCache[]
}

const formatDate = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(d)
}

const getSourceLabel = (meta?: any): { label: string; color: string } => {
  if (!meta || typeof meta !== 'object') return { label: '', color: '' }
  const source = meta.source
  if (source === 'openai') return { label: 'AI', color: 'bg-green-100 text-green-700' }
  if (source === 'fallback') return { label: 'Template', color: 'bg-gray-100 text-gray-600' }
  return { label: '', color: '' }
}

export const SmalltalkPanel: React.FC<Props> = ({ items }) => {
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
        <span className="text-xs text-gray-500">최신 {items.length}개</span>
      </div>
      <div className="space-y-4">
        {items.map((it) => {
          const sourceBadge = getSourceLabel(it.meta)
          return (
            <div key={it.id} className="rounded-xl border border-gray-100 p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <span className="badge badge-primary">{it.topic}</span>
                {sourceBadge.label && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sourceBadge.color}`}>
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
    </div>
  )
}

export default SmalltalkPanel
