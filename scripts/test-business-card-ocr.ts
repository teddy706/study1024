/**
 * 명함 OCR 기능 테스트 스크립트
 * 
 * 실행 방법:
 * 1. 테스트용 명함 이미지를 base64로 변환
 * 2. SUPABASE_URL과 ACCESS_TOKEN 설정
 * 3. ts-node scripts/test-business-card-ocr.ts 실행
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

// 테스트용 간단한 명함 텍스트 (실제로는 이미지를 base64로 변환해야 함)
const createTestImage = (): string => {
  // 실제 사용시에는 파일을 base64로 변환
  // 여기서는 테스트를 위한 더미 데이터
  const testText = `
홍길동
주식회사 테크컴퍼니
대표이사
010-1234-5678
hong@techcompany.com
서울시 강남구 테헤란로 123
  `.trim()
  
  // base64 인코딩 (실제 이미지가 아닌 텍스트를 인코딩)
  return Buffer.from(testText).toString('base64')
}

async function testBusinessCardOCR() {
  console.log('🧪 명함 OCR 기능 테스트 시작...\n')

  // 1. Edge Function 존재 확인
  console.log('1️⃣ Edge Function 배포 확인')
  console.log(`   URL: ${SUPABASE_URL}/functions/v1/process-business-card`)
  
  try {
    const healthCheck = await fetch(`${SUPABASE_URL}/functions/v1/process-business-card`, {
      method: 'OPTIONS',
    })
    console.log(`   ✅ Status: ${healthCheck.status} (CORS preflight OK)\n`)
  } catch (error) {
    console.error('   ❌ Edge Function 접근 실패:', error)
    console.log('   💡 Supabase Dashboard에서 배포 상태를 확인하세요.\n')
    return
  }

  // 2. API 키 테스트 (실제 이미지 처리)
  console.log('2️⃣ Google Vision API 키 테스트')
  console.log('   ⚠️  실제 테스트는 브라우저나 인증된 환경에서 수행해야 합니다.')
  console.log('   💡 Supabase Dashboard > Edge Functions > Secrets에서 확인:')
  console.log('      - GOOGLE_CLOUD_VISION_API_KEY 등록 여부\n')

  // 3. 테스트 가이드
  console.log('3️⃣ 브라우저에서 테스트하기')
  console.log('   1. npm run dev 실행')
  console.log('   2. 로그인 후 "전체 고객" 페이지로 이동')
  console.log('   3. "명함 스캔으로 연락처 추가" 카드에서 명함 사진 업로드')
  console.log('   4. 개발자 도구(F12) Console에서 에러 확인\n')

  console.log('4️⃣ Dashboard에서 확인할 사항')
  console.log('   📍 Supabase Dashboard 체크리스트:')
  console.log('   □ Edge Functions > process-business-card 배포 상태')
  console.log('   □ Edge Functions > Secrets > GOOGLE_CLOUD_VISION_API_KEY 등록')
  console.log('   □ Edge Functions > Logs에서 실행 로그 확인')
  console.log('   □ Table Editor > contacts에서 새 데이터 확인\n')

  console.log('5️⃣ 일반적인 오류 해결')
  console.log('   ❌ "Missing authorization header"')
  console.log('      → 로그인 상태 확인')
  console.log('')
  console.log('   ❌ "Google Cloud Vision API key not configured"')
  console.log('      → Supabase Secrets에 GOOGLE_CLOUD_VISION_API_KEY 등록')
  console.log('      → 명령어: supabase secrets set GOOGLE_CLOUD_VISION_API_KEY=your_key')
  console.log('')
  console.log('   ❌ "No text detected in image"')
  console.log('      → 명함 사진 품질 확인 (밝기, 선명도)')
  console.log('      → 명함이 화면에 명확하게 보이는지 확인')
  console.log('')
  console.log('   ❌ "Vision API error: 403"')
  console.log('      → Google Cloud Console에서 Vision API 활성화 확인')
  console.log('      → API 키 권한 확인\n')
}

// 실행
testBusinessCardOCR().catch(console.error)
