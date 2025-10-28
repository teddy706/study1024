// Node.js에서 실행할 수 있는 테스트 미팅 생성 스크립트
import { createClient } from '@supabase/supabase-js'

// 환경 변수에서 Supabase 설정 읽기
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.')
  console.log('다음 환경 변수를 설정해주세요:')
  console.log('- VITE_SUPABASE_URL')
  console.log('- VITE_SUPABASE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTestMeetings() {
  try {
    console.log('🔍 Supabase 연결 테스트 중...')
    
    // 먼저 contacts 테이블에서 사용 가능한 연락처 확인
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, name, user_id')
      .limit(1)

    if (contactsError) {
      console.error('❌ 연락처 조회 실패:', contactsError)
      return
    }

    if (!contacts || contacts.length === 0) {
      console.log('⚠️ 연락처가 없습니다. 먼저 연락처를 생성해주세요.')
      return
    }

    const contact = contacts[0]
    console.log(`📋 테스트 연락처: ${contact.name} (ID: ${contact.id})`)

    // 기존 미팅이 있는지 확인
    const { data: existingMeetings, error: checkError } = await supabase
      .from('meetings')
      .select('id')
      .eq('contact_id', contact.id)

    if (checkError) {
      console.error('❌ 기존 미팅 확인 실패:', checkError)
      return
    }

    console.log(`📝 기존 미팅 수: ${existingMeetings?.length || 0}`)

    // 테스트 미팅 데이터
    const meetings = [
      {
        contact_id: contact.id,
        memo: "프로젝트 킥오프 미팅\n\n새로운 웹 애플리케이션 개발 프로젝트를 시작하기로 했습니다. 다음주까지 요구사항 문서를 작성하고, 기술 스택을 최종 결정해야 합니다. UI/UX 디자인 시안도 2주 내에 완료하기로 했습니다.\n\n참석자: 개발팀, 기획팀, 디자인팀. 예산 승인 완료. 프로젝트 기간 3개월 예상.",
        met_at: new Date(Date.now() - (1 * 24 * 60 * 60 * 1000)).toISOString() // 1일 전
      },
      {
        contact_id: contact.id,
        memo: "월간 실적 검토 회의\n\n지난달 매출이 목표 대비 15% 초과 달성했습니다. 신규 고객 유치 전략이 효과적이었습니다. 다음달에는 기존 고객 관리에 더 집중하기로 했습니다. 고객 만족도 조사를 실시하고 피드백을 수집해야 합니다.\n\n매출 증가 요인: 온라인 마케팅 강화, 제품 품질 개선. 다음 액션: 고객 서비스 교육 실시",
        met_at: new Date(Date.now() - (3 * 24 * 60 * 60 * 1000)).toISOString() // 3일 전
      },
      {
        contact_id: contact.id,
        memo: "시스템 업그레이드 논의\n\n현재 시스템의 성능 한계로 인해 업그레이드가 필요합니다. 클라우드 전환을 검토하고 있으며, 보안 강화도 함께 진행해야 합니다. 데이터 마이그레이션 계획을 수립하고 백업 전략을 마련해야 합니다.\n\n예상 비용: 500만원, 작업 기간: 2개월, 다운타임 최소화 방안 필요",
        met_at: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)).toISOString() // 1주일 전
      }
    ]

    console.log('💾 테스트 미팅 데이터 삽입 중...')
    
    const { data: insertedMeetings, error: insertError } = await supabase
      .from('meetings')
      .insert(meetings)
      .select()

    if (insertError) {
      console.error('❌ 미팅 삽입 실패:', insertError)
      return
    }

    console.log(`✅ ${insertedMeetings?.length || 0}개의 테스트 미팅이 생성되었습니다!`)
    
    // 생성된 미팅들 확인
    insertedMeetings?.forEach((meeting, index) => {
      console.log(`  ${index + 1}. ID: ${meeting.id}, 날짜: ${new Date(meeting.met_at).toLocaleDateString()}`)
    })

    // 최종 확인: 해당 연락처의 모든 미팅 조회
    const { data: allMeetings, error: verifyError } = await supabase
      .from('meetings')
      .select('id, met_at, memo')
      .eq('contact_id', contact.id)
      .order('met_at', { ascending: false })

    if (verifyError) {
      console.error('❌ 미팅 확인 실패:', verifyError)
      return
    }

    console.log(`\n🎉 최종 확인: 연락처 "${contact.name}"의 총 미팅 수: ${allMeetings?.length || 0}`)
    
  } catch (error) {
    console.error('💥 오류 발생:', error)
  }
}

// 스크립트 실행
createTestMeetings()