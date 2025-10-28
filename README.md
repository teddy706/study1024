# Salestailor 📊

영업 활동을 효율적으로 관리하는 스마트 세일즈 어시스턴트 애플리케이션입니다.

## ✨ 주요 기능

- **고객 관리**: 연락처 정보, 통화 이력, 리포트 통합 관리
- **스마트 스몰톡**: AI 기반 대화 주제 추천 (뉴스, 날씨, 관심사)
- **통화 녹음 & 분석**: VoIP 통화 녹음 및 AI 요약
- **일정 관리**: Google Calendar 연동 및 자동 일정 생성
- **실시간 알림**: 리포트, 일정, 뉴스 알림

## 🚀 빠른 시작

### 필수 요구사항

- Node.js 18.x 이상
- Supabase 계정
- (선택) OpenAI API 키

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/teddy706/study1024.git
cd study1024

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 Supabase URL과 키를 입력하세요

# 개발 서버 실행
npm run dev
```

브라우저에서 <http://localhost:5174/study1024/> 로 접속합니다.

## 📚 문서

- [배포 가이드](./docs/DEPLOYMENT.md) - 로컬/프로덕션 배포 전체 가이드
- [Edge Functions 배포](./docs/FUNCTIONS_DEPLOYMENT.md) - Supabase Functions 배포 방법
- [프로젝트 개요](./docs/PROJECT_BRIEF.md) - 프로젝트 소개
- [제품 요구사항](./docs/PRD_v2.1.md) - 상세 기능 명세

## 🏗️ 기술 스택

### Frontend

- **React 18** - UI 라이브러리
- **TypeScript** - 타입 안전성
- **Vite** - 빌드 도구
- **Tailwind CSS** - 스타일링
- **React Router** - 라우팅

### Backend

- **Supabase** - Backend as a Service
  - Authentication
  - PostgreSQL Database
  - Edge Functions
  - Real-time subscriptions
  - Row Level Security

### AI/ML

- **OpenAI GPT** - 스몰톡 생성, 통화 요약
- **Whisper API** - 음성-텍스트 변환

### Integrations

- **Google Calendar API** - 일정 관리
- **Slack Webhooks** - 알림 전송

## 📁 프로젝트 구조

```
study1024/
├── src/
│   ├── components/       # React 컴포넌트
│   │   ├── dashboard/    # 대시보드 관련
│   │   ├── contact/      # 연락처 관련
│   │   └── ui/           # 공통 UI 컴포넌트
│   ├── pages/            # 페이지 컴포넌트
│   ├── services/         # API 서비스
│   ├── contexts/         # React Context
│   ├── hooks/            # Custom Hooks
│   ├── types/            # TypeScript 타입 정의
│   └── config/           # 설정 파일
├── supabase/
│   └── functions/        # Edge Functions
│       ├── generate-smalltalk/
│       ├── process-call/
│       ├── send-slack/
│       ├── analyze-news/
│       └── extract-date/
├── sql/                  # 데이터베이스 스크립트
├── docs/                 # 문서
└── scripts/              # 유틸리티 스크립트
```

## 🔐 보안

- **Row Level Security (RLS)**: 모든 데이터베이스 테이블에 RLS 정책 적용
- **Edge Functions**: 민감한 API 키는 서버 측에서만 사용
- **환경 변수**: `.env` 파일로 시크릿 관리 (Git 미포함)

## 🧪 테스트

```bash
# 단위 테스트 실행
npm test

# 테스트 커버리지
npm run test:coverage
```

## 🚢 배포

### GitHub Pages

```bash
# 자동 배포 (GitHub Actions)
git push origin main
```

자세한 내용은 [배포 가이드](./docs/DEPLOYMENT.md)를 참조하세요.

## 🤝 기여

이슈와 PR을 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

This project is licensed under the MIT License.

## 👤 작성자

**teddy706**

- GitHub: [@teddy706](https://github.com/teddy706)

## 🙏 감사의 말

- [Supabase](https://supabase.com) - Backend 인프라
- [OpenAI](https://openai.com) - AI 기능
- [Tailwind CSS](https://tailwindcss.com) - UI 스타일링
