# Edge Function 배포 가이드

## generate-contact-smalltalk 함수 배포하기

### 방법 1: Supabase CLI 사용 (권장)

```powershell
# 1. Supabase 로그인
supabase login

# 2. 프로젝트 연결
supabase link --project-ref jvadwfxkkhcmndluxyzk

# 3. 함수 배포
supabase functions deploy generate-contact-smalltalk

# 4. Secret 설정
supabase secrets set OPENAI_API_KEY=your_openai_api_key_here
```

### 방법 2: Supabase Dashboard 사용

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard/project/jvadwfxkkhcmndluxyzk

2. **Edge Functions 메뉴로 이동**
   - 왼쪽 사이드바에서 "Edge Functions" 클릭

3. **새 함수 생성**
   - "Deploy a new function" 버튼 클릭
   - Function name: `generate-contact-smalltalk`
   - 아래 코드를 복사해서 붙여넣기

4. **코드 복사**
   - `supabase/functions/generate-contact-smalltalk/index.ts` 파일 내용 전체 복사
   - Dashboard의 코드 에디터에 붙여넣기

5. **Secrets 설정**
   - Settings → Edge Functions → Secrets
   - "Add new secret" 클릭
   - Name: `OPENAI_API_KEY`
   - Value: 실제 OpenAI API 키 입력
   - Save 클릭

6. **배포**
   - "Deploy function" 버튼 클릭
   - 배포 완료까지 약 30초 대기

## 배포 확인

배포가 완료되면 다음을 확인하세요:

1. **함수 목록에 표시되는지 확인**
   - Edge Functions 페이지에서 `generate-contact-smalltalk` 함수가 보이는지 확인

2. **함수 URL 확인**
   ```
   https://jvadwfxkkhcmndluxyzk.supabase.co/functions/v1/generate-contact-smalltalk
   ```

3. **테스트**
   - 앱에서 "AI 스몰토크 생성" 버튼 클릭
   - 브라우저 콘솔에서 `✅ 스몰토크 생성 성공` 메시지 확인

## 문제 해결

### "Function not found" 오류
- 함수가 제대로 배포되었는지 확인
- 함수 이름 철자 확인: `generate-contact-smalltalk`

### "OPENAI_API_KEY not found" 오류
- Secrets에 OPENAI_API_KEY가 설정되어 있는지 확인
- OpenAI API 키가 유효한지 확인

### CORS 오류
- Edge Function 코드에 CORS 헤더가 포함되어 있는지 확인
- 브라우저 캐시 클리어 후 재시도

## OpenAI API 키 발급

1. https://platform.openai.com/api-keys 접속
2. "Create new secret key" 클릭
3. 키 이름 입력 (예: "study1024-smalltalk")
4. 생성된 키를 안전하게 저장
5. Supabase Secrets에 설정
