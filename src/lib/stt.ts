import { supabase, openai, type Call } from './clients'

export async function processCallRecording(
  recordingPath: string,
  contactId: string
): Promise<Call> {
  try {
    // 1. Whisper STT로 음성 파일 텍스트 변환
    const transcriptionFile = await openai.audio.transcriptions.create({
      file: await fetch(recordingPath).then(res => res.blob()),
      model: 'whisper-1'
    })

    const transcript = transcriptionFile.text

    // 2. GPT로 통화 내용 요약
    const summarization = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: '통화 내용을 간단히 요약해주세요. 주요 논의 사항과 후속 조치 사항을 포함해주세요.'
        },
        {
          role: 'user',
          content: transcript
        }
      ]
    })

    const summary = summarization.choices[0].message.content

    // 3. Supabase에 저장
    const { data: call, error } = await supabase
      .from('calls')
      .insert({
        contact_id: contactId,
        recording_path: recordingPath,
        transcript,
        summary,
        call_date: new Date().toISOString().split('T')[0],
        call_time: new Date().toTimeString().split(' ')[0]
      })
      .select()
      .single()

    if (error) throw error

    return call
  } catch (error) {
    console.error('통화 기록 처리 중 오류 발생:', error)
    throw error
  }
}