import React, { useState, useMemo, useEffect } from 'react'
import type { Database } from '../../types/supabase'
import ScheduleService from '../../services/schedule.service'
import { supabase } from '../../config/supabase'

type Action = Database['public']['Tables']['actions']['Row']
type Contact = Database['public']['Tables']['contacts']['Row']

// 연락처 정보가 포함된 액션 타입
type ActionWithContact = Action & {
  contacts?: Pick<Contact, 'id' | 'name' | 'company' | 'position'>
}

type Props = { 
  actions: ActionWithContact[]
  itemsPerPage?: number
  showAIAnalysis?: boolean
  contactId?: string
}

export const ActionsList: React.FC<Props> = ({ 
  actions, 
  itemsPerPage = 5, 
  showAIAnalysis = false,
  contactId 
}) => {
  console.log('🔍 ActionsList props:', { contactId, showAIAnalysis, actionsLength: actions.length })
  
  const [currentPage, setCurrentPage] = useState(1)
  const [analyzingSchedule, setAnalyzingSchedule] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAction, setNewAction] = useState({
    type: '',
    description: '',
    due_date: '',
    status: 'pending' as const,
    contact_id: ''
  })
  const [contacts, setContacts] = useState<Pick<Contact, 'id' | 'name' | 'company'>[]>([])
  const [loadingContacts, setLoadingContacts] = useState(false)
  const scheduleService = new ScheduleService()

  // 연락처 목록 로드 (contactId가 없을 때만)
  useEffect(() => {
    if (!contactId && showAddForm) {
      loadContacts()
    }
  }, [contactId, showAddForm])

  const loadContacts = async () => {
    try {
      setLoadingContacts(true)
      const { data, error } = await supabase
        .from('contacts')
        .select('id, name, company')
        .order('name', { ascending: true })
        .limit(50)

      if (error) throw error
      setContacts(data || [])
    } catch (error) {
      console.error('연락처 로드 실패:', error)
    } finally {
      setLoadingContacts(false)
    }
  }

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return actions.slice(startIndex, endIndex)
  }, [actions, currentPage, itemsPerPage])

  const totalPages = Math.ceil(actions.length / itemsPerPage)
  const showPagination = actions.length > itemsPerPage

  const handleAIAnalysis = async () => {
    if (!contactId) return
    
    setAnalyzingSchedule(true)
    try {
      console.log('🤖 AI 일정 분석 시작, contactId:', contactId)
      const result = await scheduleService.analyzeAllMeetingsForContact(contactId)
      console.log('🤖 AI 분석 결과:', result)
      
      if (result && Array.isArray(result) && result.length > 0) {
        alert(`✅ AI 일정 분석이 완료되었습니다! ${result.length}개의 일정이 생성되었습니다.`)
      } else {
        alert('✅ AI 일정 분석이 완료되었지만 새로운 일정이 생성되지 않았습니다. 미팅 기록을 확인해주세요.')
      }
      
      window.location.reload()
    } catch (error) {
      console.error('❌ AI 일정 분석 실패:', error)
      alert(`❌ AI 일정 분석에 실패했습니다: ${(error as Error).message || '미팅 기록을 확인해주세요.'}`)
    } finally {
      setAnalyzingSchedule(false)
    }
  }

  const handleAddAction = async () => {
    console.log('🔨 수동 일정 추가 시작...')
    console.log('📋 입력된 데이터:', newAction)
    console.log('👤 연락처 ID:', contactId)

    // contactId가 없으면 newAction.contact_id 사용 (대시보드에서)
    const targetContactId = contactId || newAction.contact_id

    if (!targetContactId || !newAction.type || !newAction.description || !newAction.due_date) {
      const missingFields = []
      if (!targetContactId) missingFields.push('연락처 선택')
      if (!newAction.type) missingFields.push('일정 종류')
      if (!newAction.description) missingFields.push('설명')
      if (!newAction.due_date) missingFields.push('마감일')
      
      console.error('❌ 필수 필드 누락:', missingFields)
      alert(`모든 필드를 입력해주세요. 누락된 필드: ${missingFields.join(', ')}`)
      return
    }

    try {
      const actionData = {
        contact_id: targetContactId,
        type: newAction.type,
        description: newAction.description,
        due_date: new Date(newAction.due_date).toISOString(),
        status: newAction.status
      }

      console.log('💾 저장할 액션 데이터:', actionData)
      
      const result = await scheduleService.createAction(actionData)
      console.log('✅ 액션 생성 성공:', result)
      
      alert('✅ 일정이 추가되었습니다!')
      setShowAddForm(false)
      setNewAction({
        type: '',
        description: '',
        due_date: '',
        status: 'pending',
        contact_id: ''
      })
      window.location.reload()
    } catch (error) {
      console.error('💥 일정 추가 실패:', error)
      console.error('💥 오류 상세:', (error as Error).message)
      alert(`❌ 일정 추가에 실패했습니다: ${(error as Error).message || '알 수 없는 오류'}`)
    }
  }

  const handleStatusUpdate = async (id: string, status: 'pending' | 'in_progress' | 'completed') => {
    try {
      await scheduleService.updateActionStatus(id, status)
      window.location.reload()
    } catch (error) {
      console.error('상태 업데이트 실패:', error)
      alert('❌ 상태 업데이트에 실패했습니다.')
    }
  }
  if (!actions || actions.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-50 rounded-full mb-4">
          <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-gray-500 font-medium">예정된 일정이 없습니다</p>
        <p className="text-sm text-gray-400 mt-1">AI 분석 또는 수동으로 일정을 추가해보세요</p>
        
        {(() => {
          console.log('🔍 일정 없을 때 버튼 표시 조건:', { showAIAnalysis, contactId, condition: showAIAnalysis && contactId })
          return showAIAnalysis && contactId
        })() && (
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleAIAnalysis}
              disabled={analyzingSchedule}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {analyzingSchedule ? (
                <>
                  <svg className="inline w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  AI 분석 중...
                </>
              ) : (
                '🤖 미팅 기록 AI 분석'
              )}
            </button>
            <button
              onClick={() => {
                console.log('🔘 수동 추가 버튼 클릭됨')
                setShowAddForm(true)
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
            >
              ➕ 수동 추가
            </button>
          </div>
        )}
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700'
      case 'in_progress': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '완료'
      case 'in_progress': return '진행중'
      default: return '대기'
    }
  }

  return (
    <div>
      {/* AI 분석 및 추가 버튼 */}
      {(() => {
        console.log('🔍 일정 있을 때 버튼 표시 조건:', { showAIAnalysis, contactId, actionsLength: actions.length, condition: showAIAnalysis && contactId && actions.length > 0 })
        return showAIAnalysis && contactId && actions.length > 0
      })() && (
        <div className="px-6 py-3 bg-green-50 border-b border-green-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-700">💡 AI로 미팅 기록을 분석해서 자동으로 일정을 생성할 수 있습니다</span>
            <div className="flex gap-2">
              <button
                onClick={handleAIAnalysis}
                disabled={analyzingSchedule}
                className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
              >
                {analyzingSchedule ? '분석 중...' : '🤖 AI 분석'}
              </button>
              <button
                onClick={() => {
                  console.log('🔘 상단 수동 추가 버튼 클릭됨')
                  setShowAddForm(true)
                }}
                className="px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
              >
                ➕ 추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 페이지 정보 표시 */}
      {showPagination && (
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">전체 {actions.length}개</span>
            <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">
              {currentPage} / {totalPages} 페이지
            </span>
          </div>
        </div>
      )}

      {/* 일정 추가 폼 */}
      {showAddForm && (
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
          <h4 className="font-medium text-blue-900 mb-3">새 일정 추가</h4>
          <div className="space-y-3">
            {/* 연락처 선택 (contactId가 없을 때만 표시) */}
            {!contactId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  연락처 선택 *
                </label>
                <select
                  value={newAction.contact_id}
                  onChange={(e) => setNewAction(prev => ({ ...prev, contact_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  disabled={loadingContacts}
                >
                  <option value="">연락처를 선택하세요</option>
                  {contacts.map(contact => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name} {contact.company && `(${contact.company})`}
                    </option>
                  ))}
                </select>
                {loadingContacts && (
                  <p className="text-xs text-gray-500 mt-1">연락처 목록을 불러오는 중...</p>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="일정 유형 (예: 미팅, 문서작성, 검토)"
                value={newAction.type}
                onChange={(e) => setNewAction(prev => ({ ...prev, type: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="datetime-local"
                value={newAction.due_date}
                onChange={(e) => setNewAction(prev => ({ ...prev, due_date: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <textarea
              placeholder="구체적인 작업 내용을 입력하세요"
              value={newAction.description}
              onChange={(e) => setNewAction(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              rows={2}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setNewAction({
                    type: '',
                    description: '',
                    due_date: '',
                    status: 'pending',
                    contact_id: ''
                  })
                }}
                className="px-3 py-2 text-gray-600 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
              >
                취소
              </button>
              <button
                onClick={handleAddAction}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="divide-y divide-gray-100">
        {paginatedData.map(a => (
        <div 
          key={a.id} 
          className="p-6 hover:bg-green-50/30 transition-all duration-200 group"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3 flex-1">
              <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-semibold text-gray-900">{a.type}</span>
                  <select
                    value={a.status}
                    onChange={(e) => handleStatusUpdate(a.id, e.target.value as any)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${getStatusColor(a.status)}`}
                  >
                    <option value="pending">대기</option>
                    <option value="in_progress">진행중</option>
                    <option value="completed">완료</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2 mb-1">
                  {/* 고객 정보 표시 */}
                  {a.contacts && (
                    <div className="flex items-center space-x-1">
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                        👤 {a.contacts.name}
                      </span>
                      {a.contacts.company && (
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                          🏢 {a.contacts.company}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {new Date(a.due_date).toLocaleString('ko-KR', { 
                    month: 'long', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          </div>
          <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed ml-13">{a.description}</p>
        </div>
      ))}
      </div>
      
      {/* 페이지네이션 컨트롤 */}
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            이전
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-3 py-2 text-sm font-medium rounded-lg ${
                  pageNum === currentPage
                    ? 'bg-green-600 text-white'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

export default ActionsList
