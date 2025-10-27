# Supabase Functions 수동 배포 가이드 (CLI 없이)

Supabase CLI 설치에 문제가 있거나 빠르게 배포하고 싶을 때 대시보드를 통해 직접 배포할 수 있습니다.

## 배포 방법

### 1. Supabase 대시보드 접속
https://supabase.com/dashboard 에서 프로젝트 선택

### 2. Edge Functions 메뉴 이동
왼쪽 사이드바 > `Edge Functions` 클릭

### 3. Secrets 설정 (필수)
배포 전 먼저 환경 변수를 설정해야 합니다:

1. `Edge Functions` 페이지에서 `Manage secrets` 클릭
2. 다음 시크릿 추가:
   - **OPENAI_API_KEY**: `sk-proj-...` (이미 설정한 키 사용)
   - **SLACK_WEBHOOK_URL**: `https://hooks.slack.com/services/...` (선택사항)

### 4. 함수 배포 (5개 함수 각각 반복)

#### 함수 1: generate-smalltalk

1. `Create Function` 버튼 클릭
2. Function name: `generate-smalltalk`
3. 코드 에디터에 아래 내용 붙여넣기:

`supabase/functions/generate-smalltalk/index.ts` 파일 전체 내용을 복사

4. `Deploy` 버튼 클릭

#### 함수 2: process-call

1. `Create Function` 버튼 클릭
2. Function name: `process-call`
3. 코드: `supabase/functions/process-call/index.ts` 복사
4. `Deploy` 클릭

#### 함수 3: send-slack

1. `Create Function` 버튼 클릭
2. Function name: `send-slack`
3. 코드: `supabase/functions/send-slack/index.ts` 복사
4. `Deploy` 클릭

#### 함수 4: analyze-news

1. `Create Function` 버튼 클릭
2. Function name: `analyze-news`
3. 코드: `supabase/functions/analyze-news/index.ts` 복사
4. `Deploy` 클릭

#### 함수 5: extract-date

1. `Create Function` 버튼 클릭
2. Function name: `extract-date`
3. 코드: `supabase/functions/extract-date/index.ts` 복사
4. `Deploy` 클릭

### 5. 배포 확인

각 함수 배포 후:
- 함수 목록에서 초록색 `Deployed` 상태 확인
- 함수 클릭 → `Logs` 탭에서 배포 로그 확인
- 함수 URL 복사 (나중에 테스트용)

### 6. 프런트엔드 설정 확인

`.env` 파일에 다음 값이 설정되어 있는지 확인:

```env
VITE_SUPABASE_URL=https://jvadwfxkkhcmndluxyzk.supabase.co
VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 테스트

### 브라우저에서 테스트

1. 개발 서버 실행: `npm run dev:edge`
2. Chrome에서 http://127.0.0.1:5174/study1024/ 접속
3. 기능 테스트:
   - 통화 녹음 → `process-call` 함수 호출
   - 뉴스 리포트 생성 → `analyze-news` 함수 호출
   - 일정 날짜 추출 → `extract-date` 함수 호출

### 개발자 도구에서 확인

1. F12 → Network 탭
2. `functions/v1/` 필터링
3. 함수 호출 시 200 응답 확인
4. 오류 시 Console 탭에서 에러 메시지 확인

### Supabase 대시보드에서 로그 확인

1. Edge Functions 메뉴
2. 각 함수 클릭
3. `Logs` 탭에서 실시간 로그 확인
4. 오류 발생 시 스택 트레이스 확인

## 문제 해결

### 함수 호출 시 401 Unauthorized
- `.env` 파일의 `VITE_SUPABASE_KEY` 확인
- 브라우저 캐시 삭제 후 재시도

### 함수 호출 시 500 Internal Server Error
- Supabase 대시보드 → 함수 Logs 확인
- Secrets 설정 확인 (`OPENAI_API_KEY` 등)

### OpenAI 관련 오류
- `OPENAI_API_KEY` 시크릿이 올바르게 설정되었는지 확인
- 키 유효성 확인 (OpenAI 대시보드에서)

## 배포 완료 체크리스트

- [ ] Secrets 설정 완료 (OPENAI_API_KEY)
- [ ] 5개 함수 모두 배포 완료
- [ ] 각 함수 상태가 `Deployed`로 표시
- [ ] 프런트엔드 `.env` 파일 설정
- [ ] 브라우저에서 기능 테스트 완료
- [ ] 오류 없이 정상 동작 확인

## 다음 단계

배포 완료 후 다음 개발 작업으로 진행:
- [ ] Supabase 클라이언트 단일화 (2번 작업)
- [ ] Next 미들웨어 정리 (3번 작업)
- [ ] 의존성 정리 (4번 작업)
