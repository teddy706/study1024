# 🚀 조직 동향 리포트 설정 및 실행 가이드

## 현재 상태

✅ AI 연동 코드 완료
✅ 프론트엔드 UI 완료
❌ **SQL 마이그레이션 필요** ← 지금 해야 할 작업

## 오류 분석

발생한 오류들:
1. **406 Not Acceptable**: `report_organizations`, `report_prompt_settings` 테이블이 없음
2. **23503 Foreign Key Constraint**: `reports.contact_id`가 NOT NULL이어서 조직 리포트 저장 불가

## 해결 방법: SQL 마이그레이션

### Step 1: Supabase Dashboard 접속

```
URL: https://supabase.com/dashboard/project/jvadwfxkkhcmndluxyzk
메뉴: SQL Editor
```

### Step 2: 첫 번째 SQL 실행

**파일 열기**: `sql/10_create_report_organizations.sql`

**작업**:
1. SQL Editor에서 파일 내용 전체 복사
2. 붙여넣기
3. **RUN** 버튼 클릭
4. "Success. No rows returned" 확인

**생성되는 것**:
- ✅ `report_organizations` 테이블
- ✅ `report_prompt_settings` 테이블
- ✅ RLS 정책
- ✅ 기본 프롬프트 자동 생성 트리거

### Step 3: 두 번째 SQL 실행

**파일 열기**: `sql/11_make_reports_contact_id_nullable.sql`

**작업**:
1. SQL Editor에서 새 쿼리 생성
2. 파일 내용 복사 붙여넣기
3. **RUN** 버튼 클릭

**수정되는 것**:
- ✅ `reports.contact_id` → nullable로 변경
- ✅ 조직 리포트 저장 가능

### Step 4: 확인

SQL Editor에서 실행:

```sql
-- 테이블 존재 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('report_organizations', 'report_prompt_settings');

-- 결과: 2개 행이 나와야 함
```

## 실행 후 테스트

### 1. 브라우저 새로고침
- 현재 페이지를 F5로 새로고침

### 2. 리포트 설정 접속
- 네비게이션 → "리포트 설정" 클릭
- 오류 없이 페이지가 열려야 함

### 3. 조직 추가 테스트
```
1. 조직명: "삼성전자" 입력
2. 유형: "기업" 선택
3. "➕ 조직 추가" 클릭
4. 목록에 표시 확인
```

### 4. 리포트 생성 테스트
```
1. 대시보드로 이동
2. "📊 최신 리포트 생성" 버튼 클릭
3. 10-30초 대기
4. 성공 알림 확인
5. 리포트 목록에서 생성된 리포트 확인
```

## 파일 구조

```
sql/
├── 10_create_report_organizations.sql    ← Step 2에서 실행
├── 11_make_reports_contact_id_nullable.sql ← Step 3에서 실행
└── README_MIGRATION.md                    ← 상세 가이드

src/
├── services/
│   ├── ai.service.ts                      ← OpenAI API 연동
│   └── organizationReport.service.ts      ← 리포트 생성 로직
└── pages/
    ├── Dashboard.tsx                      ← 리포트 생성 버튼
    └── ReportSettings.tsx                 ← 조직 관리 UI
```

## 환경 변수 설정 (중요!)

`.env` 파일에 OpenAI API 키 추가:

```bash
VITE_OPENAI_API_KEY=sk-your-actual-api-key-here
```

설정 후 개발 서버 재시작:
```powershell
# Ctrl+C로 서버 중지 후
npm run dev
```

## 완료 체크리스트

- [ ] SQL 파일 1: `10_create_report_organizations.sql` 실행
- [ ] SQL 파일 2: `11_make_reports_contact_id_nullable.sql` 실행
- [ ] 테이블 생성 확인
- [ ] OpenAI API 키 설정 (`.env`)
- [ ] 개발 서버 재시작
- [ ] 리포트 설정 페이지 접속 테스트
- [ ] 조직 추가 테스트
- [ ] 리포트 생성 테스트

## 문제 해결

### 여전히 406 오류가 나는 경우

**원인**: SQL이 실행되지 않았거나 RLS 정책 문제

**해결**:
```sql
-- RLS 확인
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename = 'report_organizations';

-- 정책이 없으면 sql/10_create_report_organizations.sql 다시 실행
```

### 여전히 23503 오류가 나는 경우

**원인**: `reports.contact_id`가 여전히 NOT NULL

**해결**:
```sql
-- 컬럼 확인
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'reports' AND column_name = 'contact_id';

-- is_nullable이 'NO'이면 sql/11_make_reports_contact_id_nullable.sql 다시 실행
```

## 다음 단계

마이그레이션 완료 후:
1. ✅ 조직 리포트 기능 완전 작동
2. 📝 명함 OCR 기능 테스트 (이전에 구현됨)
3. 📝 전화번호 분류 테스트
4. 📝 연락처 편집 테스트

---

**중요**: SQL 마이그레이션을 먼저 실행해야 모든 기능이 작동합니다!
