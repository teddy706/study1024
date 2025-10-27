import React from 'react'
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

  // 인증 체크 제거 - 모든 사용자 접근 허용
  // TODO: 프로덕션에서는 실제 인증 로직 구현 필요
  return children
}

export default ProtectedRoute
