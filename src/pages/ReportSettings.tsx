import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../config/supabase'
import type { Database } from '../types/supabase'

type ReportOrganization = Database['public']['Tables']['report_organizations']['Row']
type OrganizationType = 'company' | 'government' | 'university'

export const ReportSettings = () => {
  const navigate = useNavigate()
  const [organizations, setOrganizations] = useState<ReportOrganization[]>([])
  const [promptTemplate, setPromptTemplate] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // 새 조직 추가 폼
  const [newOrgName, setNewOrgName] = useState('')
  const [newOrgType, setNewOrgType] = useState<OrganizationType>('company')
  const [addingOrg, setAddingOrg] = useState(false)

  // 프롬프트 편집 모드
  const [isEditingPrompt, setIsEditingPrompt] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // 조직 목록 로드
      const { data: orgsData, error: orgsError } = await supabase
        .from('report_organizations')
        .select('*')
        .order('created_at', { ascending: false })

      if (orgsError) throw orgsError
      setOrganizations(orgsData || [])

      // 프롬프트 설정 로드
      const { data: promptData, error: promptError } = await supabase
        .from('report_prompt_settings')
        .select('*')
        .single()

      if (promptError && promptError.code !== 'PGRST116') {
        // PGRST116은 row not found 에러 - 무시
        throw promptError
      }

      if (promptData) {
        setPromptTemplate(promptData.prompt_template)
      } else {
        // 기본 프롬프트 설정
        const defaultPrompt = `다음 조직들의 최근 동향을 분석하여 간결한 리포트를 작성해주세요:

조직 목록:
{organizations}

각 조직에 대해:
1. 최근 1개월 이내의 주요 뉴스나 이벤트
2. 사업 확장, 신제품 출시, 인사 변동 등의 중요 변화
3. 비즈니스 관계에 영향을 줄 수 있는 이슈

리포트 형식:
- 조직별로 구분하여 작성
- 각 항목은 2-3문장으로 간결하게 요약
- 출처나 날짜 정보 포함`
        setPromptTemplate(defaultPrompt)
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error)
      alert('데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newOrgName.trim()) {
      alert('조직명을 입력해주세요.')
      return
    }

    setAddingOrg(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('로그인이 필요합니다.')

      const { error } = await supabase
        .from('report_organizations')
        .insert({
          user_id: userData.user.id,
          name: newOrgName.trim(),
          type: newOrgType,
        })

      if (error) throw error

      alert('✅ 조직이 추가되었습니다.')
      setNewOrgName('')
      setNewOrgType('company')
      await loadData()
    } catch (error: any) {
      console.error('조직 추가 실패:', error)
      if (error.code === '23505') {
        alert('이미 등록된 조직입니다.')
      } else {
        alert('조직 추가에 실패했습니다.')
      }
    } finally {
      setAddingOrg(false)
    }
  }

  const handleDeleteOrganization = async (id: string, name: string) => {
    if (!confirm(`'${name}' 조직을 삭제하시겠습니까?`)) return

    try {
      const { error } = await supabase
        .from('report_organizations')
        .delete()
        .eq('id', id)

      if (error) throw error

      alert('✅ 조직이 삭제되었습니다.')
      await loadData()
    } catch (error) {
      console.error('조직 삭제 실패:', error)
      alert('조직 삭제에 실패했습니다.')
    }
  }

  const handleSavePrompt = async () => {
    setSaving(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('로그인이 필요합니다.')

      const { error } = await supabase
        .from('report_prompt_settings')
        .upsert(
          {
            user_id: userData.user.id,
            prompt_template: promptTemplate,
          },
          { onConflict: 'user_id' }
        )

      if (error) throw error

      alert('✅ 프롬프트가 저장되었습니다.')
      setIsEditingPrompt(false)
    } catch (error) {
      console.error('프롬프트 저장 실패:', error)
      alert('프롬프트 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const getTypeLabel = (type: OrganizationType) => {
    const labels = {
      company: '기업',
      government: '관공서',
      university: '대학',
    }
    return labels[type]
  }

  const getTypeBadgeColor = (type: OrganizationType) => {
    const colors = {
      company: 'bg-blue-100 text-blue-700',
      government: 'bg-green-100 text-green-700',
      university: 'bg-purple-100 text-purple-700',
    }
    return colors[type]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-gray-900 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <Link to="/" className="text-blue-600 hover:text-blue-700">
          ← 대시보드로 돌아가기
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8">리포트 설정</h1>

      {/* 관심 조직 관리 */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">관심 조직 관리</h2>
        <p className="text-gray-600 mb-6">
          관심있는 기업, 관공서, 대학을 등록하면 최신 동향 리포트에 포함됩니다.
        </p>

        {/* 새 조직 추가 폼 */}
        <form onSubmit={handleAddOrganization} className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                조직명
              </label>
              <input
                type="text"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder="예: 삼성전자, 서울시청, 서울대학교"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                유형
              </label>
              <select
                value={newOrgType}
                onChange={(e) => setNewOrgType(e.target.value as OrganizationType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="company">기업</option>
                <option value="government">관공서</option>
                <option value="university">대학</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={addingOrg}
            className={`mt-4 px-6 py-2 rounded-lg font-medium transition-colors ${
              addingOrg
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {addingOrg ? '추가 중...' : '➕ 조직 추가'}
          </button>
        </form>

        {/* 등록된 조직 목록 */}
        <div>
          <h3 className="text-lg font-medium mb-4">등록된 조직 ({organizations.length}개)</h3>
          {organizations.length === 0 ? (
            <p className="text-gray-500 text-center py-8">등록된 조직이 없습니다.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {organizations.map((org) => (
                <div
                  key={org.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeBadgeColor(org.type)}`}>
                      {getTypeLabel(org.type)}
                    </span>
                    <span className="font-medium">{org.name}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteOrganization(org.id, org.name)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    🗑️ 삭제
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 프롬프트 설정 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">리포트 생성 프롬프트</h2>
          {!isEditingPrompt && (
            <button
              onClick={() => setIsEditingPrompt(true)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              ✏️ 편집
            </button>
          )}
        </div>
        <p className="text-gray-600 mb-6">
          AI가 리포트를 생성할 때 사용하는 프롬프트를 수정할 수 있습니다.
          <br />
          <code className="text-sm bg-gray-100 px-2 py-1 rounded">{'{organizations}'}</code> 부분에 등록된 조직 목록이 자동으로 삽입됩니다.
        </p>

        {isEditingPrompt ? (
          <div>
            <textarea
              value={promptTemplate}
              onChange={(e) => setPromptTemplate(e.target.value)}
              rows={15}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleSavePrompt}
                disabled={saving}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  saving
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {saving ? '저장 중...' : '💾 저장'}
              </button>
              <button
                onClick={() => {
                  setIsEditingPrompt(false)
                  loadData() // 원래 값으로 복원
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="whitespace-pre-wrap text-sm font-mono text-gray-700">
              {promptTemplate}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReportSettings
