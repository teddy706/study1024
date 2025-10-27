-- =====================================================
-- RLS 임시 비활성화 (테스트용)
-- =====================================================
-- 주의: 프로덕션 환경에서는 절대 실행하지 마세요!
-- 테스트 데이터 입력 후 다시 활성화해야 합니다.

-- RLS 비활성화
ALTER TABLE public.contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.actions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.smalltalk_cache DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '⚠️ RLS가 비활성화되었습니다!';
  RAISE NOTICE '테스트 데이터 입력 후 반드시 01_enable_rls.sql을 실행하세요!';
END $$;
