import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import type { Report } from '../utils/supabase'

export const ReportDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    (async () => {
      setLoading(true)
      const { data, error } = await supabase.from('reports').select('*').eq('id', id).single()
      if (error) console.error(error)
      setReport(data ?? null)
      setLoading(false)
    })()
  }, [id])

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>
  if (!report) return <div className="p-8">리포트를 찾을 수 없습니다. <Link to="/">돌아가기</Link></div>

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/" className="text-blue-600">← 대시보드로 돌아가기</Link>
      <div className="bg-white rounded-lg shadow p-6 mt-4">
        <h2 className="text-2xl font-bold mb-2">{report.type}</h2>
        <p className="text-gray-600 mb-2">작성일: {new Date(report.created_at).toLocaleString()}</p>
        <div className="text-gray-800 whitespace-pre-wrap">{report.content}</div>
      </div>
    </div>
  )
}

export default ReportDetail
