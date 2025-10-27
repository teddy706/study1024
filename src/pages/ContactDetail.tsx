import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../config/supabase'
import type { Database } from '../types/supabase'
import SmalltalkService from '../services/smalltalk.service'

type Contact = Database['public']['Tables']['contacts']['Row']
type SmalltalkCache = Database['public']['Tables']['smalltalk_cache']['Row']
import SmalltalkPanel from '../components/contact/SmalltalkPanel'
import { CallRecorder } from '../components/CallRecorder'

const smalltalkService = new SmalltalkService()

export const ContactDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [smalltalks, setSmalltalks] = useState<SmalltalkCache[]>([])
  const [stLoading, setStLoading] = useState(true)
  const [isEditingInterests, setIsEditingInterests] = useState(false)
  const [interestsValue, setInterestsValue] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const loadSmalltalks = async (contactId: string) => {
    setStLoading(true)
    try {
      // 현재 로그인 사용자 확인 (RLS 일치 보장)
      const { data: authData, error: authErr } = await supabase.auth.getUser()
      if (authErr) {
        console.warn('smalltalk 조회: 사용자 확인 실패', authErr)
      }
      const currentUserId = authData?.user?.id

      const nowIso = new Date().toISOString()
      let query = supabase
        .from('smalltalk_cache')
        .select('*')
        .eq('contact_id', contactId)
        .gt('expires_at', nowIso)
        .order('expires_at', { ascending: false })
        .limit(5)

      // 명시적으로 user_id 일치 (RLS와 일관성)
      if (currentUserId) {
        query = query.eq('user_id', currentUserId)
      }

      const { data, error } = await query

      if (error) throw error
      let items = data || []
      console.log('🔎 smalltalk 1차 조회(미만료):', { count: items.length, items })
      if (items.length === 0) {
        let fbQuery = supabase
          .from('smalltalk_cache')
          .select('*')
          .eq('contact_id', contactId)
          .order('created_at', { ascending: false })
          .limit(3)
        if (currentUserId) {
          fbQuery = fbQuery.eq('user_id', currentUserId)
        }
        const { data: fallback, error: fbErr } = await fbQuery
        if (!fbErr && fallback) items = fallback
      }
      console.log('✅ smalltalk 최종 결과:', { count: items.length })
      setSmalltalks(items)
    } finally {
      setStLoading(false)
    }
  }

  useEffect(() => {
    if (!id) return
    (async () => {
      setLoading(true)
      const { data, error } = await supabase.from('contacts').select('*').eq('id', id).single()
      if (error) console.error(error)
      setContact(data ?? null)
      setInterestsValue(data?.interests ?? '')
      setLoading(false)
    })()
  }, [id])

  // Load smalltalk cache (prefer non-expired, newest first)
  useEffect(() => {
    if (!id) return
    loadSmalltalks(id)
  }, [id])

  const handleSaveInterests = async () => {
    if (!contact?.id) return
    const { error } = await supabase
      .from('contacts')
      .update({ interests: interestsValue })
      .eq('id', contact.id)
    
    if (error) {
      console.error('관심사 저장 실패:', error)
      alert('관심사 저장에 실패했습니다.')
    } else {
      setContact({ ...contact, interests: interestsValue })
      setIsEditingInterests(false)
      alert('관심사가 저장되었습니다!')
    }
  }

  const handleGenerateSmalltalks = async () => {
    if (!contact?.id) return
    setIsGenerating(true)
    try {
      const count = await smalltalkService.generateFromContactInfo(contact.id)
      alert(`✅ 스몰토크 ${count}개가 생성되었습니다!`)
      // 생성 후 목록 새로고침
      await loadSmalltalks(contact.id)
    } catch (error) {
      console.error('스몰토크 생성 실패:', error)
      alert('❌ 스몰토크 생성에 실패했습니다.')
    } finally {
      setIsGenerating(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>
  if (!contact) return <div className="p-8">연락처를 찾을 수 없습니다. <Link to="/">돌아가기</Link></div>

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/" className="text-blue-600">← 대시보드로 돌아가기</Link>
      <div className="bg-white rounded-lg shadow p-6 mt-4">
        <h2 className="text-2xl font-bold mb-2">{contact.name}</h2>
        <p className="text-gray-600 mb-1">{contact.company} — {contact.position}</p>
        <p className="mb-1">전화: <a href={`tel:${contact.phone}`} className="text-blue-600">{contact.phone}</a></p>
        <p className="mb-1">이메일: {contact.email}</p>
        <p className="mb-1">주소: {contact.address}</p>
        
        {/* 관심사 편집 */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">관심사</h3>
            {!isEditingInterests && (
              <button
                onClick={() => setIsEditingInterests(true)}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                편집
              </button>
            )}
          </div>
          {isEditingInterests ? (
            <div className="space-y-2">
              <textarea
                value={interestsValue}
                onChange={(e) => setInterestsValue(e.target.value)}
                placeholder="예: 골프, 와인, IT 트렌드, 독서"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveInterests}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  저장
                </button>
                <button
                  onClick={() => {
                    setInterestsValue(contact.interests ?? '')
                    setIsEditingInterests(false)
                  }}
                  className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              {contact.interests || '등록된 관심사가 없습니다. 편집 버튼을 눌러 추가해보세요.'}
            </p>
          )}
        </div>

        <p className="text-sm text-gray-500 mt-4">마지막 연락: {contact.last_contact}</p>
        {/* 통화 녹음 및 AI 요약 → Smalltalk 생성 */}
        <div className="mt-4">
          <CallRecorder
            contactId={contact.id}
            onRecordingComplete={async () => {
              if (contact?.id) await loadSmalltalks(contact.id)
            }}
          />
        </div>
      </div>

      {/* Smalltalk Section */}
      <div className="mt-6">
        {stLoading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-4" />
            <div className="space-y-3">
              <div className="h-14 bg-gray-100 rounded-xl" />
              <div className="h-14 bg-gray-100 rounded-xl" />
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">스몰토크 소재</h3>
              <button
                onClick={handleGenerateSmalltalks}
                disabled={isGenerating}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isGenerating
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isGenerating ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    생성 중...
                  </span>
                ) : (
                  '🤖 AI 스몰토크 생성'
                )}
              </button>
            </div>
            <SmalltalkPanel items={smalltalks} />
          </>
        )}
      </div>
    </div>
  )
}

export default ContactDetail
