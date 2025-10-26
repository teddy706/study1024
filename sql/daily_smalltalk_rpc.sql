-- =====================================================
-- Daily Smalltalk Generation RPC Function
-- n8n에서 호출할 수 있는 간단한 RPC 함수
-- =====================================================

-- OpenAI API를 호출하기 위한 http 확장 활성화
CREATE EXTENSION IF NOT EXISTS http;

-- 최근 통화 데이터를 가져와 스몰토크 생성에 필요한 정보를 반환
CREATE OR REPLACE FUNCTION get_recent_calls_for_smalltalk(days_back INTEGER DEFAULT 7)
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
    c.id as contact_id,
    c.name as contact_name,
    c.company,
    STRING_AGG(
      calls.summary || ' (' || TO_CHAR(calls.called_at, 'YYYY-MM-DD') || ')',
      E'\n---\n'
      ORDER BY calls.called_at DESC
    ) as recent_summaries
  FROM contacts c
  INNER JOIN calls ON calls.contact_id = c.id
  WHERE 
    calls.summary IS NOT NULL 
    AND calls.summary != ''
    AND calls.called_at >= NOW() - (days_back || ' days')::INTERVAL
  GROUP BY c.id, c.name, c.company
  HAVING COUNT(calls.id) > 0
  ORDER BY COUNT(calls.id) DESC;
END;
$$;

-- 생성된 스몰토크를 저장하는 함수
CREATE OR REPLACE FUNCTION insert_smalltalk_items(
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
BEGIN
  -- JSONB 배열의 각 항목을 순회하며 삽입
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO smalltalk_cache (
      contact_id,
      topic,
      content,
      expires_at
    )
    VALUES (
      p_contact_id,
      v_item->>'topic',
      v_item->>'content',
      (NOW() + ((v_item->>'days')::INTEGER || ' days')::INTERVAL)
    );
    
    v_inserted_count := v_inserted_count + 1;
  END LOOP;
  
  RETURN v_inserted_count;
END;
$$;

-- 권한 설정 (anon 롤도 호출 가능하도록)
GRANT EXECUTE ON FUNCTION get_recent_calls_for_smalltalk(INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_recent_calls_for_smalltalk(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_smalltalk_items(UUID, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION insert_smalltalk_items(UUID, JSONB) TO authenticated;

-- 테스트 쿼리
-- SELECT * FROM get_recent_calls_for_smalltalk(7);

-- 사용 예시:
-- SELECT insert_smalltalk_items(
--   'contact-uuid-here'::UUID,
--   '[
--     {"topic": "프로젝트 진행 현황", "content": "지난 주 논의한 프로젝트는 어떻게 진행되고 있나요?", "days": 7},
--     {"topic": "예산 승인 건", "content": "제안서 검토 결과는 어떻게 나왔나요?", "days": 10}
--   ]'::JSONB
-- );
