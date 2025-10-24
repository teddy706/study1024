# Study1024 - AI-Powered Document Processing Platform

## 개요

Study1024는 OCR, STT(Speech-to-Text), 그리고 AI 기반 요약 기능을 제공하는 통합 문서 처리 플랫폼입니다.

## 기술 스택

- **Frontend**: Retool
- **Workflow Automation**: n8n
- **Backend/Database**: Supabase (PostgreSQL)
- **AI Services**:
  - OCR: Azure Computer Vision
  - STT: Azure Speech Services
  - Summarization: Azure OpenAI

## 시스템 구조

```
.
├── backend/               # Supabase 백엔드
│   ├── migrations/       # 데이터베이스 마이그레이션
│   ├── functions/       # Edge Functions
│   └── triggers/        # 데이터베이스 트리거
├── workflows/            # n8n 워크플로우
│   ├── ocr/            # OCR 처리 워크플로우
│   ├── stt/            # 음성-텍스트 변환 워크플로우
│   └── summarize/      # AI 요약 워크플로우
├── retool/              # Retool 앱
│   ├── apps/           # 사용자 인터페이스
│   └── queries/        # 데이터 쿼리
└── supabase/            # Supabase 설정
    ├── config/         # 프로젝트 설정
    └── seed/           # 초기 데이터
```

## 설치 및 설정

### 사전 요구사항

1. [Supabase CLI](https://supabase.io/docs/reference/cli/installing-and-updating) 설치
2. [n8n](https://docs.n8n.io/getting-started/installation/) 설치
3. [Retool](https://retool.com/docs/onboarding) 계정 생성
4. Azure 서비스 설정:
   - Computer Vision API
   - Speech Services
   - OpenAI 서비스

### 환경 설정

1. Supabase 프로젝트 초기화:
\`\`\`bash
supabase init
supabase start
\`\`\`

2. n8n 실행:
\`\`\`bash
n8n start
\`\`\`

3. 환경 변수 설정:
\`\`\`bash
cp .env.example .env
# .env 파일에 필요한 API 키와 설정 추가
\`\`\`

## 워크플로우

### 1. OCR 처리
1. 문서 업로드
2. Azure Computer Vision OCR 처리
3. 텍스트 추출 및 저장

### 2. STT(음성-텍스트) 변환
1. 오디오 파일 업로드
2. Azure Speech Services로 변환
3. 텍스트 저장

### 3. AI 요약
1. 추출된 텍스트 처리
2. Azure OpenAI로 요약 생성
3. 결과 저장 및 표시

## 개발 가이드

### Supabase 데이터베이스 구조

\`\`\`sql
-- 문서 테이블
CREATE TABLE documents (
  id uuid DEFAULT gen_random_uuid(),
  title TEXT,
  content TEXT,
  content_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (id)
);

-- 처리 결과 테이블
CREATE TABLE processing_results (
  id uuid DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id),
  result_type TEXT,
  result_content TEXT,
  processed_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (id)
);
\`\`\`

### n8n 워크플로우 개발

1. Webhook 노드로 시작
2. Azure 서비스 노드 연결
3. Supabase 노드로 결과 저장

### Retool 앱 개발

1. 문서 업로드 폼 생성
2. 처리 상태 모니터링 대시보드
3. 결과 표시 및 다운로드 인터페이스

## 배포

### 1. Supabase 배포
\`\`\`bash
supabase deploy
\`\`\`

### 2. n8n 워크플로우 배포
- n8n 클라우드에 워크플로우 업로드
- 환경 변수 설정

### 3. Retool 앱 배포
- Retool 대시보드에서 앱 게시
- 권한 설정

## 라이선스

MIT License