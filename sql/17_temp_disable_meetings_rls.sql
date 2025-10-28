-- 임시로 미팅 테이블 RLS 비활성화 (테스트용)
-- ⚠️ 주의: 프로덕션 환경에서는 사용하지 마세요!

-- 미팅 테이블 RLS 비활성화
ALTER TABLE public.meetings DISABLE ROW LEVEL SECURITY;

-- 상태 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS 활성화됨"
FROM pg_tables 
WHERE tablename IN ('contacts', 'meetings', 'actions', 'reports')
AND schemaname = 'public';

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '⚠️ 미팅 테이블 RLS가 임시로 비활성화되었습니다!';
  RAISE NOTICE '테스트 완료 후 다시 활성화해주세요.';
  RAISE NOTICE 'ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;';
END $$;