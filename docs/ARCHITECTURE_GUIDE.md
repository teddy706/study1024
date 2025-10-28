# 아키텍처 정의서 (Architecture Guide)
**업데이트: 2025년 10월 28일**

## 1. 시스템 개요

### 목적
영업사원을 위한 AI 기반 개인 비서 시스템의 기술적 아키텍처 정의

### 현재 구현 상태
- ✅ Phase 1: 명함 관리 시스템 (100% 완료)
- ✅ Phase 2: AI 기반 영업 지원 (100% 완료)
- 🔄 Phase 3: 통화 관리 (준비 중)
- 📋 Phase 4: 일정 관리 (계획 중)

### 범위
- 웹 애플리케이션 아키텍처 ✅
- 데이터베이스 설계 ✅
- AI/ML 서비스 연동 ✅
- 보안 아키텍처 ✅
- 외부 시스템 연동 (일부 구현)

## 2. 시스템 아키텍처 (현재 구현)

### 전체 아키텍처 다이어그램
```
┌──────────────────────────────────────────────────────────┐
│                     Client Layer                         │
│  ┌────────────────┐  ┌────────────────┐                 │
│  │  Web Browser   │  │  Mobile Web    │                 │
│  │  (React 18)    │  │  (Responsive)  │                 │
│  └────────────────┘  └────────────────┘                 │
└─────────────────────┬────────────────────────────────────┘
                      │ HTTPS
                      │
┌─────────────────────▼────────────────────────────────────┐
│               Presentation Layer ✅                       │
│  ┌────────────────────────────────────────────────────┐  │
│  │  React SPA + TypeScript                           │  │
│  │  - TailwindCSS / Shadcn UI                        │  │
│  │  - Vite (Build Tool)                              │  │
│  │  - React Router (Navigation)                      │  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────┬────────────────────────────────────┘
                      │
                      │
┌─────────────────────▼────────────────────────────────────┐
│              Authentication Layer ✅                      │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Supabase Auth                                    │  │
│  │  - JWT Token Management                           │  │
│  │  - Email/Password Auth                            │  │
│  │  - Session Management                             │  │
│  │  - Row Level Security (RLS)                       │  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────┬────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
┌───────▼────────┐ ┌──▼──────────┐ ┌▼────────────────┐
│  Business      │ │  AI/ML      │ │  Storage        │
│  Logic ✅      │ │  Services ✅│ │  Layer ✅       │
├────────────────┤ ├─────────────┤ ├─────────────────┤
│ - Contact CRUD │ │ Vision AI   │ │ PostgreSQL      │
│ - Meeting Logs │ │ (OCR)       │ │ - contacts      │
│ - Organization │ │             │ │ - meetings      │
│   Reports      │ │ OpenAI      │ │ - smalltalk_    │
│ - Smalltalk    │ │ GPT-4o      │ │   cache         │
│   Generation   │ │ - Phone     │ │ - report_org    │
│                │ │   Classify  │ │ - report_       │
│                │ │ - Org Report│ │   prompt_       │
│                │ │ - Smalltalk │ │   settings      │
│                │ │             │ │                 │
│                │ │             │ │ File Storage    │
│                │ │             │ │ - business-     │
│                │ │             │ │   cards bucket  │
└────────────────┘ └─────────────┘ └─────────────────┘
```

### 레이어별 구현 상태

#### 1. Client Layer ✅
- React 18 + TypeScript
- 반응형 웹 디자인 (모바일/태블릿/데스크톱)
- PWA 지원 준비 (향후)

#### 2. Presentation Layer ✅
- **UI 프레임워크**: React 18 + TypeScript
- **스타일링**: TailwindCSS + Shadcn/ui
- **빌드 도구**: Vite
- **라우팅**: React Router v6
- **상태 관리**: React Context API
- **주요 페이지**:
  - `/login` - 로그인
  - `/dashboard` - 대시보드 (연락처 카드 목록)
  - `/contacts` - 연락처 목록
  - `/contacts/:id` - 연락처 상세 (미팅 기록, 스몰토크)
  - `/contacts/add` - 명함 등록
  - `/reports/:id` - 조직 리포트 상세
  - `/reports/settings` - 리포트 프롬프트 설정

#### 3. Authentication Layer ✅
- **Supabase Auth** 기반
- JWT 토큰 자동 관리
- 세션 기반 사용자 상태
- Row Level Security (RLS)로 사용자별 데이터 격리
- `ProtectedRoute` 컴포넌트로 인증 보호

#### 4. Business Logic Layer ✅
- **Services**:
  - `auth.ts` - 인증 관리
  - `meeting.service.ts` - 미팅 기록 CRUD
  - `organizationReport.service.ts` - 조직 리포트 생성/조회
  - `smalltalk.service.ts` - 스몰토크 생성/캐싱
  - `ocr/vision-ai.service.ts` - OCR 처리
  - `ai.service.ts` - OpenAI GPT-4o 통합

#### 5. AI/ML Services Layer ✅
- **Google Vision AI**: 명함 OCR 분석
- **OpenAI GPT-4o**:
  - 전화번호 분류 (휴대폰/사무실/팩스)
  - 기업동향 리포트 생성
  - 스몰토크 소재 생성

#### 6. Storage Layer ✅
- **Supabase PostgreSQL**: 관계형 데이터
- **Supabase Storage**: 명함 이미지 파일
- **Row Level Security**: 사용자별 데이터 보안

## 3. 컴포넌트 상세 (현재 구현)

### Frontend 컴포넌트 ✅

#### Core Components
- **AuthContext** (`src/contexts/AuthContext.tsx`)
  - 전역 인증 상태 관리
  - 자동 세션 복구
  - 사용자 정보 제공

- **ProtectedRoute** (`src/components/ProtectedRoute.tsx`)
  - 인증 필요 라우트 보호
  - 자동 로그인 페이지 리다이렉트

- **ErrorBoundary** (`src/components/ErrorBoundary.tsx`)
  - React 에러 핸들링
  - 사용자 친화적 에러 메시지

#### Page Components
- **Login** (`src/pages/Login.tsx`)
  - 이메일/비밀번호 로그인
  - 회원가입 기능

- **Dashboard** (`src/pages/Dashboard.tsx`)
  - 최근 연락처 카드 표시
  - 미팅 버튼 (원클릭 기록)
  - 연락처 검색

- **ContactDetail** (`src/pages/ContactDetail.tsx`)
  - 연락처 정보 표시/편집
  - 미팅 기록 섹션
  - 스몰토크 소재 표시

- **MeetingSection** (`src/pages/MeetingSection.tsx`)
  - 미팅 기록 목록 (페이지네이션)
  - 메모 입력 모달 (300자 제한)
  - 댓글 스타일 UI

- **AddContact** (`src/pages/AddContact.tsx`)
  - 명함 이미지 업로드 (드래그앤드롭)
  - OCR 분석 결과 표시/편집
  - 관심사 입력

- **ReportDetail** (`src/pages/ReportDetail.tsx`)
  - 조직 리포트 상세 보기
  - Markdown 렌더링

- **ReportSettings** (`src/pages/ReportSettings.tsx`)
  - 사용자별 프롬프트 커스터마이징
  - 기본값 복원 기능

#### UI Components (Shadcn/ui)
- Button, Input, Card, Dialog
- Textarea, Select, Badge
- Alert, Toast 등

### Backend 컴포넌트 ✅

#### Supabase Edge Functions
- **process-business-card** (`supabase/functions/process-business-card/index.ts`)
  - 명함 이미지 OCR 분석
  - Google Vision AI 연동
  - OpenAI GPT-4o 전화번호 분류
  - contacts 테이블 저장
  - 중복 등록 방지 로직

#### Database Services
- **Contact Management**
  - CRUD 작업
  - 검색/필터링
  - 관심사 관리

- **Meeting Management**
  - 미팅 기록 생성
  - 페이지네이션 조회
  - 메모 관리

- **Report Management**
  - 조직 리포트 생성
  - 프롬프트 설정 관리
  - 리포트 조회

- **Smalltalk Management**
  - 스몰토크 생성 (GPT-4o)
  - 24시간 캐싱
  - 만료 시 자동 재생성

### AI/ML 서비스 ✅

#### Google Vision AI
- **OCR 처리**
  - 명함 텍스트 추출
  - TEXT_DETECTION API 사용
  - 한글/영문 지원

#### OpenAI GPT-4o
- **전화번호 분류**
  - 휴대폰/사무실/팩스 자동 분류
  - JSON 구조화 출력

- **조직 리포트 생성**
  - 사용자 커스텀 프롬프트 지원
  - 기업동향 분석
  - Markdown 형식 출력

- **스몰토크 생성**
  - 고객 관심사 기반
  - 3개 대화 소재 제공
  - 자연스러운 대화 주제

### 외부 시스템 연동 (미구현)

#### 계획된 연동
- 🔄 Calendar API (Google Calendar)
- 🔄 VoIP 시스템 (통화 녹음)
- 🔄 STT API (Whisper/Clova)
- 🔄 알림 서비스 (Push Notification)
- 🔄 웹 스크래핑 (뉴스 수집)

## 4. 데이터 아키텍처 (현재 구현)

### 데이터 흐름 ✅

#### 1. 명함 등록 데이터 흐름
```
사용자 → 이미지 업로드 → Supabase Storage (business-cards bucket)
                          ↓
                    Edge Function 트리거
                          ↓
               Google Vision AI OCR 분석
                          ↓
              OpenAI GPT-4o 전화번호 분류
                          ↓
              contacts 테이블에 저장 (RLS 적용)
                          ↓
              명함 이미지 URL 연결
                          ↓
              대시보드에 카드 표시
```

#### 2. 미팅 기록 데이터 흐름
```
사용자 → 미팅 버튼 클릭 → 메모 입력 모달
                          ↓
              meetings 테이블에 저장
                          ↓
              contact_id로 연결 (UUID FK)
                          ↓
              연락처 상세에서 페이지네이션 조회
```

#### 3. 스몰토크 생성 데이터 흐름
```
사용자 → 연락처 상세 접근 → 캐시 확인
                          ↓
                  (캐시 없음 or 만료)
                          ↓
              고객 관심사 + 프롬프트
                          ↓
              OpenAI GPT-4o 생성
                          ↓
              smalltalk_cache에 저장 (24시간)
                          ↓
              연락처 상세에 표시
```

#### 4. 조직 리포트 생성 데이터 흐름
```
사용자 → 조직 이름 입력 → 커스텀 프롬프트 조회
                          ↓
              OpenAI GPT-4o 리포트 생성
                          ↓
              report_organizations에 저장
                          ↓
              Markdown 형식으로 표시
```

### 데이터베이스 구조 ✅

#### 관계형 데이터 (Supabase PostgreSQL)

##### contacts 테이블
```sql
CREATE TABLE contacts (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  company TEXT,
  position TEXT,
  mobile TEXT,              -- AI 분류된 휴대폰 번호
  office_phone TEXT,        -- AI 분류된 사무실 번호
  fax TEXT,                 -- AI 분류된 팩스 번호
  email TEXT,
  interests TEXT,           -- 고객 관심사
  business_card_image_url TEXT,  -- 명함 이미지 Storage URL
  last_met_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 정책: 사용자별 데이터 격리
CREATE POLICY "Users can only access their own contacts"
  ON contacts FOR ALL
  USING (auth.uid() = user_id);
```

##### meetings 테이블
```sql
CREATE TABLE meetings (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  met_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  memo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 정책: contact 소유자만 접근
CREATE POLICY "Users can only access meetings for their contacts"
  ON meetings FOR ALL
  USING (
    contact_id IN (
      SELECT id FROM contacts WHERE user_id = auth.uid()
    )
  );
```

##### smalltalk_cache 테이블
```sql
CREATE TABLE smalltalk_cache (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contact_id BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- 24시간 캐싱 정책
-- expires_at 이후 자동 재생성
```

##### report_organizations 테이블
```sql
CREATE TABLE report_organizations (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  organization_name TEXT NOT NULL,
  report_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 정책: 사용자별 리포트 격리
```

##### report_prompt_settings 테이블
```sql
CREATE TABLE report_prompt_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  custom_prompt TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용자별 커스텀 프롬프트 저장
```

#### 파일 스토리지 (Supabase Storage) ✅

##### business-cards 버킷
```
- 명함 이미지 파일 저장
- 인증된 사용자만 업로드/다운로드 가능
- 파일명: {uuid}_{timestamp}.{ext}
- 지원 형식: jpg, jpeg, png
- 최대 파일 크기: 5MB
```

### 데이터 보안 ✅

#### Row Level Security (RLS)
- 모든 테이블에 RLS 적용
- 사용자별 데이터 완전 격리
- `auth.uid()` 기반 정책

#### 데이터 무결성
- Foreign Key 제약조건
- NOT NULL 제약조건
- CASCADE DELETE 설정

#### 인덱싱
```sql
-- 성능 최적화를 위한 인덱스
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_meetings_contact_id ON meetings(contact_id);
CREATE INDEX idx_smalltalk_contact_id ON smalltalk_cache(contact_id);
CREATE INDEX idx_smalltalk_expires_at ON smalltalk_cache(expires_at);
```

## 5. 통합 아키텍처 (현재 구현)

### Edge Functions API ✅

#### POST /functions/v1/process-business-card
```typescript
// 명함 OCR 분석 및 저장
Headers: {
  Authorization: Bearer {supabase_jwt_token}
}
Body: {
  imageUrl: string,      // Storage에 업로드된 이미지 URL
  contactId?: string     // 선택: 기존 연락처 업데이트 시
}
Response: {
  success: boolean,
  data?: {
    name: string,
    company: string,
    position: string,
    mobile: string,        // AI 분류
    office_phone: string,  // AI 분류
    fax: string,          // AI 분류
    email: string
  },
  error?: string
}
```

### Supabase Client API ✅

#### Authentication
```typescript
// 로그인
supabase.auth.signInWithPassword({ email, password })

// 회원가입
supabase.auth.signUp({ email, password })

// 로그아웃
supabase.auth.signOut()

// 세션 확인
supabase.auth.getSession()
```

#### Database CRUD
```typescript
// contacts 조회
supabase.from('contacts').select('*').eq('user_id', userId)

// meetings 생성
supabase.from('meetings').insert({ contact_id, memo, met_at })

// smalltalk 조회 (캐시 확인)
supabase.from('smalltalk_cache')
  .select('*')
  .eq('contact_id', contactId)
  .gt('expires_at', new Date().toISOString())

// report 생성
supabase.from('report_organizations')
  .insert({ user_id, organization_name, report_content })
```

#### Storage API
```typescript
// 명함 이미지 업로드
supabase.storage
  .from('business-cards')
  .upload(`${userId}/${filename}`, file)

// 이미지 URL 생성
supabase.storage
  .from('business-cards')
  .getPublicUrl(path)
```

### 외부 API 연동 ✅

#### Google Vision AI
```typescript
// OCR 분석
const [result] = await client.textDetection(imageBuffer);
const detections = result.textAnnotations;
const fullText = detections[0]?.description || '';
```

#### OpenAI GPT-4o
```typescript
// 전화번호 분류
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: '전화번호 분류 시스템 프롬프트' },
    { role: 'user', content: `전화번호: ${phones.join(', ')}` }
  ],
  response_format: { type: 'json_object' }
});

// 조직 리포트 생성
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: customPrompt || defaultPrompt },
    { role: 'user', content: `조직: ${organizationName}` }
  ]
});

// 스몰토크 생성
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: '스몰토크 생성 프롬프트' },
    { role: 'user', content: `관심사: ${interests}` }
  ]
});
```

### 계획된 외부 시스템 연동 🔄

#### Calendar API (Phase 4)
```typescript
// Google Calendar API
- 일정 자동 등록
- 일정 조회
- 알림 설정
```

#### VoIP 시스템 (Phase 3)
```typescript
// 통화 시스템 연동
- 통화 녹음
- 통화 메타데이터
- 실시간 스트리밍
```

#### STT API (Phase 3)
```typescript
// Speech-to-Text
- OpenAI Whisper
- Clova Speech
- 실시간 변환
```

## 6. 보안 아키텍처 (현재 구현)

### 인증/인가 ✅

#### Supabase Auth
```typescript
// JWT 기반 인증
- Access Token: 단기 토큰 (1시간)
- Refresh Token: 장기 토큰 (자동 갱신)
- 세션 자동 관리
```

#### Row Level Security (RLS)
```sql
-- contacts 테이블 정책
CREATE POLICY "Users can only access their own contacts"
  ON contacts FOR ALL
  USING (auth.uid() = user_id);

-- meetings 테이블 정책
CREATE POLICY "Users can only access meetings for their contacts"
  ON meetings FOR ALL
  USING (
    contact_id IN (
      SELECT id FROM contacts WHERE user_id = auth.uid()
    )
  );

-- report_organizations 테이블 정책
CREATE POLICY "Users can only access their own reports"
  ON report_organizations FOR ALL
  USING (auth.uid() = user_id);
```

#### ProtectedRoute 컴포넌트
```typescript
// 인증되지 않은 사용자 자동 리다이렉트
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```

### 데이터 보안 ✅

#### 전송 구간 암호화
- HTTPS 강제
- TLS 1.3
- Supabase Cloud 보안 인증서

#### Storage 보안
```typescript
// business-cards 버킷 정책
- 인증된 사용자만 업로드
- 사용자별 폴더 격리 ({userId}/*)
- 파일 타입 검증 (이미지만 허용)
- 파일 크기 제한 (5MB)
```

#### API 키 관리
```bash
# 환경 변수로 관리
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
GOOGLE_VISION_API_KEY=xxx  # Edge Function에서만 사용
OPENAI_API_KEY=xxx          # Edge Function에서만 사용
```

#### Edge Function 보안
```typescript
// JWT 토큰 검증
const authHeader = req.headers.get('Authorization');
const token = authHeader?.replace('Bearer ', '');
const { data: { user }, error } = await supabase.auth.getUser(token);

if (error || !user) {
  return new Response('Unauthorized', { status: 401 });
}
```

### 향후 보안 강화 계획 🔄

#### OAuth2.0 소셜 로그인
```typescript
// Google, GitHub 등 소셜 로그인 지원
- supabase.auth.signInWithOAuth({ provider: 'google' })
- supabase.auth.signInWithOAuth({ provider: 'github' })
```

#### 2단계 인증 (2FA)
```typescript
// TOTP 기반 2FA
- QR 코드 생성
- 인증 코드 검증
- 백업 코드
```

#### 데이터 암호화
```typescript
// 민감 정보 필드 암호화
- 전화번호 암호화 (AES-256)
- 이메일 암호화
- 메모 내용 암호화
```

#### 개인정보 마스킹
```typescript
// UI에서 민감 정보 마스킹
mobile: '010-****-5678'
email: 'j***@company.com'
```

### CORS 설정 ✅
```typescript
// Edge Function CORS 헤더
headers: {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

## 7. 배포 아키텍처 (현재 상태)

### 인프라 구성 ✅

#### Frontend Hosting
```
현재: 로컬 개발 환경 (Vite Dev Server)
계획: Vercel / Netlify 배포

- npm run dev (개발)
- npm run build (프로덕션 빌드)
- npm run preview (프리뷰)
```

#### Backend (Supabase Cloud) ✅
```
- Region: ap-northeast-2 (서울)
- PostgreSQL 15
- Storage (business-cards bucket)
- Auth (JWT 기반)
- Edge Functions (Deno Runtime)
```

#### Edge Functions 배포 🔄
```bash
# 배포 대기 중
supabase/functions/process-business-card/
- index.ts (코드 완성)
- 수동 배포 필요 (Supabase Dashboard)
```

#### Database Migration 🔄
```bash
# 실행 대기 중
sql/09_split_phone_fields.sql
sql/12_create_meetings_table.sql
```

### CI/CD 파이프라인 (미구현)

#### 계획된 워크플로우
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  build-and-deploy:
    - npm run build
    - npm run test
    - Deploy to Vercel
    - Deploy Edge Functions
```

### 확장성 (현재 미적용)

#### 자동 스케일링
- Supabase Cloud 자동 스케일링
- Vercel 자동 스케일링

#### 로드 밸런싱
- Supabase 내장 로드 밸런싱
- CDN (Vercel Edge Network)

#### 캐시 계층
- ✅ Supabase 쿼리 캐싱
- ✅ 스몰토크 24시간 캐싱
- 🔄 Redis 캐시 (향후 계획)

## 8. 모니터링 및 로깅 (현재 상태)

### 시스템 모니터링 ✅

#### Supabase Dashboard
- 데이터베이스 성능 메트릭
- API 요청 통계
- Storage 사용량
- Auth 활동 로그

#### 브라우저 개발자 도구
- 콘솔 로그
- 네트워크 요청 모니터링
- React DevTools

### 에러 추적 (부분 구현)

#### ErrorBoundary ✅
```typescript
// React 에러 캐치
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

#### Try-Catch 블록 ✅
```typescript
// Service 레이어 에러 핸들링
try {
  const result = await supabase.from('contacts').select();
} catch (error) {
  console.error('Error fetching contacts:', error);
  throw error;
}
```

### 로깅 시스템 (미구현)

#### 계획된 로깅
```typescript
// 구조화된 로깅
- 사용자 활동 로그
- API 호출 로그
- 에러 로그
- 성능 메트릭 로그

// 로그 레벨
- ERROR: 시스템 오류
- WARN: 경고 사항
- INFO: 일반 정보
- DEBUG: 디버그 정보
```

#### 향후 통합 계획
- Sentry (에러 추적)
- LogRocket (세션 리플레이)
- Google Analytics (사용자 분석)

### 성능 모니터링 (미구현)

#### 계획된 메트릭
```typescript
// Frontend 성능
- Page Load Time
- Time to Interactive
- First Contentful Paint
- Largest Contentful Paint

// Backend 성능
- API Response Time
- Database Query Time
- Edge Function Execution Time
- Cache Hit Rate

// AI 서비스 성능
- OCR 처리 시간
- GPT-4o 응답 시간
- 토큰 사용량
```

## 9. 재해 복구 및 백업 (현재 상태)

### 백업 전략 ✅

#### Supabase 자동 백업
```
- 일일 자동 백업 (Supabase Cloud)
- Point-in-Time Recovery (PITR) 지원
- 최근 7일 복구 가능
- 수동 백업 가능 (Dashboard)
```

#### Git 버전 관리 ✅
```bash
# 코드 백업
- GitHub Repository
- Commit History
- Branch Protection (main)
```

#### 환경 변수 백업 ✅
```bash
# .env.example 파일 유지
- 환경 변수 템플릿 저장
- 민감 정보 제외
- 설정 가이드 포함
```

### 복구 절차 (문서화 필요)

#### 데이터베이스 복구
```bash
# Supabase Dashboard에서 복구
1. Backups 메뉴 접근
2. 복구 시점 선택
3. 복구 실행
4. 연결 확인
```

#### 애플리케이션 복구
```bash
# Git에서 복구
git checkout main
npm install
npm run build
npm run dev
```

#### Edge Function 복구
```bash
# Supabase Dashboard에서 재배포
1. Functions 메뉴 접근
2. 함수 선택
3. 코드 업로드
4. 배포 실행
```

### 고가용성 (Supabase Cloud 제공) ✅

#### 데이터베이스
- Multi-AZ 배포
- 자동 페일오버
- 읽기 복제본 (Pro 플랜)

#### Storage
- 다중 리전 복제
- 자동 백업
- 99.9% SLA

#### Edge Functions
- 글로벌 배포
- 자동 스케일링
- 장애 조치

### 재해 복구 계획 (문서화 필요)

#### RTO (Recovery Time Objective)
```
목표: 1시간 이내
- 데이터베이스 복구: 30분
- 애플리케이션 재배포: 15분
- 검증 및 테스트: 15분
```

#### RPO (Recovery Point Objective)
```
목표: 24시간 이내
- 일일 자동 백업 활용
- 최대 24시간 데이터 손실 가능
- 중요 트랜잭션은 실시간 복제
```

### 서비스 연속성 (현재 미구비)

#### 계획된 개선사항
- 🔄 다중 리전 배포
- 🔄 실시간 복제
- 🔄 자동 장애 감지
- 🔄 자동 복구 스크립트
- 🔄 재해 복구 훈련

## 10. 기술 부채 및 개선 계획

### 현재 기술 부채 ⚠️

#### 배포 관련
- [ ] SQL 마이그레이션 미실행 (09, 12)
- [ ] Edge Function 미배포 (process-business-card)
- [ ] CI/CD 파이프라인 미구성

#### 테스트 관련
- [ ] 통합 테스트 미실행
- [ ] E2E 테스트 부재
- [ ] 성능 테스트 부재

#### 보안 관련
- [ ] OAuth2.0 미구현
- [ ] 2FA 미구현
- [ ] 데이터 암호화 미구현

#### 모니터링 관련
- [ ] 에러 추적 시스템 부재 (Sentry)
- [ ] 사용자 분석 부재 (GA)
- [ ] 성능 모니터링 부재

### 우선순위별 개선 계획

#### 즉시 실행 (P0)
1. ⚠️ SQL 마이그레이션 실행
2. ⚠️ Edge Function 배포
3. ⚠️ 통합 테스트 실행

#### 단기 (1-2주, P1)
1. CI/CD 파이프라인 구축
2. Sentry 에러 추적 연동
3. Google Analytics 연동
4. 프로덕션 배포 (Vercel)

#### 중기 (1-2개월, P2)
1. Phase 3: 통화 관리 기능
   - STT API 연동
   - 통화 녹음 UI
   - AI 기반 통화 요약
2. OAuth2.0 소셜 로그인
3. 2FA 구현
4. E2E 테스트 작성

#### 장기 (3-6개월, P3)
1. Phase 4: 일정 관리 기능
   - 캘린더 API 연동
   - AI 기반 일정 추출
   - 알림 시스템
2. 모바일 앱 (React Native)
3. 백오피스 시스템
4. 데이터 암호화
5. 다중 리전 배포

### 성능 최적화 계획

#### Frontend
```typescript
- React.lazy() 코드 스플리팅
- 이미지 최적화 (WebP, lazy loading)
- Service Worker (PWA)
- React Query 도입 (캐싱)
```

#### Backend
```typescript
- Database 인덱싱 최적화
- Connection Pooling
- Redis 캐시 레이어
- CDN 도입 (이미지)
```

#### AI/ML
```typescript
- 배치 처리 (여러 요청 통합)
- 응답 스트리밍 (GPT-4o)
- 프롬프트 최적화 (토큰 절약)
- 로컬 모델 검토 (비용 절감)
```

---
**마지막 업데이트**: 2025년 10월 28일  
**현재 진행률**: Phase 1 ✅ / Phase 2 ✅ / Phase 3 🔄 (준비 중)  
**기술 스택**: React 18 + TypeScript + Vite + TailwindCSS + Supabase + Google Vision AI + OpenAI GPT-4o