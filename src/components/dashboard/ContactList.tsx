import React from 'react'
import { Link } from 'react-router-dom'
import type { Contact } from '../../utils/supabase'

type Props = {
  contacts: Contact[]
}

export const ContactList: React.FC<Props> = ({ contacts }) => {
  if (!contacts || contacts.length === 0) return <div>최근 고객이 없습니다.</div>

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {contacts.map(c => (
        <Link key={c.id} to={`/contacts/${c.id}`} className="block bg-white rounded-lg shadow p-4 hover:shadow-md transition">
          <h3 className="font-semibold">{c.name}</h3>
          <p className="text-gray-600">{c.company}</p>
          <p className="text-gray-600">{c.position}</p>
          <div className="text-blue-500 mt-2">{c.phone}</div>
        </Link>
      ))}
    </div>
  )
}

export default ContactList
