import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BusinessCardData {
  name: string
  company: string
  position: string
  phone: string
  mobile: string
  office_phone: string
  fax: string
  email: string
  address: string
  business_card_image_url?: string
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Authorization 체크
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('❌ Missing authorization header')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing authorization header',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }

    console.log('🔑 Auth header present:', authHeader.substring(0, 20) + '...')

    // Supabase 클라이언트 생성 - Authorization 헤더를 올바르게 전달
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    })

    // JWT 토큰에서 직접 사용자 정보 가져오기
    const token = authHeader.replace('Bearer ', '')
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token)
    
    console.log('👤 User check:', { hasUser: !!user, userId: user?.id, userError: userError?.message })
    
    if (userError || !user) {
      console.error('❌ User authentication failed:', userError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized: ' + (userError?.message || 'Invalid token'),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }

    const { imageBase64 } = await req.json()

    if (!imageBase64) {
      throw new Error('Missing image data')
    }

    // Google Cloud Vision API 호출
    const visionApiKey = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY')
    if (!visionApiKey) {
      throw new Error('Google Cloud Vision API key not configured')
    }

    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: imageBase64,
              },
              features: [
                {
                  type: 'TEXT_DETECTION',
                  maxResults: 1,
                },
              ],
            },
          ],
        }),
      }
    )

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text()
      throw new Error(`Vision API error: ${errorText}`)
    }

    const visionData = await visionResponse.json()
    const textAnnotations = visionData.responses[0]?.textAnnotations

    if (!textAnnotations || textAnnotations.length === 0) {
      throw new Error('No text detected in image')
    }

    // 전체 텍스트 추출
    const extractedText = textAnnotations[0].description
    console.log('Extracted text:', extractedText)

    // 명함 정보 파싱
    const contactData = parseBusinessCard(extractedText)

    // OCR 결과만 반환 (DB 저장은 프론트엔드에서 처리)
    return new Response(
      JSON.stringify({
        success: true,
        contactData,
        extractedText, // 디버깅용
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

/**
 * 명함 텍스트에서 연락처 정보 추출
 */
function parseBusinessCard(text: string): Omit<BusinessCardData, 'user_id'> {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)

  // 이메일 추출
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
  const emailMatch = text.match(emailRegex)
  const email = emailMatch ? emailMatch[0] : ''

  // 전화번호 추출 및 분류 (한국 전화번호 패턴)
  let mobile = ''
  let office_phone = ''
  let fax = ''
  let phone = '' // 레거시 필드 (하위 호환성)
  
  // 모든 전화번호 찾기
  const phoneRegex = /(\+?82[-\s]?)?0?1[0-9][-\s]?\d{3,4}[-\s]?\d{4}|0\d{1,2}[-\s]?\d{3,4}[-\s]?\d{4}/g
  const allPhones = text.match(phoneRegex) || []
  
  // 팩스 키워드 찾기
  const faxKeywords = ['fax', 'FAX', 'Fax', '팩스', 'F.', 'f.']
  const faxLines = lines.filter(line => 
    faxKeywords.some(keyword => line.includes(keyword))
  )
  
  // 각 번호를 분류
  for (const phoneNum of allPhones) {
    const normalized = phoneNum.replace(/\s+/g, '-')
    
    // 팩스 번호 확인 (팩스 키워드가 있는 줄에 포함된 번호)
    const isFax = faxLines.some(line => line.includes(phoneNum))
    
    if (isFax && !fax) {
      fax = normalized
    }
    // 휴대폰 번호 (010, 011, 016, 017, 018, 019로 시작)
    else if (/^(\+?82[-\s]?)?0?1[0-9]/.test(phoneNum) && !mobile) {
      mobile = normalized
    }
    // 일반 전화번호 (02, 031, 032 등 지역번호)
    else if (!office_phone) {
      office_phone = normalized
    }
  }
  
  // 레거시 phone 필드는 휴대폰 우선, 없으면 사무실 번호
  phone = mobile || office_phone

  // 회사명/직책/이름 추출 (휴리스틱 기반)
  let name = ''
  let company = ''
  let position = ''
  let address = ''

  // 조직명 키워드 (회사, 학교, 관공서 등)
  const organizationKeywords = [
    // 회사 관련
    '주식회사', '(주)', '유한회사', '(유)', '합자회사', '합명회사',
    'Co.', 'Ltd.', 'Inc.', 'Corp.', 'Corporation', 'Company',
    '회사', '기업', '그룹', 'Group', '법인',
    
    // 연구/개발
    '연구소', '연구원', '센터', 'Center', 'Institute', 'Lab', 'Laboratory',
    '기술원', '개발원',
    
    // 학교 관련
    '대학교', '대학', 'University', '학교', 'School', 'College',
    '초등학교', '중학교', '고등학교', '유치원',
    
    // 관공서/기관
    '청', '부', '처', '위원회', '공단', '공사', '재단', 'Foundation',
    '협회', '조합', '연합회', '학회', 'Association', 'Society',
    '병원', 'Hospital', '의원', 'Clinic',
    
    // 기타 조직
    '사무소', 'Office', '지점', 'Branch', '본점', '본부', 'Headquarters',
    '스튜디오', 'Studio', '갤러리', 'Gallery'
  ]
  
  // 직책 키워드 (더 상세하게)
  const positionKeywords = [
    // 최고경영진
    '대표', '대표이사', '회장', '부회장', '사장', '부사장', '총장', '부총장',
    'CEO', 'CTO', 'CFO', 'COO', 'CIO', 'CMO', 'CPO',
    'President', 'Vice President', 'VP',
    
    // 임원
    '이사', '전무', '전무이사', '상무', '상무이사', '이사회',
    'Director', 'Executive', 'Managing Director',
    
    // 관리직
    '실장', '본부장', '부장', '차장', '과장', '팀장', '부팀장',
    'Manager', 'General Manager', 'Senior Manager',
    'Head', 'Lead', 'Chief',
    
    // 일반직
    '주임', '대리', '사원', '주사', '주사보',
    'Staff', 'Associate', 'Specialist', 'Coordinator',
    
    // 교육/연구직
    '교수', '부교수', '조교수', '연구원', '연구교수', '객원교수',
    'Professor', 'Researcher', 'Scientist',
    
    // 기타
    '팀원', '파트너', 'Partner', '원장', '소장', '국장'
  ]
  
  // 주소 키워드 (구체적인 주소 패턴만 매칭)
  const addressKeywords = [
    '서울특별시', '서울시', '서울',
    '부산광역시', '부산시', '부산',
    '대구광역시', '대구시', '대구',
    '인천광역시', '인천시', '인천',
    '광주광역시', '광주시', '광주',
    '대전광역시', '대전시', '대전',
    '울산광역시', '울산시', '울산',
    '세종특별자치시', '세종시', '세종',
    '경기도', '강원도', '충청북도', '충청남도', '전라북도', '전라남도', '경상북도', '경상남도', '제주특별자치도'
  ]
  
  // 한국 성씨 (2자 이하인 경우가 많음)
  const koreanSurnames = [
    '김', '이', '박', '최', '정', '강', '조', '윤', '장', '임',
    '한', '오', '서', '신', '권', '황', '안', '송', '류', '전',
    '홍', '고', '문', '양', '손', '배', '백', '허', '유', '남',
    '심', '노', '하', '곽', '성', '차', '주', '우', '구', '민',
    '선우', '남궁', '독고', '황보', '제갈', '사공', '선우'
  ]
  
  // 각 라인을 분류
  const usedLines = new Set<number>()

  // 1. 회사/조직명 추출 (우선순위 높음)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (organizationKeywords.some(keyword => line.includes(keyword))) {
      company = line
      usedLines.add(i)
      break
    }
  }

  // 2. 직책 추출
  for (let i = 0; i < lines.length; i++) {
    if (usedLines.has(i)) continue
    const line = lines[i]
    if (positionKeywords.some(keyword => line.includes(keyword))) {
      position = line
      usedLines.add(i)
      break
    }
  }

  // 3. 주소 추출 (긴 텍스트이고 주소 키워드 포함)
  for (let i = 0; i < lines.length; i++) {
    if (usedLines.has(i)) continue
    const line = lines[i]
    if (line.length > 15 && addressKeywords.some(keyword => line.includes(keyword))) {
      address = line
      usedLines.add(i)
      break
    }
  }

  // 4. 이름 추출 (더 정교한 로직)
  for (let i = 0; i < lines.length; i++) {
    if (usedLines.has(i)) continue
    const line = lines[i]
    
    // 이름 제외 조건 (조직명이나 직책일 가능성)
    const isOrganization = organizationKeywords.some(keyword => line.includes(keyword))
    const isPosition = positionKeywords.some(keyword => line.includes(keyword))
    const isEmail = emailRegex.test(line)
    const isPhone = phoneRegex.test(line)
    const hasNumbers = /\d/.test(line)
    const hasSpecialChars = /[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ]/.test(line.replace(/[().\-,&]/, ''))
    
    // 이름 포함 조건
    const hasKoreanSurname = koreanSurnames.some(surname => line.startsWith(surname))
    const isShortText = line.length >= 2 && line.length <= 6
    const isKoreanOrEnglish = /^[가-힣a-zA-Z\s]+$/.test(line)
    
    // 점수 기반 판단 (높을수록 이름일 가능성 높음)
    let nameScore = 0
    
    if (hasKoreanSurname) nameScore += 5
    if (isShortText) nameScore += 3
    if (isKoreanOrEnglish) nameScore += 2
    if (i === 0) nameScore += 2 // 첫 줄은 이름일 가능성 높음
    
    if (isOrganization) nameScore -= 10
    if (isPosition) nameScore -= 10
    if (isEmail) nameScore -= 10
    if (isPhone) nameScore -= 10
    if (hasNumbers) nameScore -= 3
    if (hasSpecialChars) nameScore -= 2
    if (line.length > 10) nameScore -= 3
    
    // 이름으로 판단
    if (nameScore >= 3) {
      name = line
      usedLines.add(i)
      break
    }
  }
  
  // 5. 이름을 못 찾았다면, 가장 짧고 한글/영문으로만 된 줄 선택
  if (!name) {
    let bestCandidate = ''
    let bestScore = -100
    
    for (let i = 0; i < lines.length; i++) {
      if (usedLines.has(i)) continue
      const line = lines[i]
      
      if (line.length >= 2 && line.length <= 10 &&
          /^[가-힣a-zA-Z\s]+$/.test(line) &&
          !organizationKeywords.some(k => line.includes(k)) &&
          !positionKeywords.some(k => line.includes(k))) {
        
        const score = (10 - line.length) + (i === 0 ? 5 : 0)
        if (score > bestScore) {
          bestScore = score
          bestCandidate = line
        }
      }
    }
    
    if (bestCandidate) {
      name = bestCandidate
    }
  }

  console.log('Parsed data:', { name, company, position, phone, mobile, office_phone, fax, email, address })

  return {
    name: name || '',
    company: company || '',
    position: position || '',
    phone: phone,
    mobile: mobile,
    office_phone: office_phone,
    fax: fax,
    email: email,
    address: address,
  }
}
