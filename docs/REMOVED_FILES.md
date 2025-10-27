# 제거된 파일 목록

이 문서는 프로젝트 정리 과정에서 제거된 파일과 그 이유를 기록합니다.

## src/middleware.ts (제거일: 2025-10-27)

**제거 이유:**
- Next.js 전용 미들웨어 파일로 Vite + React SPA 프로젝트에서는 사용되지 않음
- `@supabase/auth-helpers-nextjs`, `next/server` 등 Next.js 의존성 포함
- 프로젝트는 Vite 기반 SPA로 서버 사이드 미들웨어가 필요 없음

**원래 기능:**
- Supabase 인증 미들웨어
- CORS 헤더 설정
- Rate limiting
- 파일 업로드 크기 제한 (5MB)

**대체 방안:**
- 인증: `src/contexts/AuthContext.tsx`와 `src/components/ProtectedRoute.tsx` 사용
- CORS: Supabase Edge Functions에서 처리
- Rate limiting: Supabase 자체 rate limiting 사용
- 파일 크기 제한: 클라이언트 측에서 검증 또는 Edge Functions에서 처리

## src/utils/supabase.ts (제거일: 2025-10-27)

**제거 이유:**
- `src/config/supabase.ts`와 중복
- 일관성을 위해 `src/config/supabase.ts`를 표준으로 통일

**원래 내용:**
- Supabase 클라이언트 생성
- 수동 타입 정의 (Contact, Report, Call, Action, SmalltalkCache)

**대체 방안:**
- `src/config/supabase.ts`에서 Database 타입이 포함된 클라이언트 사용
- `src/types/supabase.ts`의 자동 생성 타입 사용 (`Database['public']['Tables']['테이블명']['Row']`)

## 인증 페이지 제거 (제거일: 2025-10-27)

**제거된 파일:**
- `src/pages/Login.tsx`
- `src/pages/Register.tsx`

**제거 이유:**
- 데모/개발 목적으로 인증 없이 앱 전체 기능 테스트 필요
- 현재 Supabase 인증이 완전히 설정되지 않은 상태
- 프로토타입 단계에서 인증 장벽 제거

**변경 사항:**
- `src/main.tsx`: `/login`, `/register` 라우트 제거
- `src/components/ProtectedRoute.tsx`: 인증 체크 로직 비활성화
  - 모든 사용자가 모든 페이지 접근 가능
  - 로딩 상태만 처리

**원래 기능:**
- 이메일/비밀번호 로그인
- 회원가입
- 로그인 후 대시보드 리다이렉트
- 이미 로그인된 사용자는 자동 리다이렉트

**대체 방안 (프로덕션 배포 시):**
1. 로그인/회원가입 페이지 재작성
2. ProtectedRoute에서 인증 체크 활성화
3. Supabase Auth 완전 설정
4. RLS 정책 강화

**영향:**
- ⚠️ **보안**: 현재 인증 없이 모든 데이터 접근 가능
- ✅ **개발**: 빠른 테스트 및 프로토타입 개발 가능
- 📝 **TODO**: 프로덕션 배포 전 인증 시스템 재구현 필수
