import React from 'react'

type Props = {
  startDate: string
  endDate: string
  company: string
  companies: string[]
  onStartDateChange: (v: string) => void
  onEndDateChange: (v: string) => void
  onCompanyChange: (v: string) => void
  onClear: () => void
}

export const FilterBar: React.FC<Props> = ({ startDate, endDate, company, companies, onStartDateChange, onEndDateChange, onCompanyChange, onClear }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-col md:flex-row md:items-end md:space-x-4">
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="block">
          <span className="text-sm">시작일</span>
          <input type="date" className="w-full border p-2 rounded" value={startDate} onChange={e => onStartDateChange(e.target.value)} />
        </label>
        <label className="block">
          <span className="text-sm">종료일</span>
          <input type="date" className="w-full border p-2 rounded" value={endDate} onChange={e => onEndDateChange(e.target.value)} />
        </label>
      </div>

      <div className="w-full md:w-64 mt-2 md:mt-0">
        <label className="block">
          <span className="text-sm">연락처 그룹(회사)</span>
          <select className="w-full border p-2 rounded" value={company} onChange={e => onCompanyChange(e.target.value)}>
            <option value="">전체</option>
            {companies.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 md:mt-0">
        <div className="flex items-center space-x-2">
          <div className="hidden sm:block text-sm text-gray-600">빠른 선택:</div>
          <button type="button" className="bg-blue-50 text-blue-700 px-3 py-2 rounded" onClick={() => {
            // last 7 days
            const end = new Date()
            const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            onStartDateChange(start.toISOString().slice(0,10))
            onEndDateChange(end.toISOString().slice(0,10))
          }}>7일</button>
          <button type="button" className="bg-blue-50 text-blue-700 px-3 py-2 rounded" onClick={() => {
            const end = new Date()
            const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            onStartDateChange(start.toISOString().slice(0,10))
            onEndDateChange(end.toISOString().slice(0,10))
          }}>30일</button>
          <button type="button" className="bg-blue-50 text-blue-700 px-3 py-2 rounded" onClick={() => {
            const now = new Date()
            const start = new Date(now.getFullYear(), now.getMonth(), 1)
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
            onStartDateChange(start.toISOString().slice(0,10))
            onEndDateChange(end.toISOString().slice(0,10))
          }}>이번달</button>
          <button type="button" className="bg-gray-200 text-gray-700 px-3 py-2 rounded" onClick={onClear}>초기화</button>
        </div>
      </div>
    </div>
  )
}

export default FilterBar
