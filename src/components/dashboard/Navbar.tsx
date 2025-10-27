import React from 'react'
import { Link } from 'react-router-dom'

export const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg" style={{maxWidth: 40, maxHeight: 40}}>
            <svg className="w-6 h-6 text-white" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Sales Assistant
          </h1>
        </div>
        <nav className="flex items-center space-x-8">
          <Link className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200" to="/">
            대시보드
          </Link>
          <Link className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200" to="/login">
            로그인
          </Link>
        </nav>
      </div>
    </header>
  )
}

export default Navbar
