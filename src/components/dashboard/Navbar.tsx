import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../config/supabase'

export const Navbar: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* 로고 */}
          <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity duration-200">
            <img 
              src="/logo.png" 
              alt="Salestailor Logo" 
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-full"
              onError={(e) => {
                console.error('Logo image failed to load');
                // 이미지 로드 실패 시 기본 아이콘으로 대체
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div 
              className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white" 
              style={{ display: 'none' }}
            >
              <span className="text-white font-bold text-xs sm:text-sm">🗣️</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Salestailor
            </h1>
          </Link>

          {/* 데스크톱 네비게이션 */}
          <nav className="hidden lg:flex items-center space-x-6">
            <Link className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200" to="/">
              대시보드
            </Link>
            <Link className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200" to="/contacts/new">
              연락처 등록
            </Link>
            <Link className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200" to="/products">
              상품 관리
            </Link>
            <Link className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200" to="/report-settings">
              리포트 설정
            </Link>
            {user ? (
              <>
                <span className="text-sm text-gray-600 truncate max-w-32">
                  {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors duration-200"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <Link className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200" to="/login">
                로그인
              </Link>
            )}
          </nav>

          {/* 모바일 햄버거 메뉴 버튼 */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
            aria-label="메뉴 열기"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* 모바일 드롭다운 메뉴 */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-3 pt-4">
              <Link 
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200 py-2" 
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                📊 대시보드
              </Link>
              <Link 
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200 py-2" 
                to="/contacts/new"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                ➕ 연락처 등록
              </Link>
              <Link 
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200 py-2" 
                to="/products"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                🛍️ 상품 관리
              </Link>
              <Link 
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200 py-2" 
                to="/report-settings"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                ⚙️ 리포트 설정
              </Link>
              {user ? (
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="text-sm text-gray-600 py-2 truncate">
                    👤 {user.email}
                  </div>
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsMobileMenuOpen(false)
                    }}
                    className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors duration-200 py-2 w-full text-left"
                  >
                    🚪 로그아웃
                  </button>
                </div>
              ) : (
                <Link 
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200 py-2" 
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  🔐 로그인
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

export default Navbar
