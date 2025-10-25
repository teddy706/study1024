import React from 'react'

export const Navbar: React.FC = () => {
  return (
    <header className="bg-white border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Sales Assistant</h1>
        <nav>
          <a className="mr-4 text-sm text-gray-700" href="/">대시보드</a>
          <a className="mr-4 text-sm text-gray-700" href="/login">로그인</a>
        </nav>
      </div>
    </header>
  )
}

export default Navbar
