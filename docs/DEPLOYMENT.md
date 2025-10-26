# GitHub Pages 배포 가이드

## 1단계: GitHub Secrets 설정

GitHub 리포지토리에서 환경 변수를 설정해야 합니다:

1. GitHub 리포지토리 페이지로 이동
2. **Settings** → **Secrets and variables** → **Actions** 클릭
3. **New repository secret** 버튼으로 다음 시크릿 추가:

```
VITE_SUPABASE_URL = https://jvadwfxkkhcmndluxyzk.supabase.co
VITE_SUPABASE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YWR3Znhra2hjbW5kbHV4eXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMTE5ODIsImV4cCI6MjA3Njg4Nzk4Mn0.D3Qy0FKqQsxrluu0KGLvc4ZTjmrc73s1wmv8kckFZOk
VITE_OPENAI_API_KEY = (OpenAI API 키)
VITE_GOOGLE_VISION_API_KEY = (Google Vision API 키)
VITE_APIFY_TOKEN = (Apify 토큰)
VITE_SLACK_WEBHOOK_URL = (Slack Webhook URL)
```

## 2단계: GitHub Pages 활성화

1. 리포지토리 **Settings** → **Pages** 이동
2. **Source**를 **GitHub Actions**로 선택
3. 저장

## 3단계: 코드 푸시

```powershell
git add .
git commit -m "Add GitHub Pages deployment"
git push origin main
```

푸시하면 자동으로:
- GitHub Actions가 빌드 실행
- dist 폴더 생성
- GitHub Pages에 배포

## 4단계: 배포 확인

1. **Actions** 탭에서 워크플로우 진행 상황 확인
2. 완료되면 https://teddy706.github.io/study1024/ 에서 접속 가능

## 주의사항

⚠️ **보안 경고**: 
- OpenAI API 키 등 민감한 키는 브라우저에 노출됩니다
- 실서비스에서는 서버/Edge Functions로 API 호출을 프록시해야 합니다
- Supabase anon key는 공개되어도 RLS로 보호되므로 안전합니다

## 문제 해결

### 빌드 실패 시
- Actions 탭에서 로그 확인
- Secrets가 올바르게 설정되었는지 확인

### 페이지가 404 에러
- Settings → Pages에서 Source가 "GitHub Actions"인지 확인
- vite.config.ts의 base 경로가 '/study1024/'인지 확인

### 라우팅 문제 (새로고침 시 404)
- GitHub Pages는 SPA 라우팅을 지원하지 않음
- 해결: dist/404.html을 index.html로 복사하거나 hash routing 사용
