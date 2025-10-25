import { createMiddleware } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import rateLimit from 'express-rate-limit'

// Rate limiting 설정
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100 // IP당 최대 요청 수
})

// CORS 설정
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.VITE_ALLOWED_ORIGINS || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}

// 파일 크기 제한 (5MB)
const MAX_FILE_SIZE = parseInt(process.env.VITE_MAX_FILE_SIZE || '5242880', 10)

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // CORS 헤더 추가
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Supabase 인증 미들웨어
  const { supabase, response: authResponse } = createMiddleware(
    request,
    response
  )

  // 인증 실패 시
  if (!authResponse) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Rate limiting 체크
  if (limiter.tryRem(request.ip)) {
    return new NextResponse('Too Many Requests', { status: 429 })
  }

  // 파일 업로드 시 크기 체크
  if (request.method === 'POST' && request.headers.get('content-type')?.includes('multipart/form-data')) {
    const contentLength = parseInt(request.headers.get('content-length') || '0', 10)
    if (contentLength > MAX_FILE_SIZE) {
      return new NextResponse('File Too Large', { status: 413 })
    }
  }

  return authResponse
}

export const config = {
  matcher: ['/api/:path*']
}