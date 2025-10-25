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
    <div className="flex flex-col space-y-6">
      {/* Date and Company Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="block">
          <span className="text-sm font-medium text-gray-700 mb-2 block">시작일</span>
          <input 
            type="date" 
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
            value={startDate} 
            onChange={e => onStartDateChange(e.target.value)} 
          />
        </label>
        
        <label className="block">
          <span className="text-sm font-medium text-gray-700 mb-2 block">종료일</span>
          <input 
            type="date" 
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
            value={endDate} 
            onChange={e => onEndDateChange(e.target.value)} 
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-700 mb-2 block">회사</span>
          <select 
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer" 
            value={company} 
            onChange={e => onCompanyChange(e.target.value)}
          >
            <option value="">전체</option>
            {companies.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Quick Select Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-gray-600">빠른 선택:</span>
        
        <button 
          type="button" 
          className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-full hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105" 
          onClick={() => {
            // last 7 days
            const end = new Date()
            const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            onStartDateChange(start.toISOString().slice(0,10))
            onEndDateChange(end.toISOString().slice(0,10))
          }}
        >
          지난 7일
        </button>
        
        <button 
          type="button" 
          className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm font-medium rounded-full hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105" 
          onClick={() => {
            const end = new Date()
            const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            onStartDateChange(start.toISOString().slice(0,10))
            onEndDateChange(end.toISOString().slice(0,10))
          }}
        >
          지난 30일
        </button>
        
        <button 
          type="button" 
          className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-medium rounded-full hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105" 
          onClick={() => {
            const now = new Date()
            const start = new Date(now.getFullYear(), now.getMonth(), 1)
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
            onStartDateChange(start.toISOString().slice(0,10))
            onEndDateChange(end.toISOString().slice(0,10))
          }}
        >
          이번 달
        </button>
        
        <button 
          type="button" 
          className="px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-200 transition-all duration-200" 
          onClick={onClear}
        >
          초기화
        </button>
      </div>
    </div>
  )
}

export default FilterBar
