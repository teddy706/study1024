import React from 'react'
import type { Action } from '../../utils/supabase'

type Props = { actions: Action[] }

export const ActionsList: React.FC<Props> = ({ actions }) => {
  if (!actions || actions.length === 0) return <div>예정된 일정이 없습니다.</div>

  return (
    <div className="space-y-4">
      {actions.map(a => (
        <div key={a.id} className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold">{a.type}</span>
            <span className="text-gray-500">{new Date(a.due_date).toLocaleString()}</span>
          </div>
          <p className="text-gray-700">{a.description}</p>
        </div>
      ))}
    </div>
  )
}

export default ActionsList
