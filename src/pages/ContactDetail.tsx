import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../config/supabase'
import type { Database } from '../types/supabase'

type Contact = Database['public']['Tables']['contacts']['Row']
type SmalltalkCache = Database['public']['Tables']['smalltalk_cache']['Row']
import SmalltalkPanel from '../components/contact/SmalltalkPanel'
import { CallRecorder } from '../components/CallRecorder'

export const ContactDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [smalltalks, setSmalltalks] = useState<SmalltalkCache[]>([])
  const [stLoading, setStLoading] = useState(true)

  const loadSmalltalks = async (contactId: string) => {
    setStLoading(true)
    try {
      const nowIso = new Date().toISOString()
      const { data, error } = await supabase
        .from('smalltalk_cache')
        .select('*')
        .eq('contact_id', contactId)
        .gt('expires_at', nowIso)
        .order('expires_at', { ascending: false })
        .limit(5)

      if (error) throw error
      let items = data || []
      if (items.length === 0) {
        const { data: fallback, error: fbErr } = await supabase
          .from('smalltalk_cache')
          .select('*')
          .eq('contact_id', contactId)
          .order('created_at', { ascending: false })
          .limit(3)
        if (!fbErr && fallback) items = fallback
      }
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
      setLoading(false)
    })()
  }, [id])

  // Load smalltalk cache (prefer non-expired, newest first)
  useEffect(() => {
    if (!id) return
    loadSmalltalks(id)
  }, [id])

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
          <SmalltalkPanel items={smalltalks} />
        )}
      </div>
    </div>
  )
}

export default ContactDetail
