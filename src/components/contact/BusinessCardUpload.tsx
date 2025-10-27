import { useState, useRef } from 'react'
import { supabase } from '../../config/supabase'

interface BusinessCardUploadProps {
  onContactCreated?: () => void
}

export default function BusinessCardUpload({ onContactCreated }: BusinessCardUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 이미지 미리보기
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // 파일을 base64로 변환
    setIsProcessing(true)
    setError(null)

    try {
      const base64 = await fileToBase64(file)
      
      // Edge Function 호출
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('로그인이 필요합니다.')
      }

      console.log('🔑 Session check:', {
        hasSession: !!session,
        hasAccessToken: !!session.access_token,
        tokenPreview: session.access_token?.substring(0, 20) + '...'
      })

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-business-card`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageBase64: base64.split(',')[1], // data:image/jpeg;base64, 부분 제거
          }),
        }
      )

      console.log('📡 Response status:', response.status)

      const result = await response.json()

      console.log('📦 Response data:', result)

      if (!result.success) {
        throw new Error(result.error || '명함 처리 중 오류가 발생했습니다.')
      }

      // 성공
      alert('명함이 성공적으로 등록되었습니다!')
      setPreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      if (onContactCreated) {
        onContactCreated()
      }

    } catch (err) {
      console.error('Error processing business card:', err)
      setError(err instanceof Error ? err.message : '명함 처리 중 오류가 발생했습니다.')
    } finally {
      setIsProcessing(false)
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const handleCancel = () => {
    setPreview(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">📇 명함 스캔으로 연락처 추가</h3>
      
      <div className="space-y-4">
        {/* 파일 선택 */}
        <div>
          <label
            htmlFor="business-card-upload"
            className="block w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-blue-500 transition-colors"
          >
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="mt-2 block text-sm font-medium text-gray-900">
              {isProcessing ? '처리 중...' : '명함 사진을 선택하세요'}
            </span>
            <span className="mt-1 block text-xs text-gray-500">
              PNG, JPG, JPEG (최대 10MB)
            </span>
          </label>
          <input
            ref={fileInputRef}
            id="business-card-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isProcessing}
            className="hidden"
          />
        </div>

        {/* 미리보기 */}
        {preview && (
          <div className="relative">
            <img
              src={preview}
              alt="명함 미리보기"
              className="w-full h-auto rounded-lg border-2 border-gray-200"
            />
            {!isProcessing && (
              <button
                onClick={handleCancel}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* 처리 중 표시 */}
        {isProcessing && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-sm text-gray-600">
              명함을 분석하고 있습니다...
            </span>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* 안내 메시지 */}
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded text-sm">
          <p className="font-semibold mb-1">💡 팁</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>명함이 선명하게 보이도록 촬영해주세요</li>
            <li>조명이 밝은 곳에서 찍으면 인식률이 높아집니다</li>
            <li>명함 전체가 화면에 들어오도록 촬영해주세요</li>
            <li>자동으로 이름, 회사명, 직책, 연락처 등이 추출됩니다</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
