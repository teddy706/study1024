import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import type { Contact } from '../utils/supabase'

export const ContactDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)

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
      </div>
    </div>
  )
}

export default ContactDetail
