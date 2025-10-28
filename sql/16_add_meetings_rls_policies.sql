-- 미팅 테이블에 대한 RLS 정책 설정

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can only see their own meetings" ON meetings;
DROP POLICY IF EXISTS "Users can insert their own meetings" ON meetings;
DROP POLICY IF EXISTS "Users can update their own meetings" ON meetings;
DROP POLICY IF EXISTS "Users can delete their own meetings" ON meetings;

-- RLS 활성화
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- 조회 정책: 사용자는 자신의 연락처에 연결된 미팅만 볼 수 있음
CREATE POLICY "Users can only see their own meetings" ON meetings
FOR SELECT USING (
  contact_id IN (
    SELECT id FROM contacts WHERE user_id = auth.uid()
  )
);

-- 삽입 정책: 사용자는 자신의 연락처에만 미팅을 추가할 수 있음
CREATE POLICY "Users can insert their own meetings" ON meetings
FOR INSERT WITH CHECK (
  contact_id IN (
    SELECT id FROM contacts WHERE user_id = auth.uid()
  )
);

-- 업데이트 정책: 사용자는 자신의 연락처에 연결된 미팅만 수정할 수 있음
CREATE POLICY "Users can update their own meetings" ON meetings
FOR UPDATE USING (
  contact_id IN (
    SELECT id FROM contacts WHERE user_id = auth.uid()
  )
) WITH CHECK (
  contact_id IN (
    SELECT id FROM contacts WHERE user_id = auth.uid()
  )
);

-- 삭제 정책: 사용자는 자신의 연락처에 연결된 미팅만 삭제할 수 있음
CREATE POLICY "Users can delete their own meetings" ON meetings
FOR DELETE USING (
  contact_id IN (
    SELECT id FROM contacts WHERE user_id = auth.uid()
  )
);

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ 미팅 테이블 RLS 정책이 설정되었습니다!';
  RAISE NOTICE '사용자는 이제 자신의 연락처에 연결된 미팅만 조회/수정할 수 있습니다.';
END $$;