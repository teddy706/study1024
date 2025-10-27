# Supabase Edge Functions 배포 가이드

## 배포할 함수 목록

이 프로젝트는 총 5개의 Supabase Edge Functions을 사용합니다:

1. **generate-smalltalk** - 통화 요약으로 스몰토크 생성
2. **process-call** - 음성 파일 전사 + 요약 + 통화 저장
3. **send-slack** - Slack 웹훅 전송
4. **analyze-news** - 뉴스 기사 분석 및 요약
5. **extract-date** - 텍스트에서 날짜/시간 추출

## 사전 준비

### 1. Supabase CLI 설치

#### Windows (PowerShell)
```powershell
# Scoop 사용
scoop install supabase

# 또는 npm으로 설치
npm install -g supabase
```

#### macOS/Linux
```bash
brew install supabase/tap/supabase
```

### 2. Supabase 프로젝트 연결

```powershell
# 프로젝트 루트에서 실행
supabase login

# 기존 프로젝트 연결
supabase link --project-ref YOUR_PROJECT_REF
```

프로젝트 ref는 Supabase 대시보드 URL에서 확인:
`https://supabase.com/dashboard/project/[YOUR_PROJECT_REF]`

### 3. Secrets 설정

배포 전에 필수 환경 변수를 Secrets로 설정해야 합니다:

```powershell
# OpenAI API Key (필수)
supabase secrets set OPENAI_API_KEY='sk-...'

# Slack Webhook URL (선택)
supabase secrets set SLACK_WEBHOOK_URL='https://hooks.slack.com/services/...'

# Supabase 환경 변수 (자동 설정되지만 명시 가능)
supabase secrets set SUPABASE_URL='https://xxxx.supabase.co'
supabase secrets set SUPABASE_SERVICE_ROLE_KEY='eyJ...'
```

Secrets 확인:
```powershell
supabase secrets list
```

## Functions 배포

### 전체 함수 일괄 배포

```powershell
# 모든 함수 배포
supabase functions deploy generate-smalltalk
supabase functions deploy process-call
supabase functions deploy send-slack
supabase functions deploy analyze-news
supabase functions deploy extract-date
```

### 개별 함수 배포

```powershell
# 특정 함수만 업데이트
supabase functions deploy generate-smalltalk --no-verify-jwt

# 배포 후 로그 확인
supabase functions logs generate-smalltalk
```

### 로컬 테스트 (배포 전 검증)

```powershell
# 로컬에서 함수 실행
supabase start

# 특정 함수 로컬 테스트
supabase functions serve generate-smalltalk

# 다른 터미널에서 호출 테스트
curl -i --location --request POST 'http://localhost:54321/functions/v1/generate-smalltalk' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"summary":"테스트 요약","contactId":"test-id"}'
```

## 배포 후 확인

### 1. Supabase 대시보드에서 확인
- `프로젝트 대시보드 > Edge Functions` 메뉴
- 배포된 함수 목록과 상태 확인
- 각 함수의 로그 및 호출 통계 확인

### 2. 함수 URL 확인
배포된 함수는 다음 형식의 URL로 접근:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/FUNCTION_NAME
```

### 3. 프런트엔드 연결 확인
`.env` 파일에 Supabase URL과 anon key가 설정되어 있으면 자동으로 연결됩니다:
```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_KEY=eyJ...
```

## 문제 해결

### CLI 설치 실패
```powershell
# npm 글로벌 설치 경로 확인
npm config get prefix

# PATH에 추가 필요 시
$env:PATH += ";C:\Users\YourName\AppData\Roaming\npm"
```

### 배포 권한 오류
```powershell
# 다시 로그인
supabase logout
supabase login

# 프로젝트 재연결
supabase link --project-ref YOUR_PROJECT_REF
```

### 함수 실행 오류
```powershell
# 함수 로그 실시간 조회
supabase functions logs FUNCTION_NAME --follow

# Secrets 누락 확인
supabase secrets list
```

### CORS 오류
함수 코드에 이미 CORS 헤더가 포함되어 있으므로 별도 설정 불필요. 
OPTIONS 요청이 제대로 처리되는지 확인:
```typescript
if (req.method === 'OPTIONS') {
  return new Response('ok', { headers: corsHeaders })
}
```

## 수동 배포 (Supabase 대시보드 사용)

CLI 없이도 배포 가능합니다:

1. Supabase 대시보드 접속
2. `Edge Functions` 메뉴 선택
3. `Create a new function` 클릭
4. 함수 이름 입력 (예: `generate-smalltalk`)
5. `supabase/functions/[함수명]/index.ts` 내용을 복사해서 붙여넣기
6. `Deploy` 클릭
7. 나머지 4개 함수도 동일하게 반복

## 배포 체크리스트

- [ ] Supabase CLI 설치 완료
- [ ] 프로젝트 연결 완료 (`supabase link`)
- [ ] Secrets 설정 완료 (`OPENAI_API_KEY` 등)
- [ ] 5개 함수 배포 완료
- [ ] 대시보드에서 함수 상태 확인
- [ ] 프런트엔드 `.env` 파일 설정
- [ ] 로컬 개발 서버에서 함수 호출 테스트

## 다음 단계

배포 완료 후:
1. 브라우저에서 앱 접속 (http://localhost:5174/study1024/)
2. 통화 녹음/뉴스/일정 기능 테스트
3. 브라우저 개발자 도구 Network 탭에서 Functions 호출 확인
4. 오류 발생 시 Supabase 대시보드 로그 확인
