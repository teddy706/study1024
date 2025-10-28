-- =====================================================
-- 상품 관리 테이블 생성
-- =====================================================
-- 실행 순서: 13번째
-- Supabase SQL Editor에서 실행하세요

-- 1. Products 테이블 생성
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'KRW',
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  target_keywords TEXT[], -- 연관 키워드 (고객 관심사 매칭용)
  sales_pitch TEXT, -- 영업 멘트
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_target_keywords ON public.products USING GIN(target_keywords);

-- 3. RLS 정책 설정
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own products" ON public.products
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products" ON public.products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products" ON public.products
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products" ON public.products
  FOR DELETE USING (auth.uid() = user_id);

-- 4. 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. 트리거 생성
CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON public.products 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. 샘플 데이터 (선택사항 - 테스트용)
-- INSERT INTO public.products (name, description, category, price, target_keywords, sales_pitch, user_id)
-- VALUES 
--   ('프리미엄 CRM 솔루션', '고객 관계 관리를 위한 올인원 솔루션', 'Software', 500000, 
--    ARRAY['CRM', '고객관리', '영업', '마케팅'], 
--    '고객 관리가 복잡하시죠? 저희 CRM 솔루션으로 모든 고객 정보를 한 곳에서 관리하세요!', 
--    auth.uid());

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ 상품 테이블 생성 완료! 이제 상품 등록 기능을 개발할 수 있습니다.';
END $$;