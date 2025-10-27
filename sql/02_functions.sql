-- =====================================================
-- RPC 함수 및 헬퍼 함수 생성
-- =====================================================
-- 실행 순서: 2번째
-- Supabase SQL Editor에서 실행하세요

-- 1. 대시보드 통계 조회 함수
CREATE OR REPLACE FUNCTION public.get_dashboard_counts(
  start_ts TIMESTAMPTZ DEFAULT NULL,
  end_ts TIMESTAMPTZ DEFAULT NULL,
  companies TEXT[] DEFAULT NULL
)
RETURNS TABLE(
  contact_count BIGINT,
  report_count BIGINT,
  action_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH filtered_contacts AS (
    SELECT * FROM contacts c
    WHERE (start_ts IS NULL OR c.last_contact >= start_ts)
      AND (end_ts IS NULL OR c.last_contact <= end_ts)
      AND (companies IS NULL OR array_length(companies, 1) IS NULL OR c.company = ANY (companies))
      AND c.user_id = auth.uid()
  ), filtered_reports AS (
    SELECT * FROM reports r
    WHERE (start_ts IS NULL OR r.created_at >= start_ts)
      AND (end_ts IS NULL OR r.created_at <= end_ts)
      AND r.user_id = auth.uid()
  ), filtered_actions AS (
    SELECT * FROM actions a
    WHERE (start_ts IS NULL OR a.due_date >= start_ts)
      AND (end_ts IS NULL OR a.due_date <= end_ts)
      AND a.user_id = auth.uid()
  )
  SELECT
    (SELECT COUNT(*) FROM filtered_contacts) AS contact_count,
    (SELECT COUNT(*) FROM filtered_reports) AS report_count,
    (SELECT COUNT(*) FROM filtered_actions) AS action_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 회사 목록 조회 함수
CREATE OR REPLACE FUNCTION public.get_companies()
RETURNS TABLE(company TEXT) AS $$
  SELECT DISTINCT c.company 
  FROM public.contacts c
  WHERE c.company IS NOT NULL 
    AND c.user_id = auth.uid()
  ORDER BY c.company;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. 최근 통화 데이터 조회 (스몰토크 생성용)
CREATE OR REPLACE FUNCTION public.get_recent_calls_for_smalltalk(
  days_back INTEGER DEFAULT 7
)
RETURNS TABLE (
  contact_id UUID,
  contact_name TEXT,
  company TEXT,
  recent_summaries TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS contact_id,
    c.name AS contact_name,
    c.company,
    STRING_AGG(
      calls.summary || ' (' || TO_CHAR(calls.called_at, 'YYYY-MM-DD') || ')',
      E'\n---\n'
      ORDER BY calls.called_at DESC
    ) AS recent_summaries
  FROM contacts c
  INNER JOIN calls ON calls.contact_id = c.id
  WHERE 
    calls.summary IS NOT NULL 
    AND calls.summary != ''
    AND calls.called_at >= NOW() - (days_back || ' days')::INTERVAL
    AND c.user_id = auth.uid()
    AND calls.user_id = auth.uid()
  GROUP BY c.id, c.name, c.company
  HAVING COUNT(calls.id) > 0
  ORDER BY COUNT(calls.id) DESC;
END;
$$;

-- 4. 스몰토크 일괄 삽입 함수
CREATE OR REPLACE FUNCTION public.insert_smalltalk_items(
  p_contact_id UUID,
  p_items JSONB
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inserted_count INTEGER := 0;
  v_item JSONB;
  v_user_id UUID;
BEGIN
  -- 현재 사용자 ID 확인
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 연락처가 현재 사용자 소유인지 확인
  IF NOT EXISTS (
    SELECT 1 FROM contacts 
    WHERE id = p_contact_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Contact not found or not owned by user';
  END IF;

  -- JSONB 배열의 각 항목을 순회하며 삽입
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO smalltalk_cache (
      contact_id,
      topic,
      content,
      expires_at,
      user_id
    )
    VALUES (
      p_contact_id,
      v_item->>'topic',
      v_item->>'content',
      (NOW() + ((v_item->>'days')::INTEGER || ' days')::INTERVAL),
      v_user_id
    );
    
    v_inserted_count := v_inserted_count + 1;
  END LOOP;
  
  RETURN v_inserted_count;
END;
$$;

-- 5. 만료된 스몰토크 자동 삭제 함수
CREATE OR REPLACE FUNCTION public.cleanup_expired_smalltalk()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM smalltalk_cache
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;

-- =====================================================
-- 권한 설정
-- =====================================================

GRANT EXECUTE ON FUNCTION public.get_dashboard_counts(TIMESTAMPTZ, TIMESTAMPTZ, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_companies() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_recent_calls_for_smalltalk(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_smalltalk_items(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_smalltalk() TO authenticated;

-- =====================================================
-- 테스트 쿼리 (주석 해제하여 실행 가능)
-- =====================================================

-- SELECT * FROM get_companies();
-- SELECT * FROM get_dashboard_counts(NULL, NULL, NULL);
-- SELECT * FROM get_recent_calls_for_smalltalk(7);

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ 함수 생성 완료! 다음 단계: 03_seed_data.sql 실행 (선택 사항)';
END $$;
