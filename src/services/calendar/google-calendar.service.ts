import { google } from 'googleapis'
import { OpenAI } from 'openai'
import { supabase } from '../../utils/supabase'
import type { Action } from '../../utils/supabase'

const calendar = google.calendar('v3')

export const scheduleEvent = async (summary: string, description: string, startTime: Date, endTime: Date, attendees: string[] = []): Promise<Action> => {
  try {
    // Google Calendar에 이벤트 생성
    const calendarEvent = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary,
        description,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'Asia/Seoul',
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'Asia/Seoul',
        },
        attendees: attendees.map(email => ({ email })),
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 30 },
          ],
        },
      },
    })

    // Supabase에 일정 저장
    const action = {
      type: 'meeting',
      description: `${summary}\n${description}`,
      due_date: startTime.toISOString(),
      status: 'scheduled'
    }

    const { data, error } = await supabase
      .from('actions')
      .insert(action)
      .select()
      .single()

    if (error) throw error
    return data

  } catch (error) {
    console.error('Error scheduling event:', error)
    throw error
  }
}

export const extractDateFromText = async (text: string): Promise<{ startTime: Date, endTime: Date }> => {
  // GPT를 사용하여 텍스트에서 날짜/시간 정보 추출
  const openai = new OpenAI({ apiKey: import.meta.env.VITE_OPENAI_API_KEY })

  const prompt = `
    다음 텍스트에서 약속 날짜와 시간을 추출해주세요:
    "${text}"
    
    JSON 형식으로 응답해주세요:
    {
      "date": "YYYY-MM-DD",
      "startTime": "HH:mm",
      "duration": "minutes"
    }
  `

  const completion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-4-mini'
  })

  const result = JSON.parse(completion.choices[0].message.content || '{}')
  
  const startTime = new Date(`${result.date}T${result.startTime}:00`)
  const endTime = new Date(startTime.getTime() + result.duration * 60000)

  return { startTime, endTime }
}