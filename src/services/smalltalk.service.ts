import { supabase } from '../config/supabase'
import { productService } from './product.service'

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
   * 고객 정보를 기반으로 AI가 스몰토크 소재를 생성 (상품 추천 포함)
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

    // 고객 정보 조회
    const { data: contact, error: contactError } = await (supabase as any)
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single()

    if (contactError || !contact) {
      console.error('❌ 고객 정보 조회 실패:', contactError)
      throw new Error('고객 정보를 찾을 수 없습니다.')
    }

    // 고객 관심사 기반 상품 추천 조회
    let recommendedProducts: any[] = []
    try {
      recommendedProducts = await productService.getRecommendedProducts(contact.interests || '', 2)
      console.log('✅ 추천 상품 조회 성공:', recommendedProducts.length, '개')
    } catch (error) {
      console.warn('⚠️ 상품 추천 조회 실패, 계속 진행:', error)
    }

    // Edge Function 호출 시 고객 정보와 추천 상품 함께 전달
    const { data, error } = await supabase.functions.invoke('generate-contact-smalltalk', {
      body: { 
        contactId, 
        userId,
        contact: {
          name: contact.name,
          company: contact.company,
          position: contact.position,
          interests: contact.interests
        },
        recommendedProducts: recommendedProducts.map(p => ({
          name: p.name,
          description: p.description,
          category: p.category,
          sales_pitch: p.sales_pitch,
          price: p.price,
          currency: p.currency
        }))
      },
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
