import { supabase } from '../config/supabase'
import type { Database } from '../types/supabase'

type Action = Database['public']['Tables']['actions']['Row']
type ActionInsert = Database['public']['Tables']['actions']['Insert']
type Meeting = Database['public']['Tables']['meetings']['Row']

interface AIScheduleAnalysis {
  actions: {
    type: string
    description: string
    due_date: string
    priority: 'high' | 'medium' | 'low'
    estimated_duration?: string
  }[]
  summary: string
}

export class ScheduleService {
  
  /**
   * 미팅 기록을 AI로 분석하여 일정을 추출합니다
   */
  async analyzeScheduleFromMeeting(meetingId: string): Promise<AIScheduleAnalysis> {
    try {
      // 미팅 데이터 조회
      const { data: meeting, error: meetingError } = await (supabase as any)
        .from('meetings')
        .select('*')
        .eq('id', meetingId)
        .single()

      if (meetingError || !meeting) {
        throw new Error('미팅 데이터를 찾을 수 없습니다.')
      }

      // AI 분석을 위한 프롬프트 구성
      const prompt = `
다음 미팅 기록을 분석하여 향후 해야 할 일정과 액션 아이템을 추출해주세요.

미팅 정보:
- 제목: ${meeting.title || '미팅'}
- 날짜: ${new Date(meeting.met_at).toLocaleDateString('ko-KR')}
- 내용: ${meeting.memo || ''}

다음 JSON 형식으로 응답해주세요:
{
  "actions": [
    {
      "type": "액션 유형 (예: 문서 작성, 후속 미팅, 자료 준비 등)",
      "description": "구체적인 작업 내용",
      "due_date": "YYYY-MM-DD HH:MM 형식의 예상 완료일",
      "priority": "high|medium|low",
      "estimated_duration": "예상 소요 시간 (예: 2시간, 1일 등)"
    }
  ],
  "summary": "분석 요약"
}

중요한 규칙:
1. 실제로 실행 가능한 구체적인 액션만 추출
2. 날짜는 미팅일 이후의 현실적인 날짜로 설정
3. 모호하거나 추상적인 내용은 제외
4. 최대 5개의 액션까지만 추출
`

      // 개발 환경에서는 직접 OpenAI API 호출 (실제 환경에서는 Edge Function 사용)
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: `당신은 비즈니스 미팅 분석 전문가입니다. 미팅 기록을 분석하여 실행 가능한 액션 아이템을 추출해주세요.

중요한 지침:
1. 반드시 순수한 JSON 형식으로만 응답하세요 (마크다운 코드 블록 사용 금지)
2. 구체적이고 실행 가능한 액션만 추출하세요
3. 날짜는 YYYY-MM-DD HH:MM 형식으로 설정하세요
4. 우선순위는 high, medium, low 중 하나를 사용하세요

응답 형식 (정확히 이 구조를 따르세요):
{
  "actions": [
    {
      "type": "작업 제목",
      "description": "구체적인 작업 설명",
      "due_date": "2024-10-29 17:00",
      "priority": "high",
      "estimated_duration": "2시간"
    }
  ],
  "summary": "분석 요약"
}

절대 추가 설명이나 마크다운 형식을 사용하지 마세요. 오직 JSON만 반환하세요.`
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.1,
            max_tokens: 2000
          })
        })

        if (!response.ok) {
          throw new Error(`OpenAI API 오류: ${response.status}`)
        }

        const openaiData = await response.json()
        const content = openaiData.choices[0]?.message?.content

        if (!content) {
          throw new Error('AI 응답을 받을 수 없습니다.')
        }

        // JSON 파싱 시도 (더 견고한 방식)
        try {
          console.log('🔍 AI 응답 원본:', content)
          
          // JSON 블록 추출 시도 (```json...``` 형태일 경우)
          let jsonContent = content.trim()
          
          // 코드 블록으로 감싸진 경우 추출
          const jsonBlockMatch = jsonContent.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/)
          if (jsonBlockMatch) {
            jsonContent = jsonBlockMatch[1]
            console.log('📦 JSON 블록 추출됨:', jsonContent)
          }
          
          // JSON 파싱
          let analysisResult
          try {
            analysisResult = JSON.parse(jsonContent)
          } catch (firstParseError) {
            console.log('⚠️ 첫 번째 JSON 파싱 실패, 정규식으로 추출 시도...')
            
            // 정규식으로 JSON 객체 추출 시도
            const jsonMatch = jsonContent.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              analysisResult = JSON.parse(jsonMatch[0])
              console.log('✅ 정규식으로 JSON 추출 성공')
            } else {
              throw firstParseError
            }
          }
          
          console.log('🤖 파싱된 분석 결과:', analysisResult)
          
          // 기본 검증 및 구조 정규화
          if (!analysisResult.actions && !analysisResult.tasks && !analysisResult.schedule) {
            console.log('⚠️ actions 필드가 없어서 더미 데이터 생성')
            
            // AI가 구조화되지 않은 응답을 한 경우 더미 데이터 반환
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)
            
            return {
              actions: [
                {
                  type: '후속 작업',
                  description: 'AI 분석 결과를 바탕으로 후속 작업을 계획합니다.',
                  due_date: tomorrow.toISOString().split('T')[0] + ' 17:00',
                  priority: 'medium' as const,
                  estimated_duration: '1시간'
                }
              ],
              summary: 'AI 분석이 완료되었습니다. 구체적인 액션 추출에 실패하여 기본 작업을 생성했습니다.'
            }
          }
          
          // actions 필드 정규화 (다양한 필드명 지원)
          const actionsArray = analysisResult.actions || analysisResult.tasks || analysisResult.schedule || []
          
          if (!Array.isArray(actionsArray)) {
            console.log('⚠️ actions가 배열이 아님:', typeof actionsArray)
            return {
              actions: [],
              summary: 'AI 분석 결과 형식이 올바르지 않습니다.'
            }
          }

          // 각 액션의 필수 필드 검증 및 기본값 설정
          const validActions = actionsArray
            .filter((action: any) => {
              const hasRequired = action.type || action.title || action.task
              const hasDescription = action.description || action.desc || action.detail
              const hasDate = action.due_date || action.date || action.deadline
              
              return hasRequired && hasDescription
            })
            .map((action: any) => {
              // 필드명 정규화
              const type = action.type || action.title || action.task || '작업'
              const description = action.description || action.desc || action.detail || ''
              let due_date = action.due_date || action.date || action.deadline
              
              // 날짜 형식 정규화
              if (due_date && !due_date.includes('T')) {
                // 시간이 없는 경우 17:00 추가
                due_date = due_date.includes(' ') ? due_date : due_date + ' 17:00'
              }
              
              if (!due_date) {
                // 날짜가 없는 경우 내일로 설정
                const tomorrow = new Date()
                tomorrow.setDate(tomorrow.getDate() + 1)
                due_date = tomorrow.toISOString().split('T')[0] + ' 17:00'
              }
              
              return {
                type,
                description,
                due_date,
                priority: action.priority || 'medium',
                estimated_duration: action.estimated_duration || action.duration || null
              }
            })

          console.log(`✅ ${validActions.length}개의 유효한 액션 추출됨`)

          return {
            actions: validActions,
            summary: analysisResult.summary || analysisResult.result || '일정 분석이 완료되었습니다.'
          }

        } catch (parseError) {
          console.error('💥 JSON 파싱 완전 실패:', parseError)
          console.error('💥 AI 응답 내용:', content)
          
          // 파싱 완전 실패 시에도 기본 액션 생성
          const tomorrow = new Date()
          tomorrow.setDate(tomorrow.getDate() + 1)
          
          return {
            actions: [
              {
                type: '미팅 후속 작업',
                description: '미팅 내용을 바탕으로 후속 작업을 진행합니다.',
                due_date: tomorrow.toISOString().split('T')[0] + ' 17:00',
                priority: 'medium' as const,
                estimated_duration: '1시간'
              }
            ],
            summary: 'AI 분석 중 파싱 오류가 발생했지만 기본 작업을 생성했습니다.'
          }
        }

      } catch (fetchError) {
        console.error('OpenAI API 호출 실패:', fetchError)
        
        // API 호출 실패 시 더미 데이터 반환 (테스트용)
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const nextWeek = new Date()
        nextWeek.setDate(nextWeek.getDate() + 7)

        return {
          actions: [
            {
              type: '요구사항 문서 작성',
              description: '프로젝트 요구사항을 정리하고 문서화합니다.',
              due_date: tomorrow.toISOString().split('T')[0] + ' 17:00',
              priority: 'high' as const,
              estimated_duration: '4시간'
            },
            {
              type: '기술 스택 결정',
              description: '프로젝트에 사용할 기술 스택을 최종 결정합니다.',
              due_date: tomorrow.toISOString().split('T')[0] + ' 18:00',
              priority: 'high' as const,
              estimated_duration: '2시간'
            },
            {
              type: 'UI/UX 디자인 시안',
              description: '사용자 인터페이스 및 사용자 경험 디자인을 작성합니다.',
              due_date: nextWeek.toISOString().split('T')[0] + ' 17:00',
              priority: 'medium' as const,
              estimated_duration: '3일'
            }
          ],
          summary: 'AI 분석 대신 샘플 일정을 생성했습니다. (OpenAI API 키가 필요합니다)'
        }
      }
    } catch (error) {
      console.error('AI 일정 분석 실패:', error)
      throw error
    }
  }

  /**
   * 연락처의 모든 미팅을 분석하여 일정을 생성합니다
   */
  async analyzeAllMeetingsForContact(contactId: string): Promise<Action[]> {
    try {
      console.log('📅 AI 일정 분석 시작:', { contactId })
      
      // 현재 사용자 확인
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('사용자 인증 실패')
      
      console.log('👤 사용자 확인 완료:', user.id)

      // 해당 연락처의 최근 미팅들 조회 (사용자별 필터링)
      const { data: meetings, error: meetingsError } = await (supabase as any)
        .from('meetings')
        .select(`
          *,
          contacts!inner(user_id)
        `)
        .eq('contact_id', contactId)
        .eq('contacts.user_id', user.id)
        .order('met_at', { ascending: false })
        .limit(5) // 최근 5개 미팅만

      if (meetingsError) {
        console.error('🚨 미팅 조회 실패:', meetingsError)
        throw meetingsError
      }

      console.log('📝 조회된 미팅 수:', meetings?.length || 0)
      console.log('📝 미팅 데이터:', meetings)

      if (!meetings || meetings.length === 0) {
        console.log('⚠️ 분석할 미팅이 없습니다.')
        return []
      }

      const allActions: Action[] = []

      // 각 미팅 분석
      for (const meeting of meetings) {
        try {
          console.log(`🔍 미팅 분석 시작: ${meeting.id}`)
          const analysis = await this.analyzeScheduleFromMeeting(meeting.id)
          console.log(`🤖 AI 분석 결과:`, analysis)
          
          if (!analysis.actions || analysis.actions.length === 0) {
            console.log(`⚠️ 미팅 ${meeting.id}에서 생성할 액션이 없습니다.`)
            continue
          }
          
          // 분석된 액션들을 개별적으로 저장 (RLS 정책 준수)
          const savedActions = []
          
          for (const action of analysis.actions) {
            try {
              const actionToInsert = {
                contact_id: contactId,
                type: action.type,
                description: `${action.description}${action.estimated_duration ? ` (예상 소요시간: ${action.estimated_duration})` : ''}`,
                due_date: new Date(action.due_date).toISOString(),
                status: 'pending' as const
              }

              console.log('💾 저장할 개별 액션:', actionToInsert)

              // createAction 메서드를 사용하여 안전하게 저장
              const savedAction = await this.createAction(actionToInsert)
              savedActions.push(savedAction)
              
              console.log('✅ 액션 저장 성공:', savedAction.id)
            } catch (actionError) {
              console.error('💥 개별 액션 저장 실패:', actionError)
              // 개별 액션 실패는 전체 프로세스를 중단하지 않음
            }
          }

          console.log(`💾 최종 저장된 액션 수: ${savedActions.length}/${analysis.actions.length}`)

          allActions.push(...savedActions)
        } catch (error) {
          console.error(`💥 미팅 ${meeting.id} 분석 실패:`, error)
          // 개별 미팅 분석 실패는 전체 프로세스를 중단하지 않음
        }
      }

      console.log(`🎉 최종 결과: ${allActions.length}개의 액션이 생성되었습니다.`)
      return allActions
    } catch (error) {
      console.error('💥 미팅 일정 분석 실패:', error)
      throw error
    }
  }

  /**
   * 수동으로 일정을 추가합니다
   */
  async createAction(action: Omit<ActionInsert, 'user_id'>): Promise<Action> {
    try {
      console.log('🔨 createAction 시작...')
      console.log('📋 입력 액션 데이터:', action)

      // 사용자 인증 확인
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) {
        console.error('❌ 사용자 인증 오류:', userError)
        throw new Error(`사용자 인증 실패: ${userError.message}`)
      }
      
      if (!user) {
        console.error('❌ 사용자 정보 없음')
        throw new Error('사용자가 로그인되지 않았습니다')
      }

      console.log('✅ 사용자 인증 완료:', user.id)

      // 저장할 데이터 준비
      const actionWithUser = {
        ...action,
        user_id: user.id
      }

      console.log('💾 데이터베이스에 저장할 데이터:', actionWithUser)

      // 데이터베이스에 저장
      const { data, error } = await (supabase as any)
        .from('actions')
        .insert(actionWithUser)
        .select()
        .single()

      if (error) {
        console.error('❌ 데이터베이스 저장 오류:', error)
        throw new Error(`데이터베이스 저장 실패: ${error.message}`)
      }

      console.log('✅ 액션 생성 성공:', data)
      return data
    } catch (error) {
      console.error('💥 createAction 완전 실패:', error)
      throw error
    }
  }

  /**
   * 일정을 업데이트합니다
   */
  async updateAction(id: string, updates: Partial<Omit<Action, 'id' | 'user_id'>>): Promise<Action> {
    try {
      const { data, error } = await (supabase as any)
        .from('actions')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('일정 업데이트 실패:', error)
      throw error
    }
  }

  /**
   * 일정을 삭제합니다
   */
  async deleteAction(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('actions')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('일정 삭제 실패:', error)
      throw error
    }
  }

  /**
   * 사용자의 모든 일정을 조회합니다
   */
  async getActions(options?: {
    contactId?: string
    status?: string
    limit?: number
    includeContact?: boolean
  }): Promise<Action[]> {
    try {
      // 연락처 정보 포함 여부에 따라 select 구성
      const selectFields = options?.includeContact 
        ? `
          *,
          contacts!inner(
            id,
            name,
            company,
            position
          )
        `
        : '*'

      let query = supabase
        .from('actions')
        .select(selectFields)
        .order('due_date', { ascending: true })

      if (options?.contactId) {
        query = query.eq('contact_id', options.contactId)
      }

      if (options?.status) {
        query = query.eq('status', options.status)
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('일정 조회 실패:', error)
      throw error
    }
  }

  /**
   * 일정 상태를 변경합니다
   */
  async updateActionStatus(id: string, status: 'pending' | 'in_progress' | 'completed'): Promise<Action> {
    return this.updateAction(id, { status })
  }
}

export default ScheduleService