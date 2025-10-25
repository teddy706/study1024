import React, { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import type { Contact, Report, Action } from '../utils/supabase'
import Navbar from '../components/dashboard/Navbar'
import StatsCard from '../components/dashboard/StatsCard'
import ContactList from '../components/dashboard/ContactList'
import ReportsList from '../components/dashboard/ReportsList'
import ActionsList from '../components/dashboard/ActionsList'
import FilterBar from '../components/dashboard/FilterBar'
import { useSearchParams } from 'react-router-dom'

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

      const contactsQuery = supabase.from('contacts').select('*').order('last_contact', { ascending: false }).limit(6)
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
        const startIsoParam = startIso ?? null
        const endIsoParam = endIso ?? null
        const { data: countsData, error: countsError } = await supabase.rpc('get_dashboard_counts', { start_ts: startIsoParam, end_ts: endIsoParam })
        if (!countsError && countsData && countsData.length > 0) {
          // countsData may be an array with one object
          const counts = Array.isArray(countsData) ? countsData[0] : countsData
          // We still fetch list items for display, but use counts for StatsCard
          const [{ data: contactsData }, { data: reportsData }, { data: actionsData }] = await Promise.all([
            contactsQuery,
            reportsQuery,
            actionsQuery,
          ])
          if (contactsData) setContacts(contactsData)
          if (reportsData) setReports(reportsData)
          if (actionsData) setActions(actionsData)
          // overwrite stats counts using server counts if present
          // convert to numbers, defensive
          const contactCountNum = Number(counts.contact_count ?? contacts.length)
          const reportCountNum = Number(counts.report_count ?? reports.length)
          const actionCountNum = Number(counts.action_count ?? actions.length)
          // set small state slice for counts (we'll store counts in local state variables)
          setStatsCounts({ contact: contactCountNum, report: reportCountNum, action: actionCountNum })
          setLoading(false)
          return
        }
      } catch (err) {
        // ignore and fallback to client counts
      }

      const [{ data: contactsData }, { data: reportsData }, { data: actionsData }] = await Promise.all([
        contactsQuery,
        reportsQuery,
        actionsQuery,
      ])

      if (contactsData) setContacts(contactsData)
      if (reportsData) setReports(reportsData)
      if (actionsData) setActions(actionsData)

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">대시보드</h1>
          <p className="text-gray-600">오늘의 업무 현황</p>
        </div>

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard title="고객 수" value={statsCounts.contact ?? contacts.length} />
          <StatsCard title="리포트 수" value={statsCounts.report ?? reports.length} />
          <StatsCard title="예정된 일정" value={statsCounts.action ?? actions.length} />
        </div>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">최근 고객</h2>
          <ContactList contacts={contacts} />
        </section>

        <section className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">최신 리포트</h2>
            <ReportsList reports={reports} />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-4">예정된 일정</h2>
            <ActionsList actions={actions} />
          </div>
        </section>
      </main>
    </div>
  )
}