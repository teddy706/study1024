import React, { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import type { Contact, Report, Action } from '../utils/supabase'
import Navbar from '../components/dashboard/Navbar'
import ContactList from '../components/dashboard/ContactList'
import ReportsList from '../components/dashboard/ReportsList'
import ActionsList from '../components/dashboard/ActionsList'
import FilterBar from '../components/dashboard/FilterBar'
import { useSearchParams } from 'react-router-dom'
import ScoreboardNumber from '../components/ui/ScoreboardNumber'

interface DashboardProps {
  userId: string
}

export const Dashboard: React.FC<DashboardProps> = ({ userId }) => {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [actions, setActions] = useState<Action[]>([])
  const [companies, setCompanies] = useState<string[]>([])
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [statsCounts, setStatsCounts] = useState<{ contact: number; report: number; action: number }>({ contact: 0, report: 0, action: 0 })
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    // initialize filters from querystring
    const s = searchParams.get('start') || ''
    const e = searchParams.get('end') || ''
    const c = searchParams.get('company') || ''
    setStartDate(s)
    setEndDate(e)
    setSelectedCompany(c)

    // fetch companies and initial data
    fetchCompaniesServerFirst()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // update querystring when filters change
    const params: any = {}
    if (startDate) params.start = startDate
    if (endDate) params.end = endDate
    if (selectedCompany) params.company = selectedCompany
    setSearchParams(params)
    // reload data
    loadDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, selectedCompany])

  // Try server-side company distinct first, fallback to client-side
  const fetchCompaniesServerFirst = async () => {
    try {
      // prefer SQL rpc get_companies if exists
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_companies')
      if (!rpcError && Array.isArray(rpcData)) {
        setCompanies(rpcData.map((r: any) => r.company).filter(Boolean))
        return
      }
    } catch (err) {
      // ignore and fallback
    }
    // fallback to client-side distinct
    fetchCompanies()
  }

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase.from('contacts').select('company').limit(1000)
      if (error) throw error
      const list = Array.from(new Set((data || []).map((r: any) => r.company).filter(Boolean)))
      setCompanies(list)
    } catch (err) {
      console.error('Error fetching companies:', err)
    }
  }

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // build ISO range if dates provided
      const startIso = startDate ? new Date(startDate).toISOString() : null
      const endIso = endDate ? new Date(new Date(endDate).setHours(23,59,59,999)).toISOString() : null

      const contactsQuery = supabase
        .from('contacts')
        .select('*')
        .order('last_contact', { ascending: false })
        .limit(12)
      const reportsQuery = supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(6)
      const actionsQuery = supabase.from('actions').select('*').order('due_date', { ascending: true }).limit(6)

      if (selectedCompany) contactsQuery.eq('company', selectedCompany)
      if (startIso) contactsQuery.gte('last_contact', startIso)
      if (endIso) contactsQuery.lte('last_contact', endIso)

      if (startIso) reportsQuery.gte('created_at', startIso)
      if (endIso) reportsQuery.lte('created_at', endIso)

      if (startIso) actionsQuery.gte('due_date', startIso)
      if (endIso) actionsQuery.lte('due_date', endIso)

      // Attempt to fetch aggregated counts from server-side function for performance
      try {
        const { data: countsData, error: countsError } = await supabase.rpc('get_dashboard_counts', { 
          start_ts: startIso, 
          end_ts: endIso,
          companies: selectedCompany ? [selectedCompany] : null
        })
        
        if (!countsError && countsData) {
          // countsData may be an array with one object or a single object
          const counts = Array.isArray(countsData) ? countsData[0] : countsData
          
          // Fetch list items for display
          const [{ data: contactsData }, { data: reportsData }, { data: actionsData }] = await Promise.all([
            contactsQuery,
            reportsQuery,
            actionsQuery,
          ])
          
          if (contactsData) setContacts(contactsData)
          if (reportsData) setReports(reportsData)
          if (actionsData) setActions(actionsData)
          
          // Use server counts
          setStatsCounts({ 
            contact: Number(counts.contact_count ?? 0), 
            report: Number(counts.report_count ?? 0), 
            action: Number(counts.action_count ?? 0) 
          })
          
          setLoading(false)
          console.log('✅ Using server-side RPC counts:', counts)
          return
        }
      } catch (err) {
        console.log('⚠️ RPC not available, using client-side counts')
      }

      const [{ data: contactsData }, { data: reportsData }, { data: actionsData }] = await Promise.all([
        contactsQuery,
        reportsQuery,
        actionsQuery,
      ])

      if (contactsData) setContacts(contactsData)
      if (reportsData) setReports(reportsData)
      if (actionsData) setActions(actionsData)
      
      // Use client-side counts as fallback
      setStatsCounts({ 
        contact: contactsData?.length ?? 0, 
        report: reportsData?.length ?? 0, 
        action: actionsData?.length ?? 0 
      })

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-gray-900 border-r-transparent"></div>
          <p className="mt-4 text-gray-600 font-medium">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
        <div className="container mx-auto px-6 py-20 relative z-10">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 tracking-tight">대시보드</h1>
          <p className="text-xl md:text-2xl text-gray-300 font-light">오늘의 업무 현황을 한눈에</p>
        </div>
      </div>

      <main className="container mx-auto px-6 -mt-12 relative z-20">
        {/* Filter Bar with Apple-style card */}
        <div className="mb-12">
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 backdrop-blur-xl border border-gray-100">
            <FilterBar
              startDate={startDate}
              endDate={endDate}
              company={selectedCompany}
              companies={companies}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onCompanyChange={setSelectedCompany}
              onClear={() => { setStartDate(''); setEndDate(''); setSelectedCompany('') }}
            />
          </div>
        </div>

        {/* Stats Cards - Apple style with scoreboard animation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="group bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-8 shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-2">고객 수</p>
                <ScoreboardNumber value={statsCounts.contact ?? contacts.length} className="text-5xl font-bold text-white" />
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm" style={{maxWidth: 56, maxHeight: 56}}>
                <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-8 shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium mb-2">리포트 수</p>
                <ScoreboardNumber value={statsCounts.report ?? reports.length} className="text-5xl font-bold text-white" />
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm" style={{maxWidth: 56, maxHeight: 56}}>
                <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-green-500 to-green-600 rounded-3xl p-8 shadow-2xl shadow-green-500/30 hover:shadow-green-500/50 transition-all duration-300 hover:scale-105 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium mb-2">예정된 일정</p>
                <ScoreboardNumber value={statsCounts.action ?? actions.length} className="text-5xl font-bold text-white" />
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm" style={{maxWidth: 56, maxHeight: 56}}>
                <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Contacts Section */}
        <section className="mb-16">
          <div className="flex items-center mb-8">
            <h2 className="text-4xl font-bold text-gray-900 tracking-tight">최근 고객</h2>
            <div className="ml-4 h-1 flex-1 bg-gradient-to-r from-gray-300 to-transparent rounded-full"></div>
            <a href="/contacts" className="ml-4 text-sm text-blue-600 hover:underline">전체 보기</a>
          </div>
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">
            <ContactList contacts={contacts} />
          </div>
        </section>

        {/* Reports and Actions Grid */}
        <section className="mb-16 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center mb-8">
              <h2 className="text-4xl font-bold text-gray-900 tracking-tight">최신 리포트</h2>
              <div className="ml-4 h-1 flex-1 bg-gradient-to-r from-purple-300 to-transparent rounded-full"></div>
            </div>
            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">
              <ReportsList reports={reports} />
            </div>
          </div>
          
          <div>
            <div className="flex items-center mb-8">
              <h2 className="text-4xl font-bold text-gray-900 tracking-tight">예정된 일정</h2>
              <div className="ml-4 h-1 flex-1 bg-gradient-to-r from-green-300 to-transparent rounded-full"></div>
            </div>
            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">
              <ActionsList actions={actions} />
            </div>
          </div>
        </section>

        {/* Footer spacing */}
        <div className="h-20"></div>
      </main>
    </div>
  )
}