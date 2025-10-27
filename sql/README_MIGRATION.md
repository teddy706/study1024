# SQL 마이그레이션 실행 가이드

조직 동향 리포트 기능을 사용하려면 다음 SQL 파일들을 순서대로 실행해야 합니다.

## 실행 방법

### 1. Supabase Dashboard 접속

1. https://supabase.com/dashboard 접속
2. 프로젝트 선택: `jvadwfxkkhcmndluxyzk`
3. 왼쪽 메뉴에서 **SQL Editor** 클릭

### 2. SQL 파일 순서대로 실행

#### Step 1: 조직 관리 테이블 생성

**파일**: `sql/10_create_report_organizations.sql`

**내용**:
- `report_organizations` 테이블 생성 (관심 조직 목록)
- `report_prompt_settings` 테이블 생성 (프롬프트 설정)
- RLS 정책 설정
- 기본 프롬프트 자동 삽입 트리거

**실행**:
1. SQL Editor에서 "New Query" 클릭
2. `sql/10_create_report_organizations.sql` 파일 내용 복사
3. 붙여넣기 후 **"Run"** 클릭
4. 성공 메시지 확인: "Success. No rows returned"

#### Step 2: reports 테이블 수정

**파일**: `sql/11_make_reports_contact_id_nullable.sql`

**내용**:
- `reports.contact_id` 컬럼을 nullable로 변경
- 조직 리포트는 특정 연락처와 연결되지 않음

**실행**:
1. SQL Editor에서 "New Query" 클릭
2. `sql/11_make_reports_contact_id_nullable.sql` 파일 내용 복사
3. 붙여넣기 후 **"Run"** 클릭
4. 성공 메시지 확인

### 3. 실행 확인

#### 테이블 확인

```sql
-- report_organizations 테이블 존재 확인
SELECT * FROM report_organizations LIMIT 1;

-- report_prompt_settings 테이블 존재 확인
SELECT * FROM report_prompt_settings LIMIT 1;

-- reports 테이블 구조 확인
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'reports' 
  AND column_name = 'contact_id';
-- is_nullable이 'YES'여야 함
```

#### RLS 정책 확인

```sql
-- RLS 정책 확인
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('report_organizations', 'report_prompt_settings');
```

## 실행 순서 요약

```
1. sql/10_create_report_organizations.sql     ← 조직 관리 테이블
2. sql/11_make_reports_contact_id_nullable.sql ← reports 테이블 수정
```

## 문제 해결

### 오류: relation "report_organizations" already exists

**해결**: 이미 실행되었습니다. 다음 단계로 진행하세요.

### 오류: column "contact_id" is in a primary key

**해결**: 이 오류가 발생하면 아래 SQL로 해결:

```sql
-- Primary key에서 제거 후 nullable로 변경
ALTER TABLE public.reports 
  ALTER COLUMN contact_id DROP NOT NULL;
```

### 406 Not Acceptable 오류

**원인**: 테이블이 아직 생성되지 않음

**해결**: `sql/10_create_report_organizations.sql` 실행

### 23503 Foreign Key Constraint 오류

**원인**: `reports.contact_id`가 NOT NULL이고 유효한 contact ID 필요

**해결**: `sql/11_make_reports_contact_id_nullable.sql` 실행

## 마이그레이션 후

마이그레이션 완료 후:
1. 개발 서버 재시작 (이미 실행 중이면 그대로 사용)
2. 애플리케이션에서 "리포트 설정" 메뉴 접근 테스트
3. 조직 추가 테스트
4. 리포트 생성 테스트

## 롤백 (필요시)

마이그레이션을 되돌리려면:

```sql
-- 테이블 삭제
DROP TABLE IF EXISTS report_organizations CASCADE;
DROP TABLE IF EXISTS report_prompt_settings CASCADE;

-- reports 테이블 원복 (신중하게!)
ALTER TABLE public.reports 
  ALTER COLUMN contact_id SET NOT NULL;
```

⚠️ **주의**: 롤백 시 기존 조직 리포트 데이터가 삭제될 수 있습니다.
