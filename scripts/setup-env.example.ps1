# n8n 워크플로우 테스트용 환경 변수 설정
# 
# 사용법:
#   1. 이 파일을 복사하여 setup-env.ps1로 저장
#   2. 아래 값을 실제 프로젝트 값으로 수정
#   3. PowerShell에서 실행: . .\scripts\setup-env.ps1
#
# 주의: setup-env.ps1은 .gitignore에 포함되어 있으므로 Git에 커밋되지 않습니다.

# Supabase 프로젝트 설정
$env:SUPABASE_URL = "https://xxx.supabase.co"
$env:SUPABASE_KEY = "eyJ..."   # anon 키 (Settings → API → anon public)

# OpenAI API 설정
$env:OPENAI_API_KEY = "sk-..."   # platform.openai.com에서 발급

Write-Host "✅ 환경 변수 설정 완료" -ForegroundColor Green
Write-Host ""
Write-Host "현재 설정된 값:" -ForegroundColor Cyan
Write-Host "  SUPABASE_URL    : $env:SUPABASE_URL" -ForegroundColor Gray
Write-Host "  SUPABASE_KEY    : $($env:SUPABASE_KEY.Substring(0, 20))..." -ForegroundColor Gray
Write-Host "  OPENAI_API_KEY  : $($env:OPENAI_API_KEY.Substring(0, 20))..." -ForegroundColor Gray
Write-Host ""
Write-Host "테스트 실행:" -ForegroundColor Yellow
Write-Host "  node .\scripts\test-n8n-flow.js --days 7 --limit 3" -ForegroundColor White
Write-Host "  node .\scripts\test-n8n-flow.js --debug --limit 1  # 디버그 모드" -ForegroundColor White
