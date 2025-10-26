# n8n으로 스몰토크 자동 생성 설정 가이드

n8n 무료 플랜을 사용하여 매일 아침 7시에 스몰토크를 자동 생성하는 시스템을 구축하는 가이드입니다.

## 📋 목차

1. [시스템 개요](#시스템-개요)
2. [사전 준비](#사전-준비)
3. [Supabase RPC 함수 설정](#supabase-rpc-함수-설정)
4. [n8n 워크플로우 설정](#n8n-워크플로우-설정)
5. [테스트 및 모니터링](#테스트-및-모니터링)
6. [비용 분석](#비용-분석)

## 🎯 시스템 개요

### 아키텍처

```text
┌─────────────┐      ┌─────────────┐      ┌──────────────┐
│   n8n       │      │  Supabase   │      │   OpenAI     │
│  (무료)     │─────>│  RPC 함수   │─────>│  API         │
│  Cron 7am   │      │             │      │  (GPT-4o)    │
└─────────────┘      └─────────────┘      └──────────────┘
       │                     │
       │                     v
       │              ┌──────────────┐
       └─────────────>│ smalltalk_   │
                      │   cache      │
                      └──────────────┘
```

### 워크플로우 흐름

1. **Cron Trigger**: 매일 22:00 UTC (한국시간 7:00) 실행
2. **데이터 조회**: Supabase RPC로 최근 7일간 통화한 고객 목록 가져오기
3. **AI 생성**: 각 고객별로 OpenAI API를 호출하여 스몰토크 2-3개 생성
4. **데이터 저장**: 생성된 스몰토크를 Supabase에 저장
5. **결과 집계**: 처리된 고객 수와 생성된 항목 수 집계

## 🔧 사전 준비

### 1. n8n 계정 생성

1. [n8n.io](https://n8n.io)에 접속하여 무료 계정 생성
2. 무료 플랜 혜택:
   - ✅ 월 2,500 워크플로우 실행
   - ✅ 무제한 워크플로우
   - ✅ Cron 스케줄링 지원

### 2. 필요한 정보 준비

다음 정보를 미리 확인하세요:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
OPENAI_API_KEY=sk-...
```

## 📦 Supabase RPC 함수 설정

### 1. SQL 함수 배포

Supabase Dashboard → SQL Editor에서 다음 파일 실행:

```bash
# 파일 위치
sql/daily_smalltalk_rpc.sql
```

이 스크립트는 두 개의 RPC 함수를 생성합니다:

#### `get_recent_calls_for_smalltalk(days_back INTEGER)`

최근 통화 데이터를 조회합니다.

**입력:**
- `days_back`: 조회할 기간 (기본값: 7일)

**출력:**
```json
[
  {
    "contact_id": "uuid",
    "contact_name": "홍길동",
    "company": "ABC Corp",
    "recent_summaries": "프로젝트 진행 현황 논의 (2025-10-25)\n---\n예산 승인 건 상담 (2025-10-23)"
  }
]
```

#### `insert_smalltalk_items(p_contact_id UUID, p_items JSONB)`

생성된 스몰토크를 저장합니다.

**입력:**
- `p_contact_id`: 고객 UUID
- `p_items`: 스몰토크 배열 (JSONB)

**예시:**
```json
[
  {
    "topic": "프로젝트 진행 현황",
    "content": "지난 주 논의한 프로젝트는 어떻게 진행되고 있나요?",
    "days": 7
  }
]
```

**출력:** 삽입된 항목 수 (INTEGER)

### 2. 함수 테스트

SQL Editor에서 직접 테스트:

```sql
-- 최근 통화 조회 테스트
SELECT * FROM get_recent_calls_for_smalltalk(7);

-- 스몰토크 삽입 테스트
SELECT insert_smalltalk_items(
  'your-contact-uuid'::UUID,
  '[
    {"topic": "테스트 주제", "content": "테스트 내용입니다.", "days": 7}
  ]'::JSONB
);
```

## 🔄 n8n 워크플로우 설정

### 1. 워크플로우 Import

1. n8n Dashboard → Workflows → Import from File
2. `n8n/daily-smalltalk-workflow.json` 파일 업로드

### 2. 환경 변수 설정 (자세히)

다음 세 가지 값을 n8n에 안전하게 저장하고 워크플로우에서 참조합니다.

- `SUPABASE_URL`: 예) `https://xxx.supabase.co`
- `SUPABASE_KEY`: Supabase anon 키 (보안 중요)
- `OPENAI_API_KEY`: OpenAI 키 (보안 중요)

#### A) n8n Cloud에서 설정 (권장)

1) 좌측 사이드바 → Settings → Environment Variables 이동
2) Add Variable 클릭 후 아래처럼 추가

| Name | Value | Notes |
| --- | --- | --- |
| SUPABASE_URL | <https://xxx.supabase.co> | 슬래시(/)로 끝내지 않기 |
| SUPABASE_KEY | eyJ... | anon 키 사용 (service role 금지) |
| OPENAI_API_KEY | sk-... | 조직 제한이 있다면 해당 키 사용 |

3. 저장(Save) → 워크플로우 탭에서 새로고침 후 사용 가능

사용 예 (각 노드의 입력 필드에서 fx 아이콘 눌러 Expression 활성화 후 입력):

- URL: `{{$env.SUPABASE_URL}}/rest/v1/rpc/get_recent_calls_for_smalltalk`
- Header 값: `{{$env.SUPABASE_KEY}}`, `Bearer {{$env.OPENAI_API_KEY}}`
- Code 노드(JS): `const url = $env.SUPABASE_URL;`

참고: n8n Cloud는 환경변수 값을 로그에 직접 출력하지 않지만, Code 노드에서 콘솔로 노출하면 기록될 수 있습니다. 비밀값은 되도록 Credentials를 사용하세요.

#### B) Self-hosted에서 설정 (도커)

도커 컴포즈로 운영한다면 `.env`와 `docker-compose.yml`에서 설정합니다.

`.env` 예시:

```env
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=strong-password
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJ...
OPENAI_API_KEY=sk-...
```

`docker-compose.yml` 발췌:

```yaml
services:
  n8n:
    image: n8nio/n8n:latest
    env_file:
      - .env
    ports:
      - "5678:5678"
    volumes:
      - n8n_data:/home/node/.n8n
volumes:
  n8n_data:
```

컨테이너 재시작 후 워크플로우 필드에서 `{{$env.VARIABLE_NAME}}`로 참조합니다.

#### C) Credentials로 비밀값 저장 (보안 권장)

환경변수 대신 n8n Credentials를 사용하면 로그 마스킹과 회수(rotate)가 쉬워집니다.

- Supabase: HTTP Request → Authentication: HTTP Header Auth → Header `apikey: {{$env.SUPABASE_KEY}}` 대신, Credential을 만들어 저장 후 노드에서 선택
- OpenAI: HTTP Request → Authentication: HTTP Header Auth → Header `Authorization: Bearer ...`를 Credential로 저장 후 선택

Tip: 현재 제공한 워크플로우(JSON)는 환경변수 기반으로 동작합니다. 보안을 강화하려면 위 Credential 방식으로 전환만 해도 나머지 로직 수정 없이 작동합니다.

#### D) 자주 겪는 문제와 해결

- 잘못된 URL: `https://.../`처럼 끝에 `/`를 붙이면 이중 슬래시가 되어 404가 날 수 있습니다. 끝 슬래시 제거.
- 잘못된 키: Supabase service role 키를 n8n에 저장하지 마세요. 본 워크플로우는 anon 키로 동작하도록 RPC 권한을 설정했습니다.
- 표현식 미적용: 필드 우측 fx 아이콘(Expressions)을 켜야 `{{$env.*}}`가 평가됩니다.
- 타임존 착각: n8n 스케줄은 기본 UTC입니다. 본 문서는 한국시간 07:00 = `0 22 * * *`(UTC)로 설정했습니다.

### 3. 노드별 설정 확인

#### 노드 1: Cron Trigger

```text
이름: 매일 오후 10시 (KST 7시)
타입: Schedule Trigger
설정: 0 22 * * * (UTC 22:00 = 한국시간 07:00)
```

#### 노드 2: 최근 통화 데이터 조회

```text
이름: 최근 통화 데이터 조회
타입: HTTP Request
메서드: POST
URL: {{ $env.SUPABASE_URL }}/rest/v1/rpc/get_recent_calls_for_smalltalk
헤더:
  - apikey: {{ $env.SUPABASE_KEY }}
  - Content-Type: application/json
바디: {"days_back": 7}
```

#### 노드 3: OpenAI 스몰토크 생성

```text
이름: OpenAI 스몰토크 생성
타입: HTTP Request
메서드: POST
URL: https://api.openai.com/v1/chat/completions
헤더:
  - Authorization: Bearer {{ $env.OPENAI_API_KEY }}
  - Content-Type: application/json
바디: (워크플로우 파일 참조)
```

#### 노드 4: JSON 파싱

```text
이름: JSON 파싱
타입: Code
언어: JavaScript
코드: OpenAI 응답에서 JSON 배열 추출 및 오류 처리
```

#### 노드 5: Supabase에 저장

```text
이름: Supabase에 저장
타입: HTTP Request
메서드: POST
URL: {{ $env.SUPABASE_URL }}/rest/v1/rpc/insert_smalltalk_items
헤더:
  - apikey: {{ $env.SUPABASE_KEY }}
  - Content-Type: application/json
바디: {"p_contact_id": "...", "p_items": [...]}
```

### 4. 워크플로우 활성화

1. 우측 상단 토글 스위치를 "Active"로 변경
2. 다음 실행 예정 시간 확인

## 🧪 테스트 및 모니터링

### 1. 수동 테스트

워크플로우를 즉시 실행하여 테스트:

1. n8n 워크플로우 화면에서 "Execute Workflow" 버튼 클릭
2. 각 노드의 실행 결과 확인
3. 에러 발생 시 해당 노드의 로그 확인

### 2. 실행 기록 확인

n8n Dashboard → Executions:

- 실행 시간
- 성공/실패 상태
- 처리된 항목 수
- 에러 메시지 (있는 경우)

### 3. Supabase에서 결과 확인

SQL Editor에서 생성된 스몰토크 확인:

```sql
-- 최근 생성된 스몰토크 확인
SELECT 
  c.name AS contact_name,
  s.topic,
  s.content,
  s.expires_at,
  s.created_at
FROM smalltalk_cache s
JOIN contacts c ON c.id = s.contact_id
WHERE s.created_at >= NOW() - INTERVAL '1 hour'
ORDER BY s.created_at DESC;
```

### 4. 알림 설정 (선택사항)

워크플로우에 Slack/Email 노드 추가:

```text
결과 집계 노드 → Slack/Email 노드
```

알림 내용 예시:

```text
📊 오늘의 스몰토크 생성 완료
• 처리된 고객: 25명
• 생성된 항목: 68개
• 실행 시간: 2025-10-26 07:00
```

## 💰 비용 분석

### n8n 무료 플랜

- **월 비용**: $0
- **월 실행 한도**: 2,500회
- **사용량**: 일 1회 × 30일 = 30회/월
- **여유분**: 2,470회 (다른 워크플로우에 사용 가능)

### OpenAI API 비용

**모델**: GPT-4o-mini

- **Input**: $0.150 / 1M tokens
- **Output**: $0.600 / 1M tokens

**예상 사용량** (고객 100명 기준):

- Input: ~500 tokens/고객 × 100 = 50K tokens
- Output: ~200 tokens/고객 × 100 = 20K tokens

**일일 비용**:

```text
Input:  50K × $0.150 / 1M = $0.0075
Output: 20K × $0.600 / 1M = $0.0120
Total:                      $0.0195 (~₩26)
```

**월간 비용**: $0.59 (~₩780)

### Supabase 무료 플랜

- **월 비용**: $0
- **DB 크기**: 500MB (충분)
- **API 요청**: 무제한
- **RPC 호출**: 무제한

### 총 비용 요약

| 항목 | 월 비용 |
|------|---------|
| n8n | $0 |
| OpenAI API | ~$0.60 |
| Supabase | $0 |
| **합계** | **$0.60 (~₩800)** |

## 🔍 트러블슈팅

### 문제 1: 워크플로우가 실행되지 않음

**원인**: Cron 표현식 오류 또는 워크플로우 비활성화

**해결**:

1. 워크플로우가 "Active" 상태인지 확인
2. Cron 표현식이 `0 22 * * *`인지 확인
3. n8n 계정의 실행 한도를 초과하지 않았는지 확인

### 문제 2: Supabase RPC 호출 실패

**원인**: 잘못된 API 키 또는 함수 미배포

**해결**:

1. `SUPABASE_URL`과 `SUPABASE_KEY`가 올바른지 확인
2. SQL 함수가 배포되었는지 Supabase Dashboard에서 확인:

  ```sql
  SELECT routine_name 
  FROM information_schema.routines 
  WHERE routine_schema = 'public'
  AND routine_name LIKE '%smalltalk%';
  ```

### 문제 3: OpenAI API 오류

**원인**: API 키 오류, 할당량 초과, 또는 잘못된 요청

**해결**:

1. OpenAI API 키가 유효한지 확인
2. [OpenAI Usage](https://platform.openai.com/usage)에서 할당량 확인
3. n8n 실행 로그에서 OpenAI 응답 확인

### 문제 4: JSON 파싱 오류

**원인**: OpenAI가 잘못된 형식으로 응답

**해결**:

- JSON 파싱 노드에 폴백 로직이 포함되어 있어 자동으로 처리됨
- 지속적으로 발생 시 OpenAI 프롬프트 수정 필요

## 📚 추가 리소스

- [n8n 공식 문서](https://docs.n8n.io/)
- [Supabase RPC 가이드](https://supabase.com/docs/guides/database/functions)
- [OpenAI API 문서](https://platform.openai.com/docs/api-reference)

## 🎉 완료

이제 매일 아침 7시에 자동으로 스몰토크가 생성됩니다. ContactDetail 페이지에서 결과를 확인하세요!

### 다음 단계

- [ ] 워크플로우 실행 결과 모니터링
- [ ] 생성된 스몰토크 품질 확인
- [ ] 필요시 OpenAI 프롬프트 최적화
- [ ] Slack/Email 알림 추가 (선택사항)
