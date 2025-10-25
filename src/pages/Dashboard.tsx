import React, { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import type { Contact, Report, Action } from '../utils/supabase'

interface DashboardProps {
  userId: string
}

export const Dashboard: React.FC<DashboardProps> = ({ userId }) => {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [actions, setActions] = useState<Action[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [userId])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // 최근 연락처 로드
      const { data: contactsData } = await supabase
        .from('contacts')
        .select('*')
        .order('last_contact', { ascending: false })
        .limit(5)

      // 최신 리포트 로드
      const { data: reportsData } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      // 예정된 일정 로드
      const { data: actionsData } = await supabase
        .from('actions')
        .select('*')
        .gte('due_date', new Date().toISOString())
        .order('due_date', { ascending: true })
        .limit(5)

      if (contactsData) setContacts(contactsData)
      if (reportsData) setReports(reportsData)
      if (actionsData) setActions(actionsData)

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 섹션 */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-600">오늘의 업무 현황</p>
      </header>

      {/* 주요 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">고객 현황</h3>
          <p className="text-3xl font-bold">{contacts.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">새로운 리포트</h3>
          <p className="text-3xl font-bold">{reports.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">예정된 일정</h3>
          <p className="text-3xl font-bold">{actions.length}</p>
        </div>
      </div>

      {/* 최근 고객 */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">최근 고객</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map(contact => (
            <div key={contact.id} className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold">{contact.name}</h3>
              <p className="text-gray-600">{contact.company}</p>
              <p className="text-gray-600">{contact.position}</p>
              <a href={`tel:${contact.phone}`} className="text-blue-500 hover:text-blue-700">
                {contact.phone}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* 최신 리포트 */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">최신 리포트</h2>
        <div className="space-y-4">
          {reports.map(report => (
            <div key={report.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">{report.type}</span>
                <span className="text-gray-500">
                  {new Date(report.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-700">{report.content}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 예정된 일정 */}
      <section>
        <h2 className="text-2xl font-bold mb-4">예정된 일정</h2>
        <div className="space-y-4">
          {actions.map(action => (
            <div key={action.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">{action.type}</span>
                <span className="text-gray-500">
                  {new Date(action.due_date).toLocaleString()}
                </span>
              </div>
              <p className="text-gray-700">{action.description}</p>
              <span className={`inline-block px-2 py-1 rounded text-sm ${
                action.status === 'completed' ? 'bg-green-100 text-green-800' :
                action.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {action.status}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}