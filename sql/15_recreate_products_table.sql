-- =====================================================
-- Products 테이블 완전 재생성 (기존 데이터 삭제 주의!)
-- =====================================================
-- ⚠️ 주의: 기존 products 테이블과 데이터가 모두 삭제됩니다!
-- 기존 데이터를 보존하려면 14_add_products_columns.sql을 사용하세요.

-- 기존 테이블 삭제 (있는 경우)
DROP TABLE IF EXISTS public.products CASCADE;

-- 새로운 Products 테이블 생성
CREATE TABLE public.products (
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

-- 인덱스 생성
CREATE INDEX idx_products_user_id ON public.products(user_id);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_is_active ON public.products(is_active);
CREATE INDEX idx_products_target_keywords ON public.products USING GIN(target_keywords);

-- RLS 정책 설정
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own products" ON public.products
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products" ON public.products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products" ON public.products
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products" ON public.products
  FOR DELETE USING (auth.uid() = user_id);

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON public.products 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 테스트용 샘플 데이터 (선택사항)
INSERT INTO public.products (name, description, category, price, target_keywords, sales_pitch, user_id)
SELECT 
  '프리미엄 CRM 솔루션',
  '고객 관계 관리를 위한 올인원 솔루션',
  'Software',
  500000,
  ARRAY['CRM', '고객관리', '영업', '마케팅'],
  '고객 관리가 복잡하시죠? 저희 CRM 솔루션으로 모든 고객 정보를 한 곳에서 관리하세요!',
  auth.uid()
WHERE auth.uid() IS NOT NULL;

INSERT INTO public.products (name, description, category, price, target_keywords, sales_pitch, user_id)
SELECT 
  '클라우드 보안 솔루션',
  '엔터프라이즈급 클라우드 보안 및 모니터링',
  'Security',
  800000,
  ARRAY['클라우드', '보안', '모니터링', '인프라'],
  '클라우드 보안이 걱정되시나요? 저희 솔루션으로 안전하게 보호하세요!',
  auth.uid()
WHERE auth.uid() IS NOT NULL;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ Products 테이블이 완전히 재생성되었습니다!';
  RAISE NOTICE '📦 샘플 상품 2개가 추가되었습니다.';
  RAISE NOTICE '🚀 이제 /products 페이지에서 상품 관리를 시작할 수 있습니다!';
END $$;