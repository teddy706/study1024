import { supabase } from '../../config/supabase'
import type { Database } from '../../types/supabase'

type Call = Database['public']['Tables']['calls']['Row']

export class WhisperService {
  constructor() {}

  async processCall(audioFile: File, contactId: string): Promise<Call> {
    try {
      // Edge Function으로 파일 업로드 + 처리 위임
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-call`
      const formData = new FormData()
      formData.append('file', audioFile)
      formData.append('contactId', contactId)

      const anonKey = import.meta.env.VITE_SUPABASE_KEY
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
        body: formData,
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`process-call failed: ${res.status} ${errText}`)
      }

      const json = await res.json()
      return json.call as Call
    } catch (error) {
      console.error('Error processing call:', error)
      throw error
    }
  }
}