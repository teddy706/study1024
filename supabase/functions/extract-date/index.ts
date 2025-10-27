// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import OpenAI from 'https://deno.land/x/openai@v4.20.1/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const openaiKey = Deno.env.get('OPENAI_API_KEY')!
    const openai = new OpenAI({ apiKey: openaiKey })

    const { text } = await req.json()
    
    if (!text) {
      return new Response(
        JSON.stringify({ error: 'text is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
      )
    }

    const prompt = `
다음 텍스트에서 약속 날짜와 시간을 추출해주세요:
"${text}"

JSON 형식으로만 응답해주세요(다른 텍스트 없이):
{
  "date": "YYYY-MM-DD",
  "startTime": "HH:mm",
  "duration": "minutes"
}
`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: '너는 날짜/시간 추출 전문가야. JSON만 반환해.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
    })

    const content = completion.choices?.[0]?.message?.content || '{}'
    let result: any = {}
    
    try {
      result = JSON.parse(content)
    } catch (e) {
      console.warn('Failed to parse JSON, returning empty result')
      result = {}
    }

    if (!result.date || !result.startTime || !result.duration) {
      return new Response(
        JSON.stringify({ error: 'Could not extract date/time from text', result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
      )
    }

    const startTime = new Date(`${result.date}T${result.startTime}:00+09:00`).toISOString()
    const endTime = new Date(new Date(startTime).getTime() + Number(result.duration) * 60000).toISOString()

    return new Response(
      JSON.stringify({ success: true, startTime, endTime }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    )
  } catch (error) {
    console.error('extract-date error:', error)
    return new Response(
      JSON.stringify({ error: (error as any).message ?? 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    )
  }
})
