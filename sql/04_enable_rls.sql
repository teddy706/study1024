-- =====================================================
-- RLS 재활성화
-- =====================================================
-- 테스트 데이터 입력 후 반드시 실행하세요!

-- RLS 활성화
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smalltalk_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ RLS가 다시 활성화되었습니다!';
  RAISE NOTICE '이제 보안 정책이 적용됩니다.';
END $$;
