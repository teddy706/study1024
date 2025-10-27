import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from './ui/LoadingSpinner'

type Props = {
  children: JSX.Element
}

export const ProtectedRoute: React.FC<Props> = ({ children }) => {
  const { user, loading } = useAuth()

  // 로딩 중일 때 스피너 표시
  if (loading) {
    return <LoadingSpinner fullScreen />
  }

  // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
