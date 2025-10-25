import React from 'react'

type Props = {
  title: string
  value: string | number
}

export const StatsCard: React.FC<Props> = ({ title, value }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h4 className="text-sm text-gray-500">{title}</h4>
      <div className="text-2xl font-bold mt-2">{value}</div>
    </div>
  )
}

export default StatsCard
