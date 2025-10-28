import React, { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'
import type { Database } from '../types/supabase'
import { useAuth } from '../hooks/useAuth'
import { OrganizationReportService } from '../services/organizationReport.service'
import Navbar from '../components/dashboard/Navbar'
import ContactList from '../components/dashboard/ContactList'
import ReportsList from '../components/dashboard/ReportsList'
import ActionsList from '../components/dashboard/ActionsList'
import ScoreboardNumber from '../components/ui/ScoreboardNumber'

type Contact = Database['public']['Tables']['contacts']['Row']
type Report = Database['public']['Tables']['reports']['Row']
type Action = Database['public']['Tables']['actions']['Row']

// 연락처 정보가 포함된 액션 타입
type ActionWithContact = Action & {
  contacts?: Pick<Contact, 'id' | 'name' | 'company' | 'position'>
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const userId = user?.id || ''
  const [contacts, setContacts] = useState<Contact[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [actions, setActions] = useState<ActionWithContact[]>([])
  const [statsCounts, setStatsCounts] = useState<{ contact: number; report: number; action: number }>({ contact: 0, report: 0, action: 0 })
  const [loading, setLoading] = useState(true)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'contacts' | 'reports' | 'actions'>('all')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      const contactsQuery = supabase
        .from('contacts')
        .select('*')
        .order('last_contact', { ascending: false })
        .limit(50)
      const reportsQuery = supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(50)
      const actionsQuery = supabase
        .from('actions')
        .select(`
          *,
          contacts!inner(
            id,
            name,
            company,
            position
          )
        `)
        .order('due_date', { ascending: true })
        .limit(50)

      // Attempt to fetch aggregated counts from server-side function for performance
      try {
        const { data: countsData, error: countsError } = await supabase.rpc('get_dashboard_counts', { 
          start_ts: null, 
          end_ts: null,
          companies: null
        } as any) as { data: any, error: any }
        
        if (!countsError && countsData) {
          // countsData may be an array with one object or a single object
          const counts: any = Array.isArray(countsData) ? countsData[0] : countsData
          
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



  const handleGenerateReport = async () => {
    try {
      setGeneratingReport(true)
      const reportService = new OrganizationReportService()
      
      // AI 리포트 생성
      const reportContent = await reportService.generateOrganizationReport()
      
      // 리포트 저장
      await reportService.saveReport(reportContent)
      
      alert('✅ 조직 동향 리포트가 성공적으로 생성되었습니다!')
      loadDashboardData() // 리포트 목록 새로고침
    } catch (error) {
      console.error('Error generating report:', error)
      const errorMessage = error instanceof Error ? error.message : '리포트 생성 중 오류가 발생했습니다.'
      alert(`❌ ${errorMessage}`)
    } finally {
      setGeneratingReport(false)
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

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Navigation Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-12">
          <div 
            onClick={() => setActiveTab('all')}
            className={`group rounded-xl p-4 shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer ${
              activeTab === 'all' 
                ? 'bg-gradient-to-br from-gray-700 to-gray-800 shadow-gray-700/30' 
                : 'bg-gradient-to-br from-gray-600 to-gray-700 shadow-gray-600/20 hover:shadow-gray-600/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-100 text-xs font-medium mb-1">전체 보기</p>
                <div className="text-2xl sm:text-3xl font-bold text-white">ALL</div>
              </div>
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('reports')}
            className={`group rounded-xl p-4 shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer ${
              activeTab === 'reports' 
                ? 'bg-gradient-to-br from-purple-600 to-purple-700 shadow-purple-600/30' 
                : 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-purple-500/20 hover:shadow-purple-500/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-xs font-medium mb-1">리포트</p>
                <ScoreboardNumber value={statsCounts.report ?? reports.length} className="text-2xl sm:text-3xl font-bold text-white" />
              </div>
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('actions')}
            className={`group rounded-xl p-4 shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer ${
              activeTab === 'actions' 
                ? 'bg-gradient-to-br from-green-600 to-green-700 shadow-green-600/30' 
                : 'bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/20 hover:shadow-green-500/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs font-medium mb-1">일정</p>
                <ScoreboardNumber value={statsCounts.action ?? actions.length} className="text-2xl sm:text-3xl font-bold text-white" />
              </div>
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('contacts')}
            className={`group rounded-xl p-4 shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer ${
              activeTab === 'contacts' 
                ? 'bg-gradient-to-br from-blue-600 to-blue-700 shadow-blue-600/30' 
                : 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/20 hover:shadow-blue-500/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs font-medium mb-1">연락처</p>
                <ScoreboardNumber value={statsCounts.contact ?? contacts.length} className="text-2xl sm:text-3xl font-bold text-white" />
              </div>
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>



        {/* Content Sections based on active tab */}
        {(activeTab === 'all' || activeTab === 'reports') && (
          <section className={`mb-12 sm:mb-16 ${activeTab === 'all' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8' : ''}`}>
            <div className={activeTab === 'reports' ? 'max-w-4xl mx-auto' : ''}>
              <div className="flex flex-col sm:flex-row sm:items-center mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight mb-3 sm:mb-0">최신 리포트</h2>
                <div className="hidden sm:block ml-4 h-1 flex-1 bg-gradient-to-r from-purple-300 to-transparent rounded-full"></div>
                <button
                  onClick={handleGenerateReport}
                  disabled={generatingReport}
                  className="sm:ml-4 px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg sm:rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-medium"
                >
                  {generatingReport ? (
                    <>
                      <svg className="inline w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      생성 중...
                    </>
                  ) : (
                    '📊 최신 리포트 생성'
                  )}
                </button>
              </div>
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">
                <ReportsList reports={reports} />
              </div>
            </div>
            
            {activeTab === 'all' && (
              <div>
                <div className="flex items-center mb-6 sm:mb-8">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">예정된 일정</h2>
                  <div className="ml-4 h-1 flex-1 bg-gradient-to-r from-green-300 to-transparent rounded-full"></div>
                </div>
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">
                  <ActionsList actions={actions} itemsPerPage={5} />
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === 'actions' && (
          <section className="mb-12 sm:mb-16">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">예정된 일정</h2>
                <div className="ml-4 h-1 flex-1 bg-gradient-to-r from-green-300 to-transparent rounded-full"></div>
              </div>
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">
                <ActionsList actions={actions} itemsPerPage={10} />
              </div>
            </div>
          </section>
        )}

        {(activeTab === 'all' || activeTab === 'contacts') && (
          <section className="mb-12 sm:mb-16">
            <div className={activeTab === 'contacts' ? 'max-w-6xl mx-auto' : ''}>
              <div className="flex items-center mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
                  {activeTab === 'contacts' ? '전체 연락처' : '최근 고객'}
                </h2>
                <div className="ml-4 h-1 flex-1 bg-gradient-to-r from-gray-300 to-transparent rounded-full"></div>
                {activeTab === 'all' && (
                  <a href="/contacts" className="ml-4 text-xs sm:text-sm text-blue-600 hover:underline">전체 보기</a>
                )}
              </div>
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">
                <ContactList 
                  contacts={contacts} 
                  paginationType="pageNumbers" 
                  itemsPerPage={activeTab === 'contacts' ? 12 : 8} 
                />
              </div>
            </div>
          </section>
        )}

        {/* Footer spacing */}
        <div className="h-20"></div>
      </main>
    </div>
  )
}