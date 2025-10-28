# 배포 가이드

이 문서는 Salestailor 애플리케이션의 로컬 개발 환경 설정부터 프로덕션 배포까지의 전체 과정을 안내합니다.

---

## 📋 목차

1. [로컬 개발 환경 설정](#1-로컬-개발-환경-설정)
2. [Supabase 프로젝트 설정](#2-supabase-프로젝트-설정)
3. [Edge Functions 배포](#3-edge-functions-배포)
4. [GitHub Pages 배포](#4-github-pages-배포)
5. [문제 해결](#5-문제-해결)

---

## 1. 로컬 개발 환경 설정

### 1.1 필수 요구사항

- Node.js 18.x 이상
- npm 또는 yarn
- Git
- VS Code (권장)

### 1.2 저장소 클론 및 의존성 설치

```powershell
# 저장소 클론
git clone https://github.com/teddy706/study1024.git
cd study1024

# 의존성 설치
npm install
```

### 1.3 환경 변수 설정

`.env.example` 파일을 복사하여 `.env` 파일을 생성합니다:

```powershell
# Windows
copy .env.example .env

# macOS/Linux
cp .env.example .env
```

`.env` 파일을 열어 실제 값으로 수정합니다:

```env
# Supabase 설정 (필수)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_KEY=your-anon-public-key-here

# Google Calendar API (선택 사항)
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GOOGLE_CLIENT_SECRET=your-google-client-secret
VITE_GOOGLE_REDIRECT_URI=http://localhost:5174/auth/callback
```

> ⚠️ **중요**: `.env` 파일은 절대 Git에 커밋하지 마세요. 이미 `.gitignore`에 포함되어 있습니다.

### 1.4 개발 서버 실행

```powershell
npm run dev
```

브라우저에서 http://localhost:5174/study1024/ 로 접속합니다.

---

## 2. Supabase 프로젝트 설정

### 2.1 Supabase 프로젝트 생성

1. https://supabase.com 에서 로그인
2. "New Project" 클릭
3. 프로젝트 이름, 데이터베이스 비밀번호, 리전 설정
4. 프로젝트 생성 대기 (약 2분)

### 2.2 API 키 확인

프로젝트 대시보드에서:
1. **Settings** → **API** 이동
2. 다음 값을 복사하여 `.env` 파일에 입력:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** 키 → `VITE_SUPABASE_KEY`

### 2.3 데이터베이스 스키마 생성

Supabase SQL Editor에서 다음 순서로 SQL 파일을 실행합니다:

1. `sql/supabase_functions.sql` - 테이블 생성
2. `sql/daily_smalltalk_rpc.sql` - RPC 함수 생성
3. `sql/schedule_daily_smalltalk.sql` - 스케줄링 설정
4. `sql/insert_test_data.sql` (선택 사항) - 테스트 데이터

### 2.4 RLS (Row Level Security) 정책 설정

Supabase 대시보드에서 각 테이블에 대해 RLS를 활성화하고 정책을 추가합니다.

예시 (contacts 테이블):
```sql
-- 사용자는 자신의 연락처만 조회 가능
CREATE POLICY "Users can view own contacts"
ON contacts FOR SELECT
USING (auth.uid() = user_id);

-- 사용자는 자신의 연락처만 삽입 가능
CREATE POLICY "Users can insert own contacts"
ON contacts FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

---

## 3. Edge Functions 배포

Edge Functions는 OpenAI API와 같은 민감한 작업을 서버 측에서 처리합니다.

### 3.1 Supabase CLI 설치

**Windows (PowerShell):**
```powershell
scoop install supabase
```

**macOS:**
```bash
brew install supabase/tap/supabase
```

**Linux:**
```bash
curl -fsSL https://raw.githubusercontent.com/supabase/cli/main/scripts/install.sh | sh
```

### 3.2 로그인 및 프로젝트 연결

```powershell
supabase login
supabase link --project-ref your-project-id
```

### 3.3 Secrets 설정

Edge Functions에서 사용할 API 키를 Secrets에 등록합니다:

```powershell
supabase secrets set OPENAI_API_KEY=your-openai-api-key
```

또는 Supabase 대시보드에서:
1. **Project Settings** → **Edge Functions** → **Secrets**
2. `OPENAI_API_KEY` 추가

### 3.4 Functions 배포

```powershell
# 모든 함수 배포
supabase functions deploy

# 특정 함수만 배포
supabase functions deploy generate-smalltalk
supabase functions deploy process-call
supabase functions deploy send-slack
supabase functions deploy analyze-news
supabase functions deploy extract-date
```

### 3.5 배포 확인

```powershell
supabase functions list
```

또는 Supabase 대시보드 → **Edge Functions**에서 함수 목록과 로그를 확인할 수 있습니다.

자세한 내용은 [FUNCTIONS_DEPLOYMENT.md](./FUNCTIONS_DEPLOYMENT.md) 참조.

---

## 4. GitHub Pages 배포

### 4.1 GitHub Secrets 설정

GitHub 리포지토리에서 환경 변수를 설정합니다:

1. GitHub 리포지토리 페이지로 이동
2. **Settings** → **Secrets and variables** → **Actions**
3. **New repository secret** 버튼으로 다음 시크릿 추가:

```
VITE_SUPABASE_URL = https://your-project-id.supabase.co
VITE_SUPABASE_KEY = your-anon-public-key-here
```

> 📝 **참고**: 
> - `VITE_OPENAI_API_KEY` 등은 Edge Functions로 이전되어 더 이상 필요하지 않습니다
> - Supabase anon key는 공개되어도 RLS로 보호되므로 안전합니다

### 4.2 GitHub Pages 활성화

1. 리포지토리 **Settings** → **Pages** 이동
2. **Source**를 **GitHub Actions**로 선택
3. 저장

### 4.3 빌드 및 배포

```powershell
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main
```

푸시하면 자동으로:
- GitHub Actions가 빌드 실행
- Vite가 프로덕션 빌드 생성
- GitHub Pages에 배포

### 4.4 배포 확인

1. **Actions** 탭에서 워크플로우 진행 상황 확인
2. 완료되면 https://teddy706.github.io/study1024/ 에서 접속

---

## 5. 문제 해결

### 5.1 로컬 개발 환경

**문제: `npm run dev` 실행 시 Supabase 연결 오류**

```
Error: Invalid Supabase URL
```

해결방법:
- `.env` 파일이 프로젝트 루트에 있는지 확인
- `VITE_SUPABASE_URL`과 `VITE_SUPABASE_KEY`가 올바른지 확인
- 개발 서버 재시작 (`Ctrl+C` 후 `npm run dev`)

**문제: TypeScript 에러**

```
Module not found: '@supabase/supabase-js'
```

해결방법:
```powershell
npm install
```

### 5.2 Edge Functions

**문제: Functions 배포 실패**

```
Error: Failed to deploy function
```

해결방법:
- Supabase CLI 로그인 상태 확인: `supabase status`
- 프로젝트 연결 확인: `supabase link --project-ref your-project-id`
- Secrets 설정 확인: Supabase 대시보드 → Edge Functions → Secrets

**문제: Function 호출 시 500 에러**

해결방법:
- Supabase 대시보드 → Edge Functions → 함수 선택 → Logs 탭에서 에러 확인
- `OPENAI_API_KEY` Secret이 올바르게 설정되었는지 확인

### 5.3 GitHub Pages 배포

**문제: 빌드 실패**

해결방법:
- GitHub Actions 탭에서 로그 확인
- Secrets가 올바르게 설정되었는지 확인 (Settings → Secrets and variables → Actions)
- 로컬에서 빌드 테스트: `npm run build`

**문제: 페이지가 404 에러**

해결방법:
- Settings → Pages에서 Source가 "GitHub Actions"인지 확인
- `vite.config.ts`의 `base` 경로가 `/study1024/`인지 확인
- 워크플로우가 성공적으로 완료되었는지 Actions 탭에서 확인

**문제: 라우팅 문제 (새로고침 시 404)**

GitHub Pages는 기본적으로 SPA 라우팅을 지원하지 않습니다.

현재 설정된 해결방법:
- React Router의 `BrowserRouter`에 `basename="/study1024"` 설정됨
- 직접 URL 접근 시 404 발생 가능

대안:
1. Hash Router 사용 (`HashRouter` 사용)
2. 404.html 페이지를 index.html로 리다이렉트

### 5.4 인증 문제

**문제: 로그인 후 바로 로그아웃됨**

해결방법:
- 브라우저 쿠키/로컬스토리지 확인
- Supabase Auth 설정 확인: 대시보드 → Authentication → Settings
- Site URL과 Redirect URLs 설정 확인

---

## 📚 추가 문서

- [FUNCTIONS_DEPLOYMENT.md](./FUNCTIONS_DEPLOYMENT.md) - Edge Functions 상세 배포 가이드
- [FUNCTIONS_MANUAL_DEPLOYMENT.md](./FUNCTIONS_MANUAL_DEPLOYMENT.md) - 수동 배포 방법
- [PROJECT_BRIEF.md](./PROJECT_BRIEF.md) - 프로젝트 개요
- [PRD_v2.1.md](./PRD_v2.1.md) - 제품 요구사항 문서

---

## 🔐 보안 주의사항

1. **환경 변수 관리**
   - `.env` 파일은 절대 Git에 커밋하지 마세요
   - GitHub Secrets에 민감한 정보 저장
   - anon key는 공개 가능 (RLS로 보호됨)

2. **API 키 보호**
   - OpenAI API 키는 Edge Functions에서만 사용
   - 클라이언트 코드에 민감한 키 노출 금지
   - Secrets 주기적으로 교체

3. **RLS 정책**
   - 모든 테이블에 RLS 활성화
   - 사용자별 데이터 격리 정책 설정
   - 정기적인 보안 감사

---

## 🆘 도움이 필요하신가요?

- 이슈 제기: [GitHub Issues](https://github.com/teddy706/study1024/issues)
- Supabase 문서: https://supabase.com/docs
- Vite 문서: https://vitejs.dev/
