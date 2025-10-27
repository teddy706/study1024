import { google } from 'googleapis'
import { supabase } from '../../config/supabase'
import type { Database } from '../../types/supabase'

type Action = Database['public']['Tables']['actions']['Row']

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
      .insert(action as any)
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
  // Edge Function으로 날짜 추출 위임 (OpenAI 키 서버 측 보호)
  const { data, error } = await supabase.functions.invoke('extract-date', {
    body: { text },
  })

  if (error) throw error
  
  const startTime = new Date(data.startTime)
  const endTime = new Date(data.endTime)

  return { startTime, endTime }
}