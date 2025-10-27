# 조직 동향 리포트 기능

## 개요

사용자가 관심있는 기업, 관공서, 대학의 최신 동향을 OpenAI GPT 모델이 자동으로 분석하여 리포트를 생성하는 기능입니다.

## 주요 기능

### 1. 관심 조직 관리

- 기업, 관공서, 대학을 유형별로 등록
- 연락처에 등록된 회사도 자동으로 포함
- 조직별 태그 및 삭제 기능

### 2. 프롬프트 커스터마이징

- AI 리포트 생성 시 사용할 프롬프트 템플릿 수정 가능
- `{organizations}` 플레이스홀더에 등록된 조직 목록 자동 삽입
- 리포트 형식, 분석 기준 등 자유롭게 설정

### 3. AI 동향 리포트 생성

- OpenAI GPT-4o-mini 모델 사용
- 등록된 모든 조직의 최신 동향 한 번에 분석
- AI 기반 자동 요약 및 인사이트 제공
- 생성된 리포트는 데이터베이스에 자동 저장
- API 오류 시 프롬프트 미리보기 제공 (fallback)

## 데이터베이스 구조

### report_organizations 테이블
```sql
- id: UUID (PK)
- user_id: UUID (FK to auth.users)
- name: TEXT (조직명)
- type: TEXT ('company', 'government', 'university')
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### report_prompt_settings 테이블
```sql
- id: UUID (PK)
- user_id: UUID (FK to auth.users)
- prompt_template: TEXT (프롬프트 템플릿)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

## 사용 방법

### 0. OpenAI API 키 설정 (필수)

1. https://platform.openai.com/api-keys 에서 API 키 발급
2. `.env` 파일에 추가:
   ```bash
   VITE_OPENAI_API_KEY=sk-...your-api-key...
   ```
3. 개발 서버 재시작

### 1. 관심 조직 등록

1. 네비게이션 바에서 "리포트 설정" 클릭
2. "조직 추가" 폼에서 조직명 입력 및 유형 선택
3. "➕ 조직 추가" 버튼 클릭

### 2. 프롬프트 수정 (선택사항)

1. 리포트 설정 페이지에서 "✏️ 편집" 버튼 클릭
2. 프롬프트 템플릿 수정
3. `{organizations}` 부분은 자동으로 조직 목록으로 대체됨
4. "💾 저장" 버튼 클릭

### 3. 리포트 생성

1. 대시보드에서 "📊 최신 리포트 생성" 버튼 클릭
2. OpenAI GPT-4o-mini가 자동으로 각 조직의 최신 동향 분석
3. 생성된 리포트가 "최신 리포트" 섹션에 표시됨

## 프롬프트 템플릿 예시

### 기본 템플릿
```
다음 조직들의 최근 동향을 분석하여 간결한 리포트를 작성해주세요:

조직 목록:
{organizations}

각 조직에 대해:
1. 최근 1개월 이내의 주요 뉴스나 이벤트
2. 사업 확장, 신제품 출시, 인사 변동 등의 중요 변화
3. 비즈니스 관계에 영향을 줄 수 있는 이슈

리포트 형식:
- 조직별로 구분하여 작성
- 각 항목은 2-3문장으로 간결하게 요약
- 출처나 날짜 정보 포함
```

### 커스터마이징 예시
```
{organizations} 목록의 조직들에 대해 영업 관점에서 중요한 정보를 분석해주세요:

분석 항목:
- 신규 사업 기회
- 조직 변화 (인수합병, 구조조정 등)
- 최근 발주 또는 입찰 정보
- 경쟁사 동향
- 업계 트렌드

각 조직당 3-5개의 핵심 인사이트를 bullet point로 작성하고, 
영업 전략 제안을 포함해주세요.
```

## 파일 구조

```
sql/
  └── 10_create_report_organizations.sql  # 테이블 생성 스크립트

src/
  ├── pages/
  │   └── ReportSettings.tsx              # 리포트 설정 페이지
  ├── services/
  │   ├── ai.service.ts                   # OpenAI API 연동 서비스
  │   └── organizationReport.service.ts   # 리포트 생성 서비스
  └── types/
      └── supabase.ts                      # 타입 정의 (업데이트)
```

## 기술 스택

- **AI 모델**: OpenAI GPT-4o-mini
- **API**: OpenAI Chat Completions API
- **데이터베이스**: Supabase PostgreSQL
- **프론트엔드**: React + TypeScript
- **인증**: Supabase Auth

## 비용 고려사항

GPT-4o-mini 모델 가격 (2024년 기준):
- Input: $0.150 / 1M tokens
- Output: $0.600 / 1M tokens

예상 비용:
- 조직 10개 리포트 생성: 약 $0.01-0.02
- 월 100회 리포트 생성: 약 $1-2

## 향후 개선사항

- [x] OpenAI API 연동
- [x] AI 리포트 자동 생성
- [ ] 리포트 생성 스케줄링 (매일/매주 자동 생성)
- [ ] 리포트 히스토리 관리 UI
- [ ] 조직별 개별 리포트 생성
- [ ] 다른 AI 모델 지원 (Claude, Gemini 등)
- [ ] 이메일/슬랙 알림 연동
- [ ] 리포트 템플릿 프리셋 제공
- [ ] 리포트 내보내기 (PDF, Word)

## SQL 마이그레이션

```bash
# Supabase Dashboard > SQL Editor에서 실행
sql/10_create_report_organizations.sql
```

## 환경 변수 설정

```bash
# .env 파일에 추가
VITE_OPENAI_API_KEY=sk-...your-openai-api-key...
```

## 테스트

1. ✅ SQL 마이그레이션 실행 확인
2. ✅ OpenAI API 키 설정 확인
3. ✅ 리포트 설정 페이지 접근 확인
4. ✅ 조직 추가/삭제 기능 테스트
5. ✅ 프롬프트 수정 및 저장 테스트
6. ✅ AI 리포트 생성 기능 테스트
7. ✅ 생성된 리포트 확인

## 트러블슈팅

### API 키 오류

**증상**: "OpenAI API 키가 설정되지 않았습니다" 오류

**해결**:
1. `.env` 파일에 `VITE_OPENAI_API_KEY` 추가 확인
2. 개발 서버 재시작 (`npm run dev`)
3. API 키 유효성 확인 (https://platform.openai.com/api-keys)

### AI 생성 실패

**증상**: 프롬프트 미리보기만 표시됨

**원인**:
- OpenAI API 할당량 초과
- API 키 권한 부족
- 네트워크 오류

**해결**:
- OpenAI 대시보드에서 사용량 확인
- API 키 권한 확인 및 재발급
- 네트워크 연결 확인

### 조직 목록 없음

**증상**: "조직이 등록되어 있지 않습니다" 오류

**해결**:
1. 리포트 설정에서 관심 조직 등록
2. 또는 연락처에 회사 정보 추가
