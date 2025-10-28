-- =====================================================
-- Products 테이블 컬럼 추가 (기존 테이블이 있는 경우)
-- =====================================================
-- 실행 순서: 14번째
-- Supabase SQL Editor에서 실행하세요

-- 기존 products 테이블이 있는지 확인하고 필요한 컬럼 추가
DO $$
BEGIN
  -- target_keywords 컬럼 추가 (없는 경우에만)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'target_keywords'
  ) THEN
    ALTER TABLE public.products ADD COLUMN target_keywords TEXT[];
    RAISE NOTICE '✅ target_keywords 컬럼이 추가되었습니다.';
  ELSE
    RAISE NOTICE '⚠️ target_keywords 컬럼이 이미 존재합니다.';
  END IF;

  -- sales_pitch 컬럼 추가 (없는 경우에만)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'sales_pitch'
  ) THEN
    ALTER TABLE public.products ADD COLUMN sales_pitch TEXT;
    RAISE NOTICE '✅ sales_pitch 컬럼이 추가되었습니다.';
  ELSE
    RAISE NOTICE '⚠️ sales_pitch 컬럼이 이미 존재합니다.';
  END IF;

  -- image_url 컬럼 추가 (없는 경우에만)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE public.products ADD COLUMN image_url TEXT;
    RAISE NOTICE '✅ image_url 컬럼이 추가되었습니다.';
  ELSE
    RAISE NOTICE '⚠️ image_url 컬럼이 이미 존재합니다.';
  END IF;

  -- is_active 컬럼 추가 (없는 경우에만)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.products ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    RAISE NOTICE '✅ is_active 컬럼이 추가되었습니다.';
  ELSE
    RAISE NOTICE '⚠️ is_active 컬럼이 이미 존재합니다.';
  END IF;

  -- currency 컬럼 추가 (없는 경우에만)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'currency'
  ) THEN
    ALTER TABLE public.products ADD COLUMN currency TEXT DEFAULT 'KRW';
    RAISE NOTICE '✅ currency 컬럼이 추가되었습니다.';
  ELSE
    RAISE NOTICE '⚠️ currency 컬럼이 이미 존재합니다.';
  END IF;

END $$;

-- 인덱스 생성 (없는 경우에만)
CREATE INDEX IF NOT EXISTS idx_products_target_keywords ON public.products USING GIN(target_keywords);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);

-- 업데이트 시간 자동 갱신 함수 (이미 있을 수 있지만 재생성)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성 (이미 있을 수 있지만 재생성)
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON public.products 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ Products 테이블 컬럼 추가 완료!';
  RAISE NOTICE '📋 현재 테이블 구조를 확인하려면: SELECT * FROM information_schema.columns WHERE table_name = ''products'';';
END $$;