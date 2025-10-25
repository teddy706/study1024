-- SQL helper functions for Supabase (run these once in your Supabase SQL editor)

-- 1) get_companies: return distinct company names
CREATE OR REPLACE FUNCTION public.get_companies()
RETURNS TABLE(company text) AS $$
  SELECT DISTINCT company FROM public.contacts WHERE company IS NOT NULL ORDER BY company;
$$ LANGUAGE sql STABLE;

-- 2) get_dashboard_counts: aggregated counts for dashboard KPIs
CREATE OR REPLACE FUNCTION public.get_dashboard_counts(start_ts timestamptz DEFAULT NULL, end_ts timestamptz DEFAULT NULL)
RETURNS TABLE(contact_count bigint, report_count bigint, action_count bigint) AS $$
  SELECT
    (SELECT COUNT(*) FROM public.contacts WHERE ($1 IS NULL OR last_contact >= $1) AND ($2 IS NULL OR last_contact <= $2)) AS contact_count,
    (SELECT COUNT(*) FROM public.reports WHERE ($1 IS NULL OR created_at >= $1) AND ($2 IS NULL OR created_at <= $2)) AS report_count,
    (SELECT COUNT(*) FROM public.actions WHERE ($1 IS NULL OR due_date >= $1) AND ($2 IS NULL OR due_date <= $2)) AS action_count;
$$ LANGUAGE sql STABLE;

-- Notes:
-- 1) Open Supabase SQL editor and run this file to create functions.
-- 2) After creation, your client can call: supabase.rpc('get_companies') and supabase.rpc('get_dashboard_counts', { start_ts: '...', end_ts: '...' })
