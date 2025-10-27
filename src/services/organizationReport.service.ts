import { supabase } from '../config/supabase'
import { AIService } from './ai.service'

export class OrganizationReportService {
  private aiService: AIService

  constructor() {
    this.aiService = new AIService()
  }
  /**
   * 사용자의 관심 조직 목록 가져오기
   */
  async getOrganizations() {
    const { data, error } = await supabase
      .from('report_organizations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * 연락처에 등록된 모든 회사 목록 가져오기
   */
  async getContactCompanies() {
    const { data, error } = await supabase
      .from('contacts')
      .select('company')
      .order('company', { ascending: true })

    if (error) throw error

    // 중복 제거
    const uniqueCompanies = Array.from(
      new Set((data || []).map((c: { company: string }) => c.company).filter(Boolean))
    )

    return uniqueCompanies
  }

  /**
   * 사용자의 프롬프트 템플릿 가져오기
   */
  async getPromptTemplate() {
    const { data, error } = await supabase
      .from('report_prompt_settings')
      .select('prompt_template')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // 설정이 없으면 기본 템플릿 반환
        return this.getDefaultPromptTemplate()
      }
      throw error
    }

    return data.prompt_template
  }

  /**
   * 기본 프롬프트 템플릿
   */
  getDefaultPromptTemplate() {
    return `다음 조직들의 최근 동향을 분석하여 간결한 리포트를 작성해주세요:

조직 목록:
{organizations}

각 조직에 대해:
1. 최근 1개월 이내의 주요 뉴스나 이벤트
2. 사업 확장, 신제품 출시, 인사 변동 등의 중요 변화
3. 비즈니스 관계에 영향을 줄 수 있는 이슈

리포트 형식:
- 조직별로 구분하여 작성
- 각 항목은 2-3문장으로 간결하게 요약
- 출처나 날짜 정보 포함`
  }

  /**
   * 최신 동향 리포트 생성
   */
  async generateOrganizationReport(): Promise<string> {
    try {
      // 1. 관심 조직 목록 가져오기
      const organizations = await this.getOrganizations()
      
      // 2. 연락처 회사 목록 가져오기
      const contactCompanies = await this.getContactCompanies()

      // 3. 합치기 (중복 제거)
      const allOrganizations = Array.from(
        new Set([
          ...organizations.map((org: { name: string }) => org.name),
          ...contactCompanies,
        ])
      )

      if (allOrganizations.length === 0) {
        throw new Error('조직이 등록되어 있지 않습니다. 먼저 관심 조직을 등록하거나 연락처를 추가해주세요.')
      }

      // 4. 프롬프트 템플릿 가져오기
      const promptTemplate = await this.getPromptTemplate()

      // 5. 조직 목록을 프롬프트에 삽입
      const organizationList = allOrganizations
        .map((org, index) => `${index + 1}. ${org}`)
        .join('\n')

      const today = new Date().toISOString().slice(0, 10) // '2025-10-27'
      const prompt = `오늘 날짜는 ${today}입니다. ${promptTemplate.replace('{organizations}', organizationList)}`

      console.log('생성된 프롬프트:', prompt)
      console.log('조직 목록:', allOrganizations)

      // 6. AI 리포트 생성
      try {
        const report = await this.aiService.generateOrganizationReport(prompt)
        console.log('✅ AI 리포트 생성 완료')
        return report
      } catch (aiError) {
        console.error('⚠️ AI 리포트 생성 실패, 프롬프트 반환:', aiError)
        // AI 실패 시 프롬프트 반환 (fallback)
        return `[AI 리포트 생성 실패 - 프롬프트 미리보기]\n\n${prompt}`
      }
    } catch (error) {
      console.error('리포트 생성 실패:', error)
      throw error
    }
  }

  /**
   * 리포트를 데이터베이스에 저장
   */
  async saveReport(content: string) {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('로그인이 필요합니다.')

      // reports 테이블에 저장 (contact_id는 null - 조직 리포트)
      const { data, error } = await supabase
        .from('reports')
        .insert({
          contact_id: null, // 조직 리포트는 특정 연락처와 연결되지 않음
          type: 'organization_trends',
          content: content,
          user_id: userData.user.id,
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('리포트 저장 실패:', error)
      throw error
    }
  }
}

export default new OrganizationReportService()
