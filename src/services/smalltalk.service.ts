import { OpenAI } from 'openai'
import { supabase } from '../utils/supabase'

type GenItem = { topic: string; content: string; expire_days?: number }

export class SmalltalkService {
  private openai: any | null = null

  constructor() {}

  private getOpenAI() {
    if (!this.openai) {
      // 주의: 데모 용도. 실제 서비스에서는 서버/엣지에서 호출해야 안전합니다.
      this.openai = new OpenAI({ apiKey: import.meta.env.VITE_OPENAI_API_KEY, dangerouslyAllowBrowser: true })
    }
    return this.openai
  }

  async generateFromSummary(summary: string, contactId: string): Promise<number> {
    // Prompt: create 2-4 smalltalk hooks based on call summary
    const prompt = `아래 통화 요약을 바탕으로, 다음 JSON 배열 형식만 반환하세요.
[
  { "topic": "주제(짧게)", "content": "가볍게 던질 수 있는 한두 문장", "expire_days": 7 },
  ... (2~4개 항목)
]
제약:
- 한국어로 답하세요.
- JSON 외 다른 텍스트는 포함하지 마세요.
- content는 예의 바르고 자연스러운 일상 대화 톤으로.
- expire_days는 5~14 사이의 정수로 임의 분포.

통화 요약:
${summary}`

    let items: GenItem[] = []
    try {
  const completion = await this.getOpenAI().chat.completions.create({
        model: 'gpt-4-mini',
        messages: [
          { role: 'system', content: '너는 영업 지원 비서야. JSON만 반환해.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      })
      const content = completion.choices?.[0]?.message?.content ?? '[]'
      items = JSON.parse(content)
      if (!Array.isArray(items)) items = []
    } catch (e) {
      console.warn('Smalltalk generation failed to parse JSON, fallback to single item.')
      items = [
        {
          topic: '최근 통화 요약',
          content: summary.slice(0, 180) + (summary.length > 180 ? '…' : ''),
          expire_days: 7,
        },
      ]
    }

    // Normalize and insert
    const now = Date.now()
    const rows = items
      .filter((x) => x && x.topic && x.content)
      .map((x) => ({
        contact_id: contactId,
        topic: String(x.topic).slice(0, 60),
        content: String(x.content).slice(0, 1000),
        expires_at: new Date(now + (Math.max(5, Math.min(14, x.expire_days ?? 7)) * 24 * 60 * 60 * 1000)).toISOString(),
        created_at: new Date().toISOString(),
      }))

    if (rows.length === 0) return 0

    const { error, count } = await supabase.from('smalltalk_cache').insert(rows, { count: 'exact' })
    if (error) throw error
    return count ?? rows.length
  }
}

export default SmalltalkService
