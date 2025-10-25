import React from 'react'
import { Link } from 'react-router-dom'
import type { Report } from '../../utils/supabase'

type Props = { reports: Report[] }

export const ReportsList: React.FC<Props> = ({ reports }) => {
  if (!reports || reports.length === 0) return <div>리포트가 없습니다.</div>

  return (
    <div className="space-y-4">
      {reports.map(r => (
        <Link key={r.id} to={`/reports/${r.id}`} className="block bg-white rounded-lg shadow p-4 hover:shadow-md transition">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold">{r.type}</span>
            <span className="text-gray-500">{new Date(r.created_at).toLocaleDateString()}</span>
          </div>
          <p className="text-gray-700">{r.content}</p>
        </Link>
      ))}
    </div>
  )
}

export default ReportsList
