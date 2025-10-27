import { supabase } from '../utils/supabase'

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
}

export default SmalltalkService
