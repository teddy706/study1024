# 🚀 Supabase 빠른 시작 가이드

이 가이드는 CLI 없이 Supabase 대시보드만으로 프로젝트를 설정하는 방법을 안내합니다.

---

## 📋 체크리스트

- [ ] Supabase 프로젝트 생성
- [ ] API 키 설정
- [ ] 데이터베이스 스키마 생성
- [ ] RPC 함수 생성
- [ ] 사용자 생성
- [ ] 테스트 데이터 입력

---

## 1️⃣ Supabase 프로젝트 생성

1. https://supabase.com 접속 후 로그인
2. **"New Project"** 클릭
3. 프로젝트 정보 입력:
   - **Organization**: 기존 조직 선택 또는 새로 생성
   - **Name**: `study1024` (또는 원하는 이름)
   - **Database Password**: 강력한 비밀번호 (예: Study1024@Pass!)
   - **Region**: `Northeast Asia (Seoul)` 선택
   - **Pricing Plan**: Free (무료) 선택
4. **"Create new project"** 클릭
5. ⏳ 프로젝트 생성 대기 (약 2분)

---

## 2️⃣ API 키 가져오기

프로젝트가 준비되면:

1. 왼쪽 사이드바 아래 **Settings** ⚙️ 클릭
2. **API** 메뉴 선택
3. 다음 정보를 복사:
   - **Project URL** (예: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public** 키 (매우 긴 문자열)

4. 프로젝트의 `.env` 파일을 열어서 붙여넣기:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co     # ← Project URL
VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...      # ← anon public 키
```

5. 파일 저장 후 개발 서버 재시작:
```powershell
npm run dev
```

---

## 3️⃣ 데이터베이스 스키마 생성

### Step 1: SQL Editor 열기

1. Supabase 대시보드 왼쪽 사이드바에서 **SQL Editor** 클릭
2. **"New query"** 버튼 클릭

### Step 2: 스키마 생성

1. `sql/01_schema.sql` 파일을 VS Code에서 열기
2. 전체 내용 복사 (Ctrl+A, Ctrl+C)
3. SQL Editor에 붙여넣기 (Ctrl+V)
4. **"Run"** 버튼 클릭 (또는 Ctrl+Enter)
5. ✅ 성공 메시지 확인

**생성되는 테이블:**
- contacts (연락처)
- reports (보고서)
- calls (통화 기록)
- actions (액션 아이템)
- smalltalk_cache (스몰토크 캐시)
- notifications (알림)

### Step 3: RPC 함수 생성

1. **"New query"** 버튼 클릭 (새 쿼리 생성)
2. `sql/02_functions.sql` 파일 내용 복사
3. SQL Editor에 붙여넣기
4. **"Run"** 클릭
5. ✅ 성공 메시지 확인

---

## 4️⃣ 테스트 사용자 생성

테스트 데이터를 입력하려면 먼저 사용자가 필요합니다.

1. 왼쪽 사이드바에서 **Authentication** 클릭
2. **Users** 탭 선택
3. **"Add user"** 버튼 클릭
4. **"Create new user"** 선택
5. 정보 입력:
   - **Email**: `test@example.com`
   - **Password**: `Test1234!` (또는 원하는 비밀번호)
   - **Auto Confirm User**: ✅ 체크
6. **"Create user"** 클릭
7. 생성된 사용자의 **UUID** 복사 (예: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

---

## 5️⃣ 테스트 데이터 입력 (선택사항)

### Step 1: UUID 입력

1. `sql/03_seed_data.sql` 파일을 VS Code에서 열기
2. **25번째 줄**을 찾아 수정:

```sql
-- 수정 전:
v_user_id := '00000000-0000-0000-0000-000000000000'::UUID;

-- 수정 후: (위에서 복사한 UUID 붙여넣기)
v_user_id := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::UUID;
```

3. 파일 저장 (Ctrl+S)

### Step 2: SQL 실행

1. SQL Editor에서 **"New query"** 클릭
2. 수정한 `03_seed_data.sql` 파일 전체 복사
3. SQL Editor에 붙여넣기
4. **"Run"** 클릭
5. ✅ 생성된 데이터 개수 확인

**생성되는 테스트 데이터:**
- 연락처 6건
- 리포트 5건
- 통화 기록 5건
- 액션 아이템 7건
- 스몰토크 6건
- 알림 5건

---

## 6️⃣ 연결 확인

브라우저에서 http://localhost:5173/study1024/ 접속

### 확인 사항:
- ✅ 페이지가 로드됨
- ✅ 대시보드에 통계 표시 (연락처, 리포트 등)
- ✅ 연락처 목록 표시 (테스트 데이터를 입력한 경우)
- ✅ 브라우저 콘솔(F12)에 에러 없음

---

## 🎯 Edge Functions 배포 (AI 스몰토크 기능용)

AI로 스몰토크를 생성하려면 Edge Functions를 배포해야 합니다.

### Supabase 대시보드에서 배포:

1. 왼쪽 사이드바에서 **Edge Functions** 클릭
2. **"Deploy new function"** 클릭
3. 함수 정보 입력:
   - **Name**: `generate-contact-smalltalk`
   - **Code**: `supabase/functions/generate-contact-smalltalk/index.ts` 파일 내용 붙여넣기
4. **"Deploy function"** 클릭

### OpenAI API 키 설정:

1. **Edge Functions** → **Secrets** 탭
2. **"New secret"** 클릭
3. 정보 입력:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: 실제 OpenAI API 키
4. **"Save"** 클릭

---

## 🆘 문제 해결

### 페이지가 로드되지 않음
- `.env` 파일의 URL과 키가 정확한지 확인
- 개발 서버 재시작 (터미널에서 Ctrl+C 후 `npm run dev`)

### 데이터가 표시되지 않음
- 테스트 데이터를 입력했는지 확인
- 브라우저 콘솔(F12)에서 에러 메시지 확인
- SQL Editor에서 `SELECT * FROM contacts;` 실행하여 데이터 확인

### RLS (Row Level Security) 에러
- 사용자가 생성되었는지 확인
- 테스트 데이터의 user_id가 올바른지 확인
- 필요시 RLS 정책을 임시로 비활성화:
  ```sql
  ALTER TABLE public.contacts DISABLE ROW LEVEL SECURITY;
  ```

### Edge Functions 에러
- Secrets에 OPENAI_API_KEY가 설정되었는지 확인
- 함수 로그 확인 (Edge Functions → 함수 선택 → Logs)

---

## 📚 추가 리소스

- [Supabase 공식 문서](https://supabase.com/docs)
- [프로젝트 배포 가이드](./DEPLOYMENT.md)
- [SQL 스키마 설명](../sql/README.md)

---

## ✅ 완료!

이제 모든 설정이 완료되었습니다! 

다음 작업:
1. ✨ 고객 카드에서 "AI 스몰토크 생성" 버튼 테스트
2. 📞 통화 녹음 및 자동 요약 기능 테스트
3. 📊 대시보드 통계 확인

**Happy coding! 🚀**
