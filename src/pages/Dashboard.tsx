import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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
  const [allReports, setAllReports] = useState<Report[]>([])
  const [actions, setActions] = useState<ActionWithContact[]>([])
  const [statsCounts, setStatsCounts] = useState<{ contact: number; report: number; action: number }>({ contact: 0, report: 0, action: 0 })
  const [loading, setLoading] = useState(true)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'contacts' | 'reports' | 'actions'>('all')
  
  // 연락처 필터링 및 정렬 상태
  const [contactFilter, setContactFilter] = useState<string>('all')
  const [contactSort, setContactSort] = useState<'name' | 'company' | 'recent'>('name')
  
  // 선택된 연락처 상태
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  // 리포트 탭 선택 시 전체 리포트 로딩
  useEffect(() => {
    if (activeTab === 'reports') {
      loadAllReports()
    }
  }, [activeTab])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      const contactsQuery = supabase
        .from('contacts')
        .select('*')
        .order('last_contact', { ascending: false })
        .limit(50)
      const reportsQuery = supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(1)
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

  // 전체 리포트 로딩 함수
  const loadAllReports = async () => {
    try {
      const { data: allReportsData, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error loading all reports:', error)
        return
      }
      
      if (allReportsData) {
        setAllReports(allReportsData)
      }
    } catch (error) {
      console.error('Error loading all reports:', error)
    }
  }

  // 연락처 필터링 및 정렬 함수
  const getFilteredAndSortedContacts = () => {
    let filteredContacts = contacts

    // 기업 필터링
    if (contactFilter !== 'all') {
      filteredContacts = contacts.filter(contact => contact.company === contactFilter)
    }

    // 정렬
    filteredContacts.sort((a, b) => {
      switch (contactSort) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'company':
          return (a.company || '').localeCompare(b.company || '')
        case 'recent':
          return new Date(b.last_contact || b.created_at).getTime() - new Date(a.last_contact || a.created_at).getTime()
        default:
          return 0
      }
    })

    return filteredContacts
  }

  // 기업 목록 추출
  const getCompanyList = () => {
    const companies = contacts.map(contact => contact.company).filter(Boolean)
    return [...new Set(companies)].sort()
  }

  // 오늘 일정만 필터링
  const getTodayActions = (contactId?: string) => {
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    return actions.filter(action => {
      if (!action.due_date) return false
      const actionDate = new Date(action.due_date)
      const isToday = actionDate >= todayStart && actionDate < todayEnd
      
      // 특정 연락처가 선택된 경우 해당 연락처와 관련된 일정만 필터링
      if (contactId) {
        return isToday && action.contact_id === contactId
      }
      
      return isToday
    })
  }

  // 연락처 클릭 핸들러 (토글 기능)
  const handleContactClick = (contact: Contact) => {
    if (selectedContact?.id === contact.id) {
      // 이미 선택된 연락처를 다시 클릭하면 선택 해제
      setSelectedContact(null)
    } else {
      // 새로운 연락처 선택
      setSelectedContact(contact)
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
      
      alert('✅ 기업동향 리포트가 성공적으로 생성되었습니다!')
      loadDashboardData() // 리포트 목록 새로고침
      
      // 리포트 탭에 있을 때는 전체 리포트도 새로고침
      if (activeTab === 'reports') {
        loadAllReports()
      }
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
        {activeTab === 'all' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
            {/* 왼쪽 사이드바 - 연락처 */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <div className="flex items-center mb-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">연락처</h2>
                  <div className="ml-3 h-1 flex-1 bg-gradient-to-r from-blue-300 to-transparent rounded-full"></div>
                </div>

                {/* 필터 및 정렬 컨트롤 */}
                <div className="bg-white rounded-xl p-4 shadow-lg mb-4 border border-gray-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* 기업 필터 */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">기업 필터</label>
                      <select
                        value={contactFilter}
                        onChange={(e) => setContactFilter(e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">전체</option>
                        {getCompanyList().map(company => (
                          <option key={company} value={company}>{company}</option>
                        ))}
                      </select>
                    </div>

                    {/* 정렬 */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">정렬</label>
                      <select
                        value={contactSort}
                        onChange={(e) => setContactSort(e.target.value as 'name' | 'company' | 'recent')}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="name">이름순</option>
                        <option value="company">기업순</option>
                        <option value="recent">최근 연락순</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 연락처 목록 */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 max-h-96 overflow-y-auto">
                  {getFilteredAndSortedContacts().slice(0, 5).map((contact, index) => (
                    <div 
                      key={contact.id} 
                      className={`p-4 hover:bg-blue-50 transition-all duration-300 cursor-pointer ${
                        index !== 0 ? 'border-t border-gray-100' : ''
                      } ${selectedContact?.id === contact.id ? 'bg-blue-50 border-l-4 border-l-blue-500 shadow-sm' : ''}`}
                      onClick={() => handleContactClick(contact)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                            selectedContact?.id === contact.id 
                              ? 'bg-gradient-to-br from-blue-600 to-blue-700 scale-110' 
                              : 'bg-gradient-to-br from-blue-500 to-blue-600'
                          }`}>
                            <span className="text-white font-medium text-sm">
                              {contact.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">{contact.name}</h4>
                            <p className="text-xs text-gray-500 truncate">{contact.company}</p>
                            <p className="text-xs text-gray-400 truncate">{contact.position}</p>
                          </div>
                        </div>
                        
                        {selectedContact?.id === contact.id && (
                          <Link
                            to={`/contacts/${contact.id}`}
                            className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            상세보기
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {getFilteredAndSortedContacts().length > 5 && (
                    <div className="p-3 bg-gray-50 text-center border-t border-gray-100">
                      <span className="text-xs text-gray-500">
                        +{getFilteredAndSortedContacts().length - 5}명 더 보기
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 오른쪽 메인 콘텐츠 - 리포트와 일정 */}
            <div className="lg:col-span-2 space-y-8">
              {/* 리포트 섹션 */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-3 sm:mb-0">최신 리포트</h2>
                  <div className="hidden sm:block ml-4 h-1 flex-1 bg-gradient-to-r from-purple-300 to-transparent rounded-full"></div>
                  <button
                    onClick={handleGenerateReport}
                    disabled={generatingReport}
                    className="sm:ml-4 px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-medium"
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
                      '📊 리포트 생성'
                    )}
                  </button>
                </div>
                <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">
                  <ReportsList reports={reports} />
                </div>
              </div>

              {/* 일정 섹션 */}
              <div>
                <div className="flex items-center mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                    {selectedContact ? `${selectedContact.name}님과의 오늘 일정` : '오늘의 일정'}
                  </h2>
                  <div className="ml-4 h-1 flex-1 bg-gradient-to-r from-green-300 to-transparent rounded-full"></div>
                  <div className="flex items-center space-x-2">
                    {selectedContact && (
                      <button
                        onClick={() => {
                          setSelectedContact(null)
                          // 즉시 피드백을 위한 강제 리렌더링 트리거
                        }}
                        className="text-xs text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-md transition-all duration-200 hover:scale-105 active:scale-95"
                      >
                        ✕ 전체 보기
                      </button>
                    )}
                    <span className="text-sm text-gray-500">
                      {getTodayActions(selectedContact?.id).length}개
                    </span>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">
                  {getTodayActions(selectedContact?.id).length > 0 ? (
                    <ActionsList actions={getTodayActions(selectedContact?.id)} itemsPerPage={5} />
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm">
                        {selectedContact 
                          ? `${selectedContact.name}님과의 오늘 일정이 없습니다` 
                          : '오늘 예정된 일정이 없습니다'
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <section className="mb-12 sm:mb-16">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight mb-3 sm:mb-0">전체 리포트</h2>
                <div className="hidden sm:block ml-4 h-1 flex-1 bg-gradient-to-r from-purple-300 to-transparent rounded-full"></div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-500">
                    총 {allReports.length}개
                  </span>
                  <button
                    onClick={handleGenerateReport}
                    disabled={generatingReport}
                    className="px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg sm:rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-medium"
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
                      '📊 새 리포트 생성'
                    )}
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">
                {allReports.length > 0 ? (
                  <ReportsList reports={allReports} />
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm mb-4">아직 생성된 리포트가 없습니다</p>
                    <button
                      onClick={handleGenerateReport}
                      disabled={generatingReport}
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
                    >
                      첫 번째 리포트 생성하기
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'actions' && (
          <section className="mb-12 sm:mb-16">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">예정된 일정</h2>
                <div className="ml-4 h-1 flex-1 bg-gradient-to-r from-green-300 to-transparent rounded-full"></div>
                <span className="text-sm text-gray-500">
                  총 {actions.length}개
                </span>
              </div>
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">
                {actions.length > 0 ? (
                  <div className="p-6">
                    <div className="space-y-3">
                      {actions.map((action, index) => (
                        <div 
                          key={action.id} 
                          className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100 mb-2"
                        >
                          {/* 상태 선택 드롭다운 */}
                          <div className="flex-shrink-0">
                            <select 
                              className="text-xs px-2 py-1 rounded-full border-0 focus:ring-2 focus:ring-blue-500"
                              defaultValue="예정"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="완료" className="bg-green-50 text-green-700">완료</option>
                              <option value="진행중" className="bg-yellow-50 text-yellow-700">진행중</option>
                              <option value="예정" className="bg-blue-50 text-blue-700">예정</option>
                            </select>
                          </div>
                          
                          {/* 일정 상세 정보 */}
                          <div 
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => {
                              if (action.contact_id) {
                                window.location.href = `/contacts/${action.contact_id}`
                              }
                            }}
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                              {/* 이름 */}
                              <div className="sm:col-span-1">
                                <span className="text-sm font-semibold text-gray-900">
                                  {action.contacts?.name || '연락처 없음'}
                                </span>
                              </div>
                              
                              {/* 기업 */}
                              <div className="sm:col-span-1">
                                <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                                  {action.contacts?.company || '기업 정보 없음'}
                                </span>
                              </div>
                              
                              {/* 제목 */}
                              <div className="sm:col-span-1">
                                <span className="text-sm text-gray-800 font-medium truncate">
                                  {action.description || '제목 없음'}
                                </span>
                              </div>
                              
                              {/* 날짜 */}
                              <div className="sm:col-span-1 text-right">
                                <span className="text-xs text-gray-500">
                                  {action.due_date ? new Date(action.due_date).toLocaleDateString('ko-KR', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  }) : '날짜 미정'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* 화살표 아이콘 */}
                          <div className="flex-shrink-0">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">예정된 일정이 없습니다</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'contacts' && (
          <section className="mb-12 sm:mb-16">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">전체 연락처</h2>
                <div className="ml-4 h-1 flex-1 bg-gradient-to-r from-blue-300 to-transparent rounded-full"></div>
              </div>

              {/* 필터 및 정렬 컨트롤 */}
              <div className="bg-white rounded-xl p-4 shadow-lg mb-6 border border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">기업 필터</label>
                    <select
                      value={contactFilter}
                      onChange={(e) => setContactFilter(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">전체 기업</option>
                      {getCompanyList().map(company => (
                        <option key={company} value={company}>{company}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">정렬 기준</label>
                    <select
                      value={contactSort}
                      onChange={(e) => setContactSort(e.target.value as 'name' | 'company' | 'recent')}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="name">이름순</option>
                      <option value="company">기업순</option>
                      <option value="recent">최근 연락순</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <div className="text-sm text-gray-600">
                      총 <span className="font-semibold text-blue-600">{getFilteredAndSortedContacts().length}</span>명의 연락처
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">
                <ContactList 
                  contacts={getFilteredAndSortedContacts()} 
                  paginationType="pageNumbers" 
                  itemsPerPage={12} 
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