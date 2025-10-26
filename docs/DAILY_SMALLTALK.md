# 매일 자동 스몰토크 생성 가이드

## 개요

매일 아침 7시(한국 시간)에 자동으로:
1. 최근 7일간 통화가 있었던 고객 조회
2. OpenAI로 통화 요약 기반 스몰토크 소재 생성
3. `smalltalk_cache` 테이블에 자동 저장

## 아키텍처

```
pg_cron (매일 7시)
  → SQL 함수 (trigger_daily_smalltalk_generation)
    → Supabase Edge Function (generate-daily-smalltalk)
      → OpenAI API
        → smalltalk_cache 테이블
```

## 설정 방법

### 1단계: Edge Function 배포

#### Supabase CLI 설치
```powershell
npm install -g supabase
```

#### 로그인
```powershell
supabase login
```

#### Edge Function 배포
```powershell
cd c:\Users\teddy\OneDrive\문서\GitHub\study1024
supabase functions deploy generate-daily-smalltalk
```

#### 환경 변수 설정
Supabase Dashboard → Edge Functions → Secrets:
```
OPENAI_API_KEY = your-openai-api-key
```

### 2단계: 스케줄 설정

#### 옵션 A: Supabase Dashboard (권장)

1. Supabase Dashboard → Database → Cron Jobs
2. **New cron job** 클릭
3. 설정:
   - Name: `daily-smalltalk-generation`
   - Schedule: `0 22 * * *` (매일 UTC 22시 = 한국 시간 오전 7시)
   - SQL:
     ```sql
     SELECT
       net.http_post(
         url := 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/generate-daily-smalltalk',
         headers := jsonb_build_object(
           'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
         ),
         body := '{}'::jsonb
       );
     ```

#### 옵션 B: SQL로 직접 설정

`sql/schedule_daily_smalltalk.sql` 파일의 주석 참고

### 3단계: 로컬 테스트

#### Edge Function 로컬 실행
```powershell
supabase start
supabase functions serve generate-daily-smalltalk
```

#### 테스트 호출
```powershell
curl -X POST http://localhost:54321/functions/v1/generate-daily-smalltalk `
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

#### npm 스크립트로 테스트
```powershell
npx tsx src/scripts/testDailySmalltalk.ts
```

## 동작 방식

### Edge Function 로직

1. **최근 통화 조회**: 7일 이내 `calls` 테이블에서 요약이 있는 통화
2. **고객별 그룹화**: 같은 고객의 여러 통화를 묶음
3. **AI 생성**: OpenAI로 각 고객당 2-3개 스몰토크 생성
4. **DB 저장**: `smalltalk_cache`에 만료일과 함께 저장

### 생성 예시

```json
[
  {
    "topic": "최근 골프 라운딩",
    "content": "지난주 라운딩 말씀하셨는데 어떠셨나요?",
    "expire_days": 7
  },
  {
    "topic": "신제품 관심",
    "content": "새로 출시된 제품 검토해보셨는지 궁금합니다.",
    "expire_days": 10
  }
]
```

## 모니터링

### 실행 로그 확인
```powershell
supabase functions logs generate-daily-smalltalk
```

### 스케줄 실행 이력
```sql
SELECT * FROM cron.job_run_details
WHERE jobname = 'daily-smalltalk-generation'
ORDER BY start_time DESC
LIMIT 10;
```

### 생성된 스몰토크 확인
```sql
SELECT 
  c.name,
  c.company,
  st.topic,
  st.content,
  st.expires_at,
  st.created_at
FROM smalltalk_cache st
JOIN contacts c ON st.contact_id = c.id
WHERE st.created_at > NOW() - INTERVAL '1 day'
ORDER BY st.created_at DESC;
```

## 비용 고려사항

### Supabase
- **Free Tier**: Cron Jobs 없음
- **Pro 플랜 ($25/월)**: Cron Jobs 사용 가능

### OpenAI
- 모델: `gpt-4o-mini`
- 고객당 요청 1개
- 예상 비용: 고객 100명 × $0.0001 ≈ $0.01/일

## 문제 해결

### Edge Function 배포 실패
```powershell
supabase functions deploy generate-daily-smalltalk --no-verify-jwt
```

### Cron Job 실행 안됨
- Pro 플랜 이상인지 확인
- Edge Function URL이 정확한지 확인
- Service Role Key가 올바른지 확인

### OpenAI 호출 실패
- Secrets에 `OPENAI_API_KEY` 등록 확인
- API 잔액 확인
- 모델 이름 오타 확인 (`gpt-4o-mini`)

## 수동 실행

즉시 테스트하려면:
```powershell
# 로컬
npx tsx src/scripts/testDailySmalltalk.ts

# 프로덕션
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/generate-daily-smalltalk \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

## 다음 단계

- [ ] Slack/이메일 알림 추가
- [ ] 생성 실패 시 재시도 로직
- [ ] 고객별 생성 빈도 조정 (중요 고객은 매일, 일반 고객은 주 1회)
- [ ] A/B 테스트: 다양한 프롬프트 비교
