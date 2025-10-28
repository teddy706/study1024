import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../config/supabase'
import type { Database } from '../types/supabase'
import SmalltalkService from '../services/smalltalk.service'

type Contact = Database['public']['Tables']['contacts']['Row']
type SmalltalkCache = Database['public']['Tables']['smalltalk_cache']['Row']
import SmalltalkPanel from '../components/contact/SmalltalkPanel'
import MeetingSection from './MeetingSection'

const smalltalkService = new SmalltalkService()

export const ContactDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [smalltalks, setSmalltalks] = useState<SmalltalkCache[]>([])
  const [stLoading, setStLoading] = useState(true)
  const [isEditingInterests, setIsEditingInterests] = useState(false)
  const [interestsValue, setInterestsValue] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditingContact, setIsEditingContact] = useState(false)
  const [editFormData, setEditFormData] = useState<Partial<Contact>>({})
  const [isSaving, setIsSaving] = useState(false)

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
        .limit(50)

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
          .limit(20)
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
      setEditFormData({
        name: data?.name,
        company: data?.company,
        position: data?.position,
        mobile: data?.mobile,
        office_phone: data?.office_phone,
        fax: data?.fax,
        email: data?.email,
        address: data?.address,
        interests: data?.interests,
      })
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

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSaveContact = async () => {
    if (!contact?.id) return
    
    if (!editFormData.name || !editFormData.company) {
      alert('이름과 회사명은 필수 입력 항목입니다.')
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('contacts')
        .update({
          name: editFormData.name,
          company: editFormData.company,
          position: editFormData.position,
          mobile: editFormData.mobile,
          office_phone: editFormData.office_phone,
          fax: editFormData.fax,
          email: editFormData.email,
          address: editFormData.address,
          interests: editFormData.interests,
        })
        .eq('id', contact.id)

      if (error) throw error

      // 상태 업데이트
      setContact({ ...contact, ...editFormData } as Contact)
      setInterestsValue(editFormData.interests ?? '')
      setIsEditingContact(false)
      alert('✅ 연락처 정보가 저장되었습니다.')
    } catch (error) {
      console.error('저장 오류:', error)
      alert(error instanceof Error ? error.message : '연락처 저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditFormData({
      name: contact?.name,
      company: contact?.company,
      position: contact?.position,
      mobile: contact?.mobile,
      office_phone: contact?.office_phone,
      fax: contact?.fax,
      email: contact?.email,
      address: contact?.address,
      interests: contact?.interests,
    })
    setIsEditingContact(false)
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

  const handleDeleteContact = async () => {
    if (!contact?.id) return
    
    const confirmed = window.confirm(
      `정말로 "${contact.name}" 연락처를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
    )
    
    if (!confirmed) return
    
    setIsDeleting(true)
    try {
      // 명함 이미지가 있다면 Storage에서도 삭제
      if (contact.business_card_image_url) {
        const imageUrl = contact.business_card_image_url
        const fileName = imageUrl.split('/business-cards/')[1]
        if (fileName) {
          await supabase.storage.from('business-cards').remove([fileName])
        }
      }

      // 연락처 삭제
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contact.id)

      if (error) throw error

      alert('✅ 연락처가 삭제되었습니다.')
      navigate('/')
    } catch (error) {
      console.error('연락처 삭제 실패:', error)
      alert('❌ 연락처 삭제에 실패했습니다.')
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>
  if (!contact) return <div className="p-8">연락처를 찾을 수 없습니다. <Link to="/">돌아가기</Link></div>

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <Link to="/" className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors">
          ← 대시보드로 돌아가기
        </Link>
        <div className="flex gap-2">
          {!isEditingContact && (
            <button
              onClick={() => setIsEditingContact(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              ✏️ 연락처 편집
            </button>
          )}
          <button
            onClick={handleDeleteContact}
            disabled={isDeleting}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDeleting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {isDeleting ? '삭제 중...' : '🗑️ 연락처 삭제'}
          </button>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6 mt-4">
        {isEditingContact ? (
          /* 편집 모드 */
          <div>
            <h2 className="text-xl font-bold mb-4">연락처 정보 편집</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={editFormData.name || ''}
                  onChange={handleEditInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  회사명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="company"
                  value={editFormData.company || ''}
                  onChange={handleEditInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  직책
                </label>
                <input
                  type="text"
                  name="position"
                  value={editFormData.position || ''}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  휴대폰
                </label>
                <input
                  type="tel"
                  name="mobile"
                  value={editFormData.mobile || ''}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  사무실 전화
                </label>
                <input
                  type="tel"
                  name="office_phone"
                  value={editFormData.office_phone || ''}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  팩스
                </label>
                <input
                  type="tel"
                  name="fax"
                  value={editFormData.fax || ''}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이메일
                </label>
                <input
                  type="email"
                  name="email"
                  value={editFormData.email || ''}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  주소
                </label>
                <textarea
                  name="address"
                  value={editFormData.address || ''}
                  onChange={handleEditInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  관심사
                </label>
                <textarea
                  name="interests"
                  value={editFormData.interests || ''}
                  onChange={handleEditInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 골프, 와인, IT 트렌드, 독서"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleSaveContact}
                disabled={isSaving}
                className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                  isSaving
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isSaving ? '저장 중...' : '💾 저장'}
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          /* 보기 모드 */
          <>
            <h2 className="text-2xl font-bold mb-2">{contact.name}</h2>
            <p className="text-gray-600 mb-1">{contact.company} — {contact.position}</p>
            {contact.mobile && (
              <p className="mb-1">휴대폰: <a href={`tel:${contact.mobile}`} className="text-blue-600">{contact.mobile}</a></p>
            )}
            {contact.office_phone && (
              <p className="mb-1">사무실 전화: <a href={`tel:${contact.office_phone}`} className="text-blue-600">{contact.office_phone}</a></p>
            )}
            {contact.fax && (
              <p className="mb-1">팩스: {contact.fax}</p>
            )}
            <p className="mb-1">이메일: {contact.email}</p>
            <p className="mb-1">주소: {contact.address}</p>
            
            {/* 명함 이미지는 웹에서 숨김 처리됨 */}
            
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

        {/* 미팅 기록 및 메모 */}
        <MeetingSection contactId={contact.id} lastContact={contact.last_contact} onMeetingAdded={(date: string) => setContact({ ...contact, last_contact: date })} />
          </>
        )}
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
