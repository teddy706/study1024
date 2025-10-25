import React from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './hooks/useAuth'
import { Dashboard } from './pages/Dashboard'

function AppInside() {
  const { user, loading } = useAuth()

  if (loading) return <div>Loading...</div>

  return <Dashboard userId={user?.id ?? ''} />
}

function App() {
  return (
    <AuthProvider>
      <AppInside />
    </AuthProvider>
  )
}

const container = document.getElementById('root')
if (!container) {
  throw new Error('Root container not found. Ensure your index.html has <div id="root"></div>')
}

createRoot(container).render(<App />)
