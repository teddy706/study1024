import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../config/supabase'

interface ContactFormData {
  name: string
  company: string
  position: string
  mobile: string
  office_phone: string
  fax: string
  email: string
  address: string
  interests: string
}

export const AddContact: React.FC = () => {
  const navigate = useNavigate()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    company: '',
    position: '',
    mobile: '',
    office_phone: '',
    fax: '',
    email: '',
    address: '',
    interests: '',
  })
  const [extractedText, setExtractedText] = useState<string>('')
  const [ocrCompleted, setOcrCompleted] = useState(false)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
    setOcrCompleted(false)
  }

  const handleOCRProcess = async () => {
    if (!imageFile) {
      alert('이미지를 먼저 선택해주세요.')
      return
    }

    setIsProcessing(true)
    try {
      // 이미지를 base64로 변환
      const reader = new FileReader()
      reader.readAsDataURL(imageFile)
      
      await new Promise<void>((resolve, reject) => {
        reader.onload = async () => {
          try {
            const base64Image = reader.result as string
            const base64Data = base64Image.split(',')[1]

            const session = await supabase.auth.getSession()
            if (!session.data.session) {
              throw new Error('로그인이 필요합니다.')
            }

            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-business-card`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${session.data.session.access_token}`,
                },
                body: JSON.stringify({ imageBase64: base64Data }),
              }
            )

            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.error || '명함 처리에 실패했습니다.')
            }

            const result = await response.json()
            console.log('OCR 결과:', result)

            // 폼 데이터 채우기
            if (result.contactData) {
              setFormData({
                name: result.contactData.name || '',
                company: result.contactData.company || '',
                position: result.contactData.position || '',
                mobile: result.contactData.mobile || '',
                office_phone: result.contactData.office_phone || '',
                fax: result.contactData.fax || '',
                email: result.contactData.email || '',
                address: result.contactData.address || '',
                interests: '', // OCR에서는 관심사 추출 불가
              })
            }

            setExtractedText(result.extractedText || '')
            setOcrCompleted(true)
            alert('✅ OCR 분석이 완료되었습니다. 정보를 확인하고 수정해주세요.')
            resolve()
          } catch (error) {
            reject(error)
          }
        }
        reader.onerror = () => reject(new Error('이미지 읽기 실패'))
      })
    } catch (error) {
      console.error('OCR 처리 오류:', error)
      alert(error instanceof Error ? error.message : '명함 인식에 실패했습니다.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.company) {
      alert('이름과 회사명은 필수 입력 항목입니다.')
      return
    }

    setIsSaving(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        throw new Error('로그인이 필요합니다.')
      }

      // 명함 이미지 업로드
      let imageUrl = ''
      if (imageFile && ocrCompleted) {
        const timestamp = Date.now()
        const randomStr = Math.random().toString(36).substring(7)
        const fileName = `${userData.user.id}/${timestamp}_${randomStr}.jpg`

        const { error: uploadError } = await supabase.storage
          .from('business-cards')
          .upload(fileName, imageFile, {
            contentType: imageFile.type,
            upsert: false,
          })

        if (uploadError) {
          console.error('이미지 업로드 실패:', uploadError)
        } else {
          const { data: urlData } = supabase.storage
            .from('business-cards')
            .getPublicUrl(fileName)
          imageUrl = urlData.publicUrl
        }
      }

      // 연락처 저장
      const { error: insertError } = await supabase
        .from('contacts')
        .insert({
          ...formData,
          business_card_image_url: imageUrl || null,
          user_id: userData.user.id,
        })

      if (insertError) throw insertError

      alert('✅ 연락처가 등록되었습니다!')
      navigate('/')
    } catch (error) {
      console.error('저장 오류:', error)
      alert(error instanceof Error ? error.message : '연락처 저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link to="/" className="text-blue-600 hover:text-blue-700">
          ← 대시보드로 돌아가기
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">신규 연락처 등록</h1>

        {/* 명함 업로드 섹션 */}
        <div className="mb-8 p-6 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">1. 명함 사진 업로드 (선택)</h2>
          
          <div className="space-y-4">
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </div>

            {imagePreview && (
              <div className="mt-4">
                <img
                  src={imagePreview}
                  alt="명함 미리보기"
                  className="max-w-md rounded-lg border border-gray-300"
                />
              </div>
            )}

            {imageFile && !ocrCompleted && (
              <button
                onClick={handleOCRProcess}
                disabled={isProcessing}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  isProcessing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    명함 분석 중...
                  </span>
                ) : (
                  '🔍 명함 자동 인식 (OCR)'
                )}
              </button>
            )}

            {ocrCompleted && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">✅ OCR 분석 완료!</p>
                <p className="text-sm text-green-600 mt-1">
                  아래 정보를 확인하고 필요시 수정해주세요.
                </p>
              </div>
            )}

            {extractedText && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                  추출된 원본 텍스트 보기
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs whitespace-pre-wrap">
                  {extractedText}
                </pre>
              </details>
            )}
          </div>
        </div>

        {/* 연락처 정보 입력 폼 */}
        <form onSubmit={handleSubmit}>
          <h2 className="text-lg font-semibold mb-4">
            2. 연락처 정보 {ocrCompleted ? '확인 및 수정' : '입력'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="홍길동"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                회사명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="주식회사 예시"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                직책
              </label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="대표이사"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                휴대폰
              </label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="010-1234-5678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                사무실 전화
              </label>
              <input
                type="tel"
                name="office_phone"
                value={formData.office_phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="02-1234-5678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                팩스
              </label>
              <input
                type="tel"
                name="fax"
                value={formData.fax}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="02-1234-5679"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="example@company.com"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                주소
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="서울특별시 강남구..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                관심사
              </label>
              <textarea
                name="interests"
                value={formData.interests}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 골프, 와인, IT 트렌드, 독서"
              />
              <p className="text-xs text-gray-500 mt-1">
                이 정보는 스몰토크 주제 생성에 활용됩니다.
              </p>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                isSaving
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSaving ? '저장 중...' : '💾 연락처 저장'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddContact
