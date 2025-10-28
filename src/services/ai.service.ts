// AI 리포트 생성 서비스
// OpenAI API를 사용하여 기업동향 리포트 생성

export class AIService {
  private apiKey: string
  private apiUrl = 'https://api.openai.com/v1/chat/completions'

  constructor() {
    // 환경변수에서 OpenAI API 키 가져오기
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || ''
    
    if (!this.apiKey) {
      console.warn('⚠️ VITE_OPENAI_API_KEY가 설정되지 않았습니다.')
    }
  }

  /**
   * OpenAI GPT 모델을 사용하여 텍스트 생성
   * @param prompt 프롬프트 텍스트
   * @param model 사용할 모델 (기본값: gpt-4o)
   * @returns AI가 생성한 텍스트
   */
  async generateText(prompt: string, model = 'gpt-4o'): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API 키가 설정되지 않았습니다. .env 파일에 VITE_OPENAI_API_KEY를 추가해주세요.')
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: '당신은 비즈니스 인텔리전스 분석가입니다. 기업, 관공서, 대학의 최신 동향을 분석하여 간결하고 유용한 인사이트를 제공합니다.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4000
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`OpenAI API 오류: ${errorData.error?.message || response.statusText}`)
      }

      const data = await response.json()
      const generatedText = data.choices[0]?.message?.content

      if (!generatedText) {
        throw new Error('AI 응답에서 텍스트를 추출할 수 없습니다.')
      }

      return generatedText
    } catch (error) {
      console.error('AI 텍스트 생성 오류:', error)
      throw error
    }
  }

  /**
   * 기업동향 리포트 생성
   * @param prompt 리포트 생성 프롬프트
   * @returns 생성된 리포트 텍스트
   */
  async generateOrganizationReport(prompt: string): Promise<string> {
    return await this.generateText(prompt, 'gpt-4o')
  }

  /**
   * API 키 유효성 검증
   */
  async validateApiKey(): Promise<boolean> {
    if (!this.apiKey) {
      return false
    }

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })
      return response.ok
    } catch (error) {
      console.error('API 키 검증 오류:', error)
      return false
    }
  }
}
