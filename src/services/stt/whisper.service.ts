import { supabase } from '../../utils/supabase'
import type { Call } from '../../utils/supabase'
import { OpenAI } from 'openai'

export class WhisperService {
  private openai: any

  constructor() {
    // openai v4 usage
    this.openai = new OpenAI({ apiKey: import.meta.env.VITE_OPENAI_API_KEY })
  }

  async transcribeAudio(audioFile: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', audioFile)
    formData.append('model', 'whisper-1')

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
      },
      body: formData
    })

    const data = await response.json()
    return data.text
  }

  async summarizeTranscription(transcription: string): Promise<string> {
    const completion = await this.openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: '통화 내용을 요약하고 주요 액션 아이템을 추출해주세요.'
        },
        {
          role: 'user',
          content: transcription
        }
      ],
      model: 'gpt-4-mini'
    })

    return completion.choices[0].message.content
  }

  async processCall(audioFile: File, contactId: string): Promise<Call> {
    try {
      // 1. 오디오 파일을 텍스트로 변환
      const transcription = await this.transcribeAudio(audioFile)
      
      // 2. 텍스트 요약
      const summary = await this.summarizeTranscription(transcription)

      // 3. 통화 기록 저장
      const call = {
        contact_id: contactId,
        recording_url: '', // 보안상의 이유로 실제 녹음 파일은 저장하지 않음
        summary,
        duration: 0, // 실제 구현시 오디오 파일 길이 계산
        called_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('calls')
        .insert(call)
        .select()
        .single()

      if (error) throw error
      return data

    } catch (error) {
      console.error('Error processing call:', error)
      throw error
    }
  }
}