import React from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './contexts/AuthContext'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Dashboard } from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import ContactDetail from './pages/ContactDetail'
import ReportDetail from './pages/ReportDetail'
import ContactsPage from './pages/Contacts'
import './index.css'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* 공개 대시보드: 인증 없이 접근 가능 */}
          <Route path="/" element={<Dashboard userId="" />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/contacts/:id" element={<ContactDetail />} />
          <Route path="/reports/:id" element={<ReportDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

const container = document.getElementById('root')
if (!container) {
  throw new Error('Root container not found. Ensure your index.html has <div id="root"></div>')
}

createRoot(container).render(<App />)
