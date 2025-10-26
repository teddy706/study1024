-- 매일 아침 7시에 스몰토크 자동 생성을 위한 SQL 함수

-- 1) Edge Function을 호출하는 SQL 함수 생성
CREATE OR REPLACE FUNCTION public.trigger_daily_smalltalk_generation()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Edge Function URL (배포 후 실제 URL로 교체)
  PERFORM
    net.http_post(
      url := 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/generate-daily-smalltalk',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
    );
END;
$$;

-- 2) pg_cron 확장 활성화 (Supabase에서 자동 활성화됨)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 3) 매일 오전 7시(한국 시간 기준 UTC+9)에 실행되도록 스케줄 등록
-- 한국 시간 7시 = UTC 22시(전날)
-- Supabase Dashboard → Database → Cron Jobs에서 설정하거나 아래 SQL 실행:

/*
SELECT cron.schedule(
  'daily-smalltalk-generation',  -- job 이름
  '0 22 * * *',                  -- 매일 UTC 22시 (한국 시간 오전 7시)
  $$
  SELECT public.trigger_daily_smalltalk_generation();
  $$
);
*/

-- 4) 스케줄 확인
-- SELECT * FROM cron.job;

-- 5) 스케줄 삭제 (필요시)
-- SELECT cron.unschedule('daily-smalltalk-generation');

-- 주의사항:
-- 1. Supabase Pro 플랜 이상에서만 pg_cron 사용 가능
-- 2. Edge Function을 먼저 배포해야 함
-- 3. service_role_key는 Supabase 대시보드에서 확인
-- 4. net.http_post는 Supabase의 pg_net 확장을 사용

-- 대안: Supabase Dashboard에서 직접 Cron Job 설정
-- Database → Cron Jobs → New cron job
-- Name: daily-smalltalk-generation
-- Schedule: 0 22 * * * (매일 UTC 22시)
-- SQL: SELECT public.trigger_daily_smalltalk_generation();
