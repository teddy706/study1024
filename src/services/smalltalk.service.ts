import { supabase } from '../config/supabase'

type GenItem = { topic: string; content: string; expire_days?: number }

export class SmalltalkService {
  constructor() {}

  async generateFromSummary(summary: string, contactId: string): Promise<number> {
    // 서버 측 Edge Function 호출로 OpenAI 키 노출 방지
    const { data, error } = await supabase.functions.invoke('generate-smalltalk', {
      body: { summary, contactId },
    })

    if (error) throw error
    return Number(data?.count ?? 0)
  }

  /**
   * 고객 정보를 기반으로 AI가 스몰토크 소재를 생성
   * @param contactId 고객 ID
   * @returns 생성된 스몰토크 아이템 개수
   */
  async generateFromContactInfo(contactId: string): Promise<number> {
    // 현재 로그인 사용자 확인 (RLS 일치 보장)
    const { data: authData, error: authErr } = await supabase.auth.getUser()
    if (authErr || !authData?.user) {
      console.error('❌ 인증 확인 실패:', authErr)
      throw new Error('로그인이 필요합니다.')
    }

    const userId = authData.user.id

    // Edge Function 호출 시 userId 함께 전달 → 함수가 user_id로 저장
    const { data, error } = await supabase.functions.invoke('generate-contact-smalltalk', {
      body: { contactId, userId },
    })
    
    if (error) {
      console.error('❌ Edge Function 호출 실패:', error)
      throw error
    }
    
    console.log('✅ 스몰토크 생성 성공:', data)
    return Number(data?.count ?? 0)
  }
}

export default SmalltalkService
