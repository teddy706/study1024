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
    <div className="divide-y divide-gray-100">
      {contacts.map(c => (
        <Link 
          key={c.id} 
          to={`/contacts/${c.id}`} 
          className="block p-6 hover:bg-gray-50 transition-all duration-200 group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base shadow-lg">
                {c.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{c.name}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm text-gray-600">{c.company}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-sm text-gray-500">{c.position}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-blue-600">{c.phone}</div>
                <div className="text-xs text-gray-400 mt-1">{c.email}</div>
              </div>
              <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

export default ContactList
