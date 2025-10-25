import React from 'react'
import { Link } from 'react-router-dom'
import type { Contact } from '../../utils/supabase'

type Props = {
  contacts: Contact[]
}

export const ContactList: React.FC<Props> = ({ contacts }) => {
  if (!contacts || contacts.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <p className="text-gray-500 font-medium">최근 고객이 없습니다</p>
        <p className="text-sm text-gray-400 mt-1">고객을 추가하면 여기에 표시됩니다</p>
      </div>
    )
  }

  return (
    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {contacts.map(c => (
        <Link
          key={c.id}
          to={`/contacts/${c.id}`}
          className="group block bg-white rounded-2xl border border-gray-100 shadow-md shadow-gray-200/30 hover:shadow-xl hover:shadow-gray-300/40 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
        >
          <div className="p-5">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center font-bold text-base shadow-lg ring-1 ring-white/40">
                {c.name?.charAt(0) || '?'}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors text-sm">{c.name}</h3>
                <div className="text-xs text-gray-600 truncate">{c.company}</div>
                {c.position && <div className="text-xs text-gray-500 truncate">{c.position}</div>}
              </div>
            </div>

            <div className="space-y-1.5">
              {c.phone && (
                <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded-lg">
                  <svg className="w-3 h-3 flex-shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.89.34 1.76.65 2.59a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.49-1.22a2 2 0 0 1 2.11-.45c.83.31 1.7.53 2.59.65A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span className="truncate flex-1">{c.phone}</span>
                </div>
              )}
              {c.email && (
                <div className="flex items-center gap-1.5 text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded-lg">
                  <svg className="w-3 h-3 flex-shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <span className="truncate flex-1">{c.email}</span>
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

export default ContactList
