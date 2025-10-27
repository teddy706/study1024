-- =====================================================
-- contacts 테이블에 관심사 필드 추가
-- =====================================================
-- 실행 위치: Supabase SQL Editor
-- 영향 범위: contacts 테이블에 interests 컬럼 추가

-- interests 컬럼 추가
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS interests TEXT;

-- 컬럼 설명 추가
COMMENT ON COLUMN public.contacts.interests IS '고객의 개인 관심사 (취미, 관심 분야 등)';

DO $$
BEGIN
  RAISE NOTICE '✅ interests 컬럼 추가 완료';
  RAISE NOTICE '💡 사용 예시: "골프, 와인, IT 트렌드"';
END $$;
