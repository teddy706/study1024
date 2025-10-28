// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://deno.land/x/openai@v4.20.1/mod.ts'
import {
  PROMPT_VERSION,
  SYSTEM_PROMPT,
  GENERATION_CONFIG,
  FALLBACK_TEMPLATES,
  buildUserPrompt,
} from './prompts.ts'

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

    const { contactId, userId, contact: providedContact, recommendedProducts } = await req.json()
    if (!contactId || !userId) {
      return new Response(
        JSON.stringify({ error: 'contactId and userId are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
      )
    }

    const traceId = crypto.randomUUID()
    let usedFallback = false

    // 고객 정보 조회 (클라이언트에서 제공된 경우 사용, 없으면 DB에서 조회)
    let contact = providedContact
    if (!contact) {
      const { data: dbContact, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single()

      if (contactError || !dbContact) {
        return new Response(
          JSON.stringify({ error: 'Contact not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 },
        )
      }
      contact = dbContact
    }

    // 최근 통화 기록 조회
    const { data: recentCalls } = await supabase
      .from('calls')
      .select('summary, created_at')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })
      .limit(3)

    // 최근 액션 조회
    const { data: recentActions } = await supabase
      .from('actions')
      .select('description, action_date')
      .eq('contact_id', contactId)
      .order('action_date', { ascending: false })
      .limit(5)

    // 디버깅: 관심사 정보 로그 출력
    console.log('📋 Contact interests check:', {
      contactId,
      name: contact.name,
      interests: contact.interests,
      interestsType: typeof contact.interests,
      interestsLength: contact.interests?.length || 0
    })

    // AI 프롬프트 구성 (prompts.ts에서 가져옴)
    const prompt = buildUserPrompt(contact, recentCalls, recentActions, recommendedProducts)
    
    // 디버깅: 생성된 프롬프트에서 관심사 부분 확인
    console.log('🎯 Prompt interests section:', prompt.includes('MANDATORY Personal Interests') ? '✅ 포함됨' : '❌ 누락됨')

    let items: any[] = []
    try {
      const completion = await openai.chat.completions.create({
        model: GENERATION_CONFIG.model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: GENERATION_CONFIG.temperature,
      })
      const content = completion.choices?.[0]?.message?.content ?? '[]'
      const parsed = JSON.parse(content)
      items = Array.isArray(parsed) ? parsed : []
    } catch (e) {
      console.error('OpenAI parsing error:', e)
      usedFallback = true
      // 폴백 템플릿 사용 (prompts.ts에서 가져옴)
      items = FALLBACK_TEMPLATES(contact.name, contact.company)
    }

    const now = Date.now()
    const baseMeta = {
      function: 'generate-contact-smalltalk',
      function_version: '2025-10-27',
      prompt_version: PROMPT_VERSION,
      model: usedFallback ? null : GENERATION_CONFIG.model,
      source: usedFallback ? 'fallback' : 'openai',
      trace_id: traceId,
    }
    const rows = items
      .filter((x) => x && x.topic && x.content)
      .map((x) => ({
        contact_id: contactId,
        user_id: userId, // 현재 로그인 사용자로 저장 (RLS 호환)
        topic: String(x.topic).slice(0, 60),
        content: String(x.content).slice(0, 1000),
        meta: baseMeta,
        expires_at: new Date(
          now + Math.max(5, Math.min(14, Number(x.expire_days ?? 7))) * 24 * 60 * 60 * 1000,
        ).toISOString(),
        created_at: new Date().toISOString(),
      }))

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ success: true, count: 0, source: usedFallback ? 'fallback' : 'openai', traceId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
      )
    }

    const { error, count } = await supabase.from('smalltalk_cache').insert(rows, { count: 'exact' })
    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, count: count ?? rows.length, source: usedFallback ? 'fallback' : 'openai', traceId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    )
  } catch (error) {
    console.error('generate-contact-smalltalk error:', error)
    return new Response(
      JSON.stringify({ error: (error as any).message ?? 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    )
  }
})
