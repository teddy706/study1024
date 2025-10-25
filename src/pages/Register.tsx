import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export const Register: React.FC = () => {
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const { error } = await signUp(email, password)
      if (error) {
        setError(error.message)
        return
      }
      // 보통은 이메일 확인 후 리디렉트하지만 간단히 대시보드로 이동
      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4">회원가입</h2>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <label className="block mb-2">
          <span className="text-sm">이메일</span>
          <input className="w-full border p-2 rounded" value={email} onChange={e => setEmail(e.target.value)} />
        </label>
        <label className="block mb-4">
          <span className="text-sm">비밀번호</span>
          <input type="password" className="w-full border p-2 rounded" value={password} onChange={e => setPassword(e.target.value)} />
        </label>
        <button className="w-full bg-green-600 text-white p-2 rounded" type="submit">회원가입</button>
        <p className="mt-4 text-center">
          이미 계정이 있으신가요? <Link to="/login" className="text-blue-600">로그인</Link>
        </p>
      </form>
    </div>
  )
}

export default Register
