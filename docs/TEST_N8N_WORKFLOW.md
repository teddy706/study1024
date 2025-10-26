# n8n 워크플로우 테스트 가이드

## 🐛 디버깅 완료 사항

### 1. 문법 오류 수정
- ✅ 스크립트 주석에 포함된 실제 API 키 제거
- ✅ JavaScript 문법 오류 해결

### 2. SQL 함수 수정
- ✅ `calls.created_at` → `calls.called_at` (올바른 컬럼명으로 수정)
- 📝 수정 파일: `sql/daily_smalltalk_rpc.sql`

### 3. 디버깅 기능 추가
- ✅ `--debug` 플래그로 상세 로그 출력
- ✅ 에러 메시지 개선 (이모지 + 컬러 + 상세 정보)
- ✅ 단계별 진행 상황 표시

## 🚀 테스트 실행 방법

### 1단계: SQL 함수 업데이트

Supabase SQL Editor에서 다음 파일을 실행하세요:

\`\`\`bash
sql/daily_smalltalk_rpc.sql
\`\`\`

이 스크립트는:
- `get_recent_calls_for_smalltalk(days_back)` - 최근 통화 조회
- `insert_smalltalk_items(contact_id, items)` - 스몰토크 저장

### 2단계: 환경 변수 설정 (PowerShell)

#### 방법 A: 직접 설정

\`\`\`powershell
$env:SUPABASE_URL = "https://xxx.supabase.co"
$env:SUPABASE_KEY = "eyJ..."    # anon 키
$env:OPENAI_API_KEY = "sk-..."
\`\`\`

#### 방법 B: 설정 파일 사용 (권장)

1. 예제 파일 복사:
\`\`\`powershell
Copy-Item scripts\setup-env.example.ps1 scripts\setup-env.ps1
\`\`\`

2. `scripts\setup-env.ps1` 파일을 열어 실제 값으로 수정

3. 설정 로드:
\`\`\`powershell
. .\scripts\setup-env.ps1
\`\`\`

### 3단계: 테스트 실행

#### 기본 테스트 (1명만)
\`\`\`powershell
node .\scripts\test-n8n-flow.js --days 7 --limit 1
\`\`\`

#### 디버그 모드 (상세 로그)
\`\`\`powershell
node .\scripts\test-n8n-flow.js --debug --limit 1
\`\`\`

#### 전체 테스트 (최근 7일, 3명)
\`\`\`powershell
node .\scripts\test-n8n-flow.js --days 7 --limit 3
\`\`\`

#### 특정 고객만 테스트
\`\`\`powershell
node .\scripts\test-n8n-flow.js --contact "uuid-here"
\`\`\`

## 📊 예상 출력

### 성공 시:
\`\`\`
🚀 [시작] n8n 워크플로우 시뮬레이션
   조회 기간: 최근 7일
   처리 제한: 1명

📞 [1/4] 최근 통화 데이터 조회 중...
   ✓ 조회됨: 5명
   ✓ 제한 적용: 1명

🤖 [2/4] OpenAI로 스몰토크 생성 중...
   [1/1] 홍길동 (ABC회사)
      ✓ 생성: 3개
      ✓ 저장: 3개

💾 [3/4] 저장 완료
   성공: 1명 / 실패: 0명
   총 저장: 3개

🔍 [4/4] 최근 생성된 항목 조회...
   ✓ 조회: 10개

📋 최근 생성 항목 (최대 10개):
   • [2025-10-27 오후 3:15] 프로젝트 진행 현황
     지난 주 논의한 프로젝트는 어떻게 진행되고 있나요?

✅ 완료!
\`\`\`

## 🔍 문제 해결

### 오류 1: 환경 변수 누락
\`\`\`
❌ 환경 변수 누락: SUPABASE_URL, SUPABASE_KEY
\`\`\`
**해결**: 2단계를 다시 확인하여 환경 변수 설정

### 오류 2: Supabase RPC 실패
\`\`\`
❌ Supabase RPC get_recent_calls_for_smalltalk 실패:
   상태: 404 Not Found
\`\`\`
**해결**: 
- Supabase SQL Editor에서 `sql/daily_smalltalk_rpc.sql` 실행
- 함수 생성 확인: `SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public'`

### 오류 3: 처리할 고객 없음
\`\`\`
⚠️  처리할 고객이 없습니다.
\`\`\`
**해결**:
- 최근 통화 데이터가 있는지 확인
- `--days` 옵션을 늘려보기: `--days 30`
- Supabase에서 calls 테이블 확인: `SELECT COUNT(*) FROM calls WHERE summary IS NOT NULL`

### 오류 4: OpenAI API 오류
\`\`\`
❌ OpenAI 오류: 429 Too Many Requests
\`\`\`
**해결**:
- OpenAI 사용량 확인: <https://platform.openai.com/usage>
- API 키 유효성 확인
- 잠시 후 다시 시도

### 오류 5: column calls.created_at does not exist
\`\`\`
❌ column calls.created_at does not exist
\`\`\`
**해결**: ✅ 이미 수정됨! 업데이트된 `sql/daily_smalltalk_rpc.sql` 재실행

## 📝 다음 단계

1. ✅ 로컬 테스트 통과 확인
2. n8n에 워크플로우 import (`n8n/daily-smalltalk-workflow.json`)
3. n8n에서 환경 변수 설정
4. n8n에서 "Execute Workflow" 수동 실행
5. 스케줄 활성화 (매일 22:00 UTC = 한국시간 07:00)

## 📚 관련 문서

- `docs/N8N_SETUP.md` - n8n 완전 설정 가이드
- `sql/daily_smalltalk_rpc.sql` - RPC 함수 정의
- `n8n/daily-smalltalk-workflow.json` - n8n 워크플로우
