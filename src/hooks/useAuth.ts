import { useContext } from 'react'
import { useAuthContext } from '../contexts/AuthContext'

export function useAuth() {
  return useAuthContext()
}

export default useAuth
