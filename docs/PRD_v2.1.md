# PRD v2.2 — 영업사원의 개인 비서 (업데이트: 2025-10-28)

## 1. 개요 (Overview)

### 목적
영업사원들의 일상적인 업무 흐름을 자동화하여 생산성을 향상시키는 AI 기반 개인 비서 웹 애플리케이션입니다.

### 대상 사용자
- 기업 영업사원
- 공공기관 영업 담당자
- 프리랜서 세일즈 전문가

### 가치 제안
- 수작업 데이터 입력 시간 90% 감소
- 고객 정보 및 상호작용 자동 기록
- 맞춤형 정보 제공으로 영업 기회 발굴
- 업무 자동화를 통한 효율성 증대
- AI 기반 조직 동향 분석 및 리포팅

## 2. 주요 기능 요약 (Feature Summary)

| 코드 | 기능명 | 상태 | 설명 |
|------|--------|------|------|
| F1 | 명함 OCR 등록 | ✅ 구현 완료 | 명함 이미지 업로드 후 고객DB 자동 생성, 전화번호 자동 분류 |
| F2 | AI 조직 동향 리포트 | ✅ 구현 완료 | OpenAI GPT-4o 기반 조직별 동향 분석 및 리포트 생성 |
| F3 | 스몰토크 소재 생성 | ✅ 구현 완료 | 고객 관심사 기반 AI 대화 소재 자동 생성 |
| F4 | 미팅 기록 관리 | ✅ 구현 완료 | 미팅 날짜 및 메모 기록, 페이지네이션 지원 |
| F5 | 통합 대시보드 | ✅ 구현 완료 | 고객 목록, 리포트, 연락처 관리 통합 뷰 |
| F6 | 연락처 관리 | ✅ 구현 완료 | 연락처 편집, 관심사 관리, 명함 이미지 저장 |
| F7 | 전화번호 자동 분류 | ✅ 구현 완료 | 휴대폰/사무실/팩스 자동 분류 및 관리 |
| F8 | 리포트 커스터마이징 | ✅ 구현 완료 | 사용자별 AI 프롬프트 설정 및 조직 관리 |

## 3. 기술 스택 (Tech Stack)

### Frontend
- **React 18**: 사용자 인터페이스
- **TypeScript**: 타입 안정성
- **Vite**: 빌드 도구
- **TailwindCSS**: 스타일링
- **React Router**: 라우팅

### Backend & 데이터
- **Supabase**: 
  - PostgreSQL 데이터베이스
  - 인증 (Auth)
  - Edge Functions
  - Storage (명함 이미지)
  - Row Level Security (RLS)

### AI/ML 서비스
- **Google Vision AI**: 명함 OCR (Edge Function)
- **OpenAI GPT-4o**: 
  - 조직 동향 분석
  - 스몰토크 소재 생성
  - 전화번호 자동 분류

### 배포
- **Vercel/Netlify**: 프론트엔드 호스팅
- **Supabase Cloud**: 백엔드 및 DB

## 4. 시스템 아키텍처 (Architecture)

```
┌──────────────────┐     ┌─────────────────┐
│                  │     │                 │
│  React Frontend  │────>│    Supabase     │
│   (Vite + TS)    │     │   - Database    │
│                  │     │   - Auth        │
└──────────────────┘     │   - Storage     │
                         │   - Edge Funcs  │
                         └─────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │    AI Services        │
                    │  - Google Vision AI   │
                    │  - OpenAI GPT-4o      │
                    └───────────────────────┘
```

## 5. 데이터 스키마 요약 (Data Schema)

### Contacts (고객 정보)

```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY,
  name VARCHAR(100),
  company VARCHAR(200),
  position VARCHAR(100),
  phone VARCHAR(20),
  mobile VARCHAR(20),           -- 휴대폰
  office_phone VARCHAR(20),     -- 사무실 전화
  fax VARCHAR(20),              -- 팩스
  phone_link VARCHAR(100),
  email VARCHAR(200),
  address TEXT,
  interests TEXT,               -- 관심사
  business_card_image_url TEXT, -- 명함 이미지
  created_at TIMESTAMP,
  last_contact TIMESTAMP,
  user_id UUID REFERENCES auth.users(id)
);
```

### Reports (리포트)

```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) NULL,
  type VARCHAR(50),
  content TEXT,
  created_at TIMESTAMP,
  user_id UUID REFERENCES auth.users(id)
);
```

### Meetings (미팅 기록)

```sql
CREATE TABLE meetings (
  id BIGINT PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id),
  met_at TIMESTAMP,
  memo TEXT,
  created_at TIMESTAMP
);
```

### SmalltalkCache (스몰토크 소재)

```sql
CREATE TABLE smalltalk_cache (
  id UUID PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id),
  topic VARCHAR(100),
  content TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP,
  user_id UUID REFERENCES auth.users(id),
  meta JSONB
);
```

### ReportOrganizations (관심 조직)

```sql
CREATE TABLE report_organizations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT,
  type TEXT CHECK (type IN ('company', 'government', 'university')),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### ReportPromptSettings (리포트 프롬프트 설정)

```sql
CREATE TABLE report_prompt_settings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  prompt_template TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## 6. 기능 상세 (Feature Details)

### F1: 명함 OCR 등록 ✅
- **입력**: 명함 이미지 (JPG/PNG)
- **처리**: 
  1. Supabase Storage에 이미지 업로드
  2. Edge Function에서 Google Vision AI OCR 처리
  3. AI 기반 전화번호 자동 분류 (휴대폰/사무실/팩스)
  4. 필드별 데이터 추출
  5. 고객 DB 레코드 생성
- **출력**: 고객 정보 카드 (명함 이미지 포함)
- **상태**: 구현 완료

### F2: AI 조직 동향 리포트 ✅
- **입력**: 
  - 사용자가 등록한 관심 조직 목록
  - 연락처에 등록된 회사 정보
- **처리**:
  1. OpenAI GPT-4o 기반 조직 동향 분석
  2. 사용자 커스터마이징 가능한 프롬프트 템플릿
  3. 조직별 구분된 리포트 생성
- **출력**: Markdown 형식의 동향 리포트
- **상태**: 구현 완료

### F3: 스몰토크 소재 생성 ✅
- **입력**: 
  - 고객 정보 (이름, 회사, 직책)
  - 고객 관심사
- **처리**:
  1. OpenAI GPT-4o 기반 대화 소재 생성
  2. 고객별 맞춤형 스몰토크 주제 추천
  3. 만료 시간 설정 (캐싱)
  4. AI/Template 출처 뱃지 표시
- **출력**: 고객별 스몰토크 소재 리스트
- **상태**: 구현 완료

### F4: 미팅 기록 관리 ✅
- **입력**: 
  - 미팅 날짜 (자동 기록)
  - 메모 (선택사항, 최대 300자)
- **처리**:
  1. 미팅 버튼 클릭 시 메모 입력 모달
  2. meetings 테이블에 기록 저장
  3. 최근 미팅 날짜 자동 업데이트
- **출력**: 
  - 댓글 스타일 미팅 이력 (최신순)
  - 페이지네이션 (3개씩 표시)
- **상태**: 구현 완료

### F5: 통합 대시보드 ✅
- **표시 정보**:
  - 전체 연락처 목록
  - 최신 생성된 리포트
  - 연락처별 최근 상호작용
  - 스몰토크 소재
- **기능**:
  - 검색 및 필터링
  - 정렬 (이름/회사/최근 연락일)
  - 연락처 상세 페이지 이동
- **상태**: 구현 완료

### F6: 연락처 관리 ✅
- **기능**:
  - 연락처 추가 (명함 OCR 또는 수동 입력)
  - 연락처 편집 (전체 필드 수정 가능)
  - 관심사 별도 관리
  - 명함 이미지 보기
  - 연락처 삭제 (이미지 포함)
- **필드**:
  - 기본 정보: 이름, 회사, 직책
  - 연락처: 휴대폰, 사무실 전화, 팩스
  - 이메일, 주소
  - 관심사 (자유 텍스트)
- **상태**: 구현 완료

### F7: 전화번호 자동 분류 ✅
- **입력**: 명함 이미지의 전화번호 정보
- **처리**:
  1. OpenAI GPT-4o 기반 전화번호 유형 분석
  2. 한국 전화번호 패턴 인식
  3. 자동 분류: 휴대폰(010)/사무실(02, 031 등)/팩스
- **출력**: 분류된 전화번호 필드
- **상태**: 구현 완료

### F8: 리포트 커스터마이징 ✅
- **기능**:
  - 관심 조직 등록/관리 (기업/관공서/대학)
  - AI 프롬프트 템플릿 커스터마이징
  - 사용자별 프롬프트 설정 저장
- **출력**: 사용자 맞춤형 리포트
- **상태**: 구현 완료

## 7. 사용자 시나리오 (User Scenarios)

### 시나리오 1: 신규 고객 등록
1. 명함 스캔/촬영 및 업로드
2. Edge Function에서 OCR 처리
3. AI 기반 전화번호 자동 분류
4. 고객 정보 확인 및 수정
5. 관심사 입력
6. 고객 프로필 자동 생성
7. 스몰토크 소재 생성

### 시나리오 2: 일상적 고객 관리
1. 대시보드에서 고객 목록 확인
2. 고객 상세 페이지 접속
3. 스몰토크 소재 확인
4. 미팅 버튼으로 만남 기록
5. 메모 작성 (선택)
6. 미팅 이력 누적 관리

### 시나리오 3: 조직 동향 파악
1. 리포트 설정에서 관심 조직 등록
2. AI 프롬프트 커스터마이징 (선택)
3. 대시보드에서 "최신 리포트 생성" 클릭
4. GPT-4o 기반 조직 동향 리포트 확인
5. 영업 전략 수립에 활용

### 시나리오 4: 연락처 정보 업데이트
1. 연락처 상세 페이지에서 "편집" 클릭
2. 전화번호, 이메일, 주소 등 정보 수정
3. 관심사 업데이트
4. 저장 후 스몰토크 재생성 가능

## 8. 개발 현황 (Development Status)

### ✅ 완료된 기능 (2025-10-28 기준)

#### 핵심 기능
- [x] 명함 OCR 및 자동 등록
- [x] AI 기반 전화번호 자동 분류
- [x] 연락처 CRUD (생성/조회/수정/삭제)
- [x] 관심사 관리
- [x] 명함 이미지 저장 및 조회

#### AI 기능
- [x] OpenAI GPT-4o 통합
- [x] 조직 동향 리포트 생성
- [x] 스몰토크 소재 자동 생성
- [x] 사용자별 프롬프트 커스터마이징

#### UI/UX
- [x] 통합 대시보드
- [x] 연락처 상세 페이지
- [x] 연락처 편집 모드
- [x] 미팅 기록 기능 (메모, 페이지네이션)
- [x] 리포트 설정 페이지

#### 인프라
- [x] Supabase 인증 (Auth)
- [x] Row Level Security (RLS)
- [x] Edge Functions (명함 OCR)
- [x] Storage (명함 이미지)

### 🔄 진행 중
- [ ] Edge Function 배포 (명함 OCR)
- [ ] 통합 테스트

### 📋 향후 계획
- [ ] 모바일 반응형 최적화
- [ ] 다크 모드 지원
- [ ] 알림 시스템
- [ ] 통화 STT 기능
- [ ] 일정 자동 등록

## 9. 리스크 및 대응 (Risks & Mitigation)

### 기술적 리스크
- API 할당량 초과
  - 대응: 캐싱 시스템 구축
- 인증/보안 이슈
  - 대응: JWT 토큰 기반 인증 구현
- 데이터 프라이버시
  - 대응: 엔드-투-엔드 암호화 적용

### 운영 리스크
- 시스템 과부하
  - 대응: 자동 스케일링 설정
- 데이터 정확도
  - 대응: 사용자 확인 단계 추가

## 10. KPI

### 구현 완료된 핵심 지표
- ✅ 명함 OCR 정확도: Google Vision AI 기반
- ✅ AI 응답 품질: OpenAI GPT-4o 기반
- ✅ 전화번호 자동 분류 정확도
- ✅ 사용자별 데이터 격리 (RLS)

### 측정 예정 지표
- 수작업 시간 절감률
- 일일 활성 사용자 수
- 리포트 생성 빈도
- 스몰토크 활용률
- 미팅 기록 활용률

## 11. 향후 확장 (Future Expansion)

### 단기 확장 계획 (1-3개월)
- [ ] 모바일 앱 개발
- [ ] 알림 시스템 (이메일/Slack/푸시)
- [ ] 통화 STT 기능
- [ ] Google Calendar 연동
- [ ] 다국어 지원 (영어)

### 중장기 확장 계획 (3-6개월)
- [ ] 주요 CRM 시스템 연동 (Salesforce, HubSpot)
- [ ] AI 통화 분석 고도화
- [ ] 예측 분석 기능 (영업 기회 발굴)
- [ ] 음성 명령 기능
- [ ] 팀 협업 기능

### 기술 로드맵
- GPT-4o Vision 활용 확대
- 실시간 AI 분석 강화
- Edge Computing 최적화
- 오프라인 모드 지원