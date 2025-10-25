# PRD v2.1 — 영업사원의 개인 비서

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

## 2. 주요 기능 요약 (Feature Summary)

| 코드 | 기능명 | 설명 |
|------|--------|------|
| F1 | 명함 OCR 등록 | 명함 이미지 업로드 후 고객DB 자동 생성 |
| F2 | 뉴스/입찰/스몰토크 리포팅 | 고객사·업종·지역 관련 뉴스 자동 제공 |
| F3 | 통화 STT 요약 | 통화 녹음 업로드 후 요약 저장 |
| F4 | 일정 자동 등록 | 대화 속 일정·데드라인 자동 반영 |
| F5 | 통합 대시보드 | 고객별 정보, 리포트, 일정 조회 |
| F6 | 알림 시스템 | 새 리포트·일정·뉴스 발생 시 알림 |
| F7 | 고객카드 전화 연결 링크 | 고객카드에서 직접 전화 연결(`tel:`) 기능 |

## 3. 기술 스택 (Tech Stack)

### Frontend
- Retool: 관리자 대시보드 및 주요 UI
- React: 사용자 인터페이스
- TailwindCSS: 스타일링

### Backend & 데이터
- Supabase: 주 데이터베이스 및 인증
- n8n: 워크플로우 자동화
- Render: 서버리스 호스팅

### AI/ML 서비스
- Google Vision AI: 명함 OCR
- OpenAI Whisper: 음성-텍스트 변환
- GPT-4-mini: 텍스트 요약 및 분석
- Apify: 웹 스크래핑

### 통합
- Google Calendar API: 일정 관리
- VoIP/tel 링크: 전화 연결
- Slack/Email: 알림 발송

## 4. 시스템 아키텍처 (Architecture)

```
┌──────────┐     ┌───────────┐     ┌─────────────┐
│          │     │           │     │ AI Services  │
│  Retool  │────>│    n8n    │────>│ - Vision AI │
│   UI     │     │ Workflows │     │ - Whisper   │
│          │     │           │     │ - GPT-4-mini│
└──────────┘     └───────────┘     └─────────────┘
      │               │                    │
      │               │                    │
      ▼               ▼                    ▼
┌─────────────────────────────────────────────┐
│              Supabase Database              │
└─────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│            Optional VoIP Gateway            │
└─────────────────────────────────────────────┘
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
  phone_link VARCHAR(100),
  email VARCHAR(200),
  address TEXT,
  created_at TIMESTAMP,
  last_contact TIMESTAMP
);
```

### Reports (리포트)
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id),
  type VARCHAR(50),
  content TEXT,
  created_at TIMESTAMP
);
```

### Calls (통화 기록)
```sql
CREATE TABLE calls (
  id UUID PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id),
  recording_url TEXT,
  summary TEXT,
  duration INTEGER,
  called_at TIMESTAMP
);
```

### Actions (일정/할일)
```sql
CREATE TABLE actions (
  id UUID PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id),
  type VARCHAR(50),
  description TEXT,
  due_date TIMESTAMP,
  status VARCHAR(20)
);
```

### SmalltalkCache (스몰토크 소재)
```sql
CREATE TABLE smalltalk_cache (
  id UUID PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id),
  topic VARCHAR(100),
  content TEXT,
  expires_at TIMESTAMP
);
```

## 6. 기능 상세 (Feature Details)

### F1: 명함 OCR 등록
- 입력: 명함 이미지 (JPG/PNG)
- 처리: 
  1. Google Vision AI OCR 처리
  2. 필드별 데이터 추출
  3. 고객 DB 레코드 생성
- 출력: 고객 정보 카드

### F2: 뉴스/입찰/스몰토크 리포팅
- 입력: 고객사 정보
- 처리:
  1. 뉴스/입찰정보 수집 (Apify)
  2. GPT 기반 관련성 분석
  3. 요약 생성
- 출력: 일일 리포트

### F3: 통화 STT 요약
- 입력: 통화 녹음 파일
- 처리:
  1. Whisper STT 변환
  2. GPT 기반 주요 내용 요약
  3. 액션 아이템 추출
- 출력: 통화 요약문

### F4: 일정 자동 등록
- 입력: 통화 요약/메시지
- 처리:
  1. 일정 관련 내용 추출
  2. Calendar API 연동
  3. 알림 설정
- 출력: 캘린더 이벤트

### F5: 통합 대시보드
- 표시 정보:
  - 고객별 최근 상호작용
  - 예정된 일정
  - 새로운 리포트
  - 주요 액션 아이템
- 필터링/검색 기능

### F6: 알림 시스템
- 트리거:
  - 새로운 리포트 생성
  - 임박한 일정
  - 중요 뉴스 발생
- 전달 채널: 이메일, 슬랙, 앱 내 알림

### F7: 고객카드 전화 연결 링크
- 기능:
  - 원클릭 전화 연결
  - 통화 녹음 자동 시작
  - 통화 후 요약 프로세스 연동

## 7. 사용자 시나리오 (User Scenarios)

### 시나리오 1: 신규 고객 등록
1. 명함 스캔/촬영
2. OCR 처리 및 정보 확인
3. 고객 프로필 자동 생성
4. 관련 뉴스/정보 첫 리포트 수신

### 시나리오 2: 일상적 고객 관리
1. 아침: 일일 리포트 확인
2. 고객 연락 시 원클릭 전화
3. 통화 내용 자동 요약
4. 후속 일정 자동 등록

## 8. 개발 단계 (Development Phases)

### Week 1: 기초 설정
- Supabase DB 구축
- OCR 및 STT 파이프라인 구성
- 기본 UI 프레임워크 설정

### Week 2: 핵심 기능 개발
- OCR/STT 기능 구현
- 리포팅 시스템 개발
- 알림 시스템 구축

### Week 3: 통합 및 테스트
- UI/UX 완성
- 시스템 통합
- 사용성 테스트
- 버그 수정

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

### 효율성 지표
- 수작업 시간 절감률
- 자동화된 작업 비율
- 일일 활성 사용자 수

### 품질 지표
- OCR 정확도
- STT 변환 정확도
- 리포트 관련성 점수

### 사용자 만족도
- 사용자 피드백 점수
- 기능별 사용 빈도
- NPS (순추천지수)

## 11. 향후 확장 (Future Expansion)

### 단기 확장 계획
- 주요 CRM 시스템 연동
- 음성 명령 기능 추가
- 모바일 앱 개발

### 중장기 확장 계획
- AI 통화 분석 고도화
- 예측 분석 기능 추가
- 다국어 지원

### 기술 로드맵
- GPT-4 전면 도입
- 실시간 음성 처리
- 블록체인 기반 데이터 보안