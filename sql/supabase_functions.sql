CREATE OR REPLACE FUNCTION public.get_dashboard_counts(
  start_ts timestamptz DEFAULT NULL,
  end_ts   timestamptz DEFAULT NULL,
  companies text[] DEFAULT NULL
)
RETURNS TABLE(
  contact_count bigint,
  report_count bigint,
  action_count bigint
) AS $$
BEGIN
  RETURN QUERY
  WITH filtered_contacts AS (
    SELECT * FROM contacts c
    WHERE (start_ts IS NULL OR c.last_contact >= start_ts)
      AND (end_ts   IS NULL OR c.last_contact <= end_ts)
      AND (
        companies IS NULL OR array_length(companies, 1) IS NULL
        OR c.company = ANY (companies)
      )
  ), filtered_reports AS (
    SELECT * FROM reports r
    WHERE (start_ts IS NULL OR r.created_at >= start_ts)
      AND (end_ts   IS NULL OR r.created_at <= end_ts)
  ), filtered_actions AS (
    SELECT * FROM actions a
    WHERE (start_ts IS NULL OR a.due_date >= start_ts)
      AND (end_ts   IS NULL OR a.due_date <= end_ts)
  )
  SELECT
    (SELECT COUNT(*) FROM filtered_contacts) AS contact_count,
    (SELECT COUNT(*) FROM filtered_reports)  AS report_count,
    (SELECT COUNT(*) FROM filtered_actions)  AS action_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recommended indexes for performance (execute in SQL console once)
-- CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company);
-- CREATE INDEX IF NOT EXISTS idx_contacts_last_contact ON contacts(last_contact);
-- CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
-- CREATE INDEX IF NOT EXISTS idx_actions_due_date ON actions(due_date);

-- SQL helper functions for Supabase (run these once in your Supabase SQL editor)

-- 1) get_companies: return distinct company names
CREATE OR REPLACE FUNCTION public.get_companies()
RETURNS TABLE(company text) AS $$
  SELECT DISTINCT company FROM public.contacts WHERE company IS NOT NULL ORDER BY company;
$$ LANGUAGE sql STABLE;

-- Notes:
-- 1) Open Supabase SQL editor and run this file to create functions.
-- 2) After creation, your client can call:
--    supabase.rpc('get_companies')
--    supabase.rpc('get_dashboard_counts', { start_ts: '...', end_ts: '...', companies: ['ACME'] })
