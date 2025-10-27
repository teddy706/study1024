-- =====================================================
-- smalltalk_cache에 생성 출처 메타데이터 컬럼 추가
-- =====================================================
-- 실행 위치: Supabase SQL Editor 또는 psql
-- 영향 범위: 읽기 전용 기능에는 영향 없음. 새로 쓰는 레코드에만 메타가 채워집니다.

ALTER TABLE public.smalltalk_cache
  ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}'::jsonb;

-- 자주 조회되는 경우 GIN 인덱스를 권장합니다. (선택)
-- CREATE INDEX IF NOT EXISTS idx_smalltalk_meta_gin ON public.smalltalk_cache USING GIN (meta);

DO $$
BEGIN
  RAISE NOTICE '✅ meta 컬럼 추가 완료';
END $$;
