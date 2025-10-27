import React from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './contexts/AuthContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Dashboard } from './pages/Dashboard'
import ContactDetail from './pages/ContactDetail'
import ReportDetail from './pages/ReportDetail'
import ContactsPage from './pages/Contacts'
import AddContact from './pages/AddContact'
import ReportSettings from './pages/ReportSettings'
import { Login } from './pages/Login'
import ProtectedRoute from './components/ProtectedRoute'
import './index.css'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* 로그인 페이지 (인증 불필요) */}
            <Route path="/login" element={<Login />} />
            
            {/* 모든 라우트가 보호됨 - 인증 필요 */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/contacts" 
              element={
                <ProtectedRoute>
                  <ContactsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/contacts/new" 
              element={
                <ProtectedRoute>
                  <AddContact />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/contacts/:id" 
              element={
                <ProtectedRoute>
                  <ContactDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/reports/:id" 
              element={
                <ProtectedRoute>
                  <ReportDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/report-settings" 
              element={
                <ProtectedRoute>
                  <ReportSettings />
                </ProtectedRoute>
              } 
            />
            
            {/* 404 처리 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  )
}

const container = document.getElementById('root')
if (!container) {
  throw new Error('Root container not found. Ensure your index.html has <div id="root"></div>')
}

createRoot(container).render(<App />)
