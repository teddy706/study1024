# SQL 마이그레이션 가이드

이 폴더는 Supabase 데이터베이스 스키마 및 초기 데이터 설정을 위한 SQL 파일을 포함합니다.

## 📋 파일 구조

### 필수 파일 (순서대로 실행)

1. **`01_schema.sql`** - 데이터베이스 스키마 생성
   - 테이블 생성 (contacts, reports, calls, actions, smalltalk_cache, notifications)
   - 인덱스 생성 (성능 최적화)
   - Row Level Security (RLS) 정책 설정

2. **`02_functions.sql`** - RPC 함수 및 헬퍼 함수
   - `get_dashboard_counts()` - 대시보드 통계
   - `get_companies()` - 회사 목록
   - `get_recent_calls_for_smalltalk()` - 스몰토크 생성용 데이터
   - `insert_smalltalk_items()` - 스몰토크 일괄 삽입
   - `cleanup_expired_smalltalk()` - 만료된 스몰토크 삭제

3. **`03_seed_data.sql`** - 테스트 데이터 시드 (선택 사항)
   - 샘플 연락처, 리포트, 통화 기록, 액션 아이템 생성
   - 개발/테스트 환경에서만 사용

### 참고 파일 (레거시)

- `supabase_functions.sql` - 구버전 함수 (01_schema.sql과 02_functions.sql로 통합됨)
- `daily_smalltalk_rpc.sql` - 스몰토크 생성 함수 (02_functions.sql에 포함됨)
- `schedule_daily_smalltalk.sql` - Cron 설정 (별도 설정 필요)
- `insert_test_data.sql` - 구버전 시드 데이터 (03_seed_data.sql로 개선됨)

## 🚀 실행 방법

### 1. Supabase SQL Editor에서 실행

1. Supabase 대시보드 접속
2. **SQL Editor** 메뉴로 이동
3. **New query** 버튼 클릭
4. 각 파일의 내용을 복사하여 붙여넣기
5. **Run** 버튼으로 실행

### 2. 순서대로 실행

```sql
-- 1단계: 스키마 생성
-- 01_schema.sql 실행

-- 2단계: 함수 생성
-- 02_functions.sql 실행

-- 3단계: 테스트 데이터 (선택 사항)
-- 03_seed_data.sql 실행
```

### 3. Supabase CLI 사용 (고급)

```bash
# 로그인
supabase login

# 프로젝트 연결
supabase link --project-ref your-project-id

# 마이그레이션 실행
supabase db push

# 또는 개별 파일 실행
psql -h db.xxx.supabase.co -U postgres -d postgres -f sql/01_schema.sql
```

## ⚠️ 주의사항

### 테스트 데이터 시드 (03_seed_data.sql)

- **개발/테스트 환경에서만 사용하세요!**
- SQL Editor에서 실행 시 `auth.uid()`가 `NULL`이므로 데이터가 생성되지 않습니다.
- 해결 방법:
  1. 프론트엔드에서 로그인 후 실행
  2. 또는 스크립트 내 `v_user_id` 변수를 실제 사용자 UUID로 수정

### RLS (Row Level Security)

- 모든 테이블에 RLS가 활성화되어 있습니다
- 사용자는 자신의 데이터만 조회/수정 가능합니다
- 테스트 시 인증된 사용자로 로그인 필요

### 인덱스

- 성능 최적화를 위한 인덱스가 자동 생성됩니다
- 데이터가 많을 경우 인덱스 생성에 시간이 걸릴 수 있습니다

## 🔄 마이그레이션 롤백

스키마를 초기화하려면:

```sql
-- 테이블 삭제 (순서 중요 - 외래 키 제약 조건 때문)
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.smalltalk_cache CASCADE;
DROP TABLE IF EXISTS public.actions CASCADE;
DROP TABLE IF EXISTS public.calls CASCADE;
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.contacts CASCADE;

-- 함수 삭제
DROP FUNCTION IF EXISTS public.get_dashboard_counts CASCADE;
DROP FUNCTION IF EXISTS public.get_companies CASCADE;
DROP FUNCTION IF EXISTS public.get_recent_calls_for_smalltalk CASCADE;
DROP FUNCTION IF EXISTS public.insert_smalltalk_items CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_expired_smalltalk CASCADE;
```

## 📝 스키마 다이어그램

```
contacts (연락처)
├── id (PK)
├── name, company, position
├── phone, email, address
├── last_contact
└── user_id (FK → auth.users)

reports (리포트)
├── id (PK)
├── contact_id (FK → contacts)
├── type, content
├── created_at
└── user_id (FK → auth.users)

calls (통화 기록)
├── id (PK)
├── contact_id (FK → contacts)
├── recording_url, summary, duration
├── called_at
└── user_id (FK → auth.users)

actions (액션 아이템)
├── id (PK)
├── contact_id (FK → contacts)
├── type, description, due_date, status
└── user_id (FK → auth.users)

smalltalk_cache (스몰토크)
├── id (PK)
├── contact_id (FK → contacts)
├── topic, content, expires_at
└── user_id (FK → auth.users)

notifications (알림)
├── id (PK)
├── type, title, message
├── userId (FK → auth.users)
├── read
└── created_at
```

## 🆘 문제 해결

### "permission denied" 오류

- Supabase 대시보드에서 SQL Editor는 기본적으로 `postgres` 역할로 실행됩니다
- RLS 정책으로 인해 데이터 접근이 제한될 수 있습니다
- 해결: `SECURITY DEFINER` 함수를 사용하거나 임시로 RLS 비활성화

### "already exists" 오류

- 테이블이나 함수가 이미 존재하는 경우 발생
- 해결: `IF NOT EXISTS` 또는 `CREATE OR REPLACE` 사용 (이미 적용됨)

### 시드 데이터가 생성되지 않음

- SQL Editor에서는 `auth.uid()`가 NULL입니다
- 해결:
  1. 프론트엔드에서 로그인 후 Supabase 클라이언트로 실행
  2. 또는 `v_user_id` 변수를 실제 UUID로 하드코딩

## 📚 추가 문서

- [Supabase SQL 문서](https://supabase.com/docs/guides/database)
- [PostgreSQL 공식 문서](https://www.postgresql.org/docs/)
- [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security)
