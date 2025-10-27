// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const openaiKey = Deno.env.get('OPENAI_API_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const openai = new OpenAI({ apiKey: openaiKey })

    // multipart/form-data 기대: file(audio), contactId
    const contentType = req.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return new Response(
        JSON.stringify({ error: 'multipart/form-data required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const contactId = String(formData.get('contactId') ?? '')

    if (!file || !contactId) {
      return new Response(
        JSON.stringify({ error: 'file and contactId are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
      )
    }

    // 1) 음성 → 텍스트 (whisper)
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
    })

    const text = (transcription as any)?.text ?? ''

    // 2) 요약
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: '통화 내용을 요약하고 주요 액션 아이템을 추출해주세요.' },
        { role: 'user', content: text },
      ],
      temperature: 0.7,
    })
    const summary = completion.choices?.[0]?.message?.content ?? ''

    // 3) 통화 기록 저장
    const call = {
      contact_id: contactId,
      recording_url: '',
      summary,
      duration: 0,
      called_at: new Date().toISOString(),
    }

    const { data: callRow, error: insertCallError } = await supabase.from('calls').insert(call).select().single()
    if (insertCallError) throw insertCallError

    // 4) 스몰토크 생성 및 저장 (best-effort)
    try {
      const stPrompt = `아래 통화 요약을 바탕으로, 다음 JSON 배열 형식만 반환하세요.
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

      const stCompletion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: '너는 영업 지원 비서야. JSON만 반환해.' },
          { role: 'user', content: stPrompt },
        ],
        temperature: 0.7,
      })

      const content = stCompletion.choices?.[0]?.message?.content ?? '[]'
      let items = [] as any[]
      try {
        const parsed = JSON.parse(content)
        items = Array.isArray(parsed) ? parsed : []
      } catch (_) {
        items = []
      }

      const now = Date.now()
      const rows = items
        .filter((x) => x && x.topic && x.content)
        .map((x) => ({
          contact_id: contactId,
          topic: String(x.topic).slice(0, 60),
          content: String(x.content).slice(0, 1000),
          expires_at: new Date(
            now + Math.max(5, Math.min(14, Number(x.expire_days ?? 7))) * 24 * 60 * 60 * 1000,
          ).toISOString(),
          created_at: new Date().toISOString(),
        }))

      if (rows.length > 0) {
        await supabase.from('smalltalk_cache').insert(rows)
      }
    } catch (e) {
      console.warn('Smalltalk generation failed:', e)
    }

    return new Response(
      JSON.stringify({ success: true, call: callRow }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    )
  } catch (error) {
    console.error('process-call error:', error)
    return new Response(
      JSON.stringify({ error: (error as any).message ?? 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    )
  }
})
