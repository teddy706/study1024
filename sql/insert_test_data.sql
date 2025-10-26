-- 테스트 데이터 삽입 SQL
-- Supabase SQL Editor에서 실행하세요

-- 1) Contacts 테이블에 테스트 데이터 추가
INSERT INTO public.contacts (name, company, position, phone, phone_link, email, address, last_contact) 
VALUES
  ('홍길동', 'ABC회사', '대리', '010-1234-5678', 'tel:010-1234-5678', 'hong@abc.com', '서울시 강남구', NOW()),
  ('김철수', 'XYZ회사', '과장', '010-2345-6789', 'tel:010-2345-6789', 'kim@xyz.com', '서울시 서초구', NOW() - INTERVAL '1 day'),
  ('이영희', 'DEF회사', '부장', '010-3456-7890', 'tel:010-3456-7890', 'lee@def.com', '서울시 마포구', NOW() - INTERVAL '3 days'),
  ('박민수', 'ABC회사', '사원', '010-4567-8901', 'tel:010-4567-8901', 'park@abc.com', '서울시 영등포구', NOW() - INTERVAL '5 days')
ON CONFLICT DO NOTHING;

-- 2) Reports 테이블에 테스트 데이터 추가
-- 먼저 contact_id를 가져와야 합니다
WITH contact_ids AS (
  SELECT id, name FROM public.contacts WHERE name IN ('홍길동', '김철수', '이영희')
)
INSERT INTO public.reports (contact_id, type, content, created_at)
SELECT 
  c.id,
  CASE 
    WHEN c.name = '홍길동' THEN '월간보고'
    WHEN c.name = '김철수' THEN '분기보고'
    ELSE '주간보고'
  END,
  CASE 
    WHEN c.name = '홍길동' THEN '이번 달 매출 목표 달성률 95% 기록'
    WHEN c.name = '김철수' THEN '1분기 실적 요약 및 2분기 전망'
    ELSE '주간 업무 진행 상황 보고'
  END,
  NOW() - (random() * INTERVAL '7 days')
FROM contact_ids c
ON CONFLICT DO NOTHING;

-- 3) Actions 테이블에 테스트 데이터 추가
WITH contact_ids AS (
  SELECT id, name FROM public.contacts WHERE name IN ('홍길동', '김철수', '이영희', '박민수')
)
INSERT INTO public.actions (contact_id, type, description, due_date, status)
SELECT 
  c.id,
  CASE 
    WHEN c.name = '홍길동' THEN '미팅'
    WHEN c.name = '김철수' THEN '전화'
    WHEN c.name = '이영희' THEN '이메일'
    ELSE '방문'
  END,
  CASE 
    WHEN c.name = '홍길동' THEN '고객 미팅 및 제안서 발표'
    WHEN c.name = '김철수' THEN '분기 실적 관련 전화 통화'
    WHEN c.name = '이영희' THEN '견적서 이메일 발송'
    ELSE '사무실 방문 및 상담'
  END,
  NOW() + (random() * INTERVAL '14 days'),
  CASE 
    WHEN random() > 0.7 THEN 'completed'
    WHEN random() > 0.4 THEN 'in_progress'
    ELSE 'pending'
  END
FROM contact_ids c
ON CONFLICT DO NOTHING;

-- 4) SmalltalkCache(스몰토크) 테스트 데이터 추가
WITH contact_ids AS (
  SELECT id, name FROM public.contacts WHERE name IN ('홍길동', '김철수', '이영희', '박민수')
)
INSERT INTO public.smalltalk_cache (contact_id, topic, content, expires_at, created_at)
SELECT
  c.id,
  x.topic,
  x.content,
  NOW() + (x.expire_days || ' days')::interval AS expires_at,
  NOW() AS created_at
FROM contact_ids c
CROSS JOIN (
  VALUES
    ('최근 골프 라운딩', '지난 주말 라운딩 어떠셨어요? 지난 번에 말씀하신 드라이버 교체는 해보셨나요?', 10),
    ('아이 학부모 상담', '자녀 학교 상담 다녀오셨다고 했는데, 유익했는지 궁금합니다.', 7),
    ('커피 취향', '지난 번 미팅 때 라떼 선호하신다고 하셔서, 다음에는 라떼로 준비드릴게요.', 5),
    ('최근 산업 뉴스', '어제 업계 뉴스에 신제품 관련 기사가 있던데, 혹시 눈여겨보신 부분 있으신가요?', 14)
) AS x(topic, content, expire_days)
ON CONFLICT DO NOTHING;

-- 5) 결과 확인
SELECT 
  (SELECT COUNT(*) FROM public.contacts) as contacts_count,
  (SELECT COUNT(*) FROM public.reports) as reports_count,
  (SELECT COUNT(*) FROM public.actions) as actions_count,
  (SELECT COUNT(*) FROM public.smalltalk_cache) as smalltalk_count;
