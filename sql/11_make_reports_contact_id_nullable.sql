-- reports 테이블의 contact_id를 nullable로 변경
-- 조직 리포트는 특정 연락처와 연결되지 않음

-- contact_id를 nullable로 변경
ALTER TABLE public.reports 
  ALTER COLUMN contact_id DROP NOT NULL;

-- 외래키 제약조건 삭제 후 재생성 (CASCADE 유지)
ALTER TABLE public.reports 
  DROP CONSTRAINT IF EXISTS reports_contact_id_fkey;

ALTER TABLE public.reports 
  ADD CONSTRAINT reports_contact_id_fkey 
  FOREIGN KEY (contact_id) 
  REFERENCES public.contacts(id) 
  ON DELETE CASCADE;

-- 조직 리포트 타입 추가를 위한 코멘트
COMMENT ON COLUMN public.reports.contact_id IS '연락처 ID (조직 리포트의 경우 NULL)';
COMMENT ON COLUMN public.reports.type IS '리포트 타입: organization_trends (조직 동향), call_summary (통화 요약) 등';
