-- =====================================================
-- 간단한 테스트 데이터 (RLS 비활성화 버전)
-- =====================================================
-- 이 스크립트는 RLS를 고려하지 않고 직접 데이터를 삽입합니다.
-- 사용 방법:
-- 1. Supabase Dashboard → Authentication → Users에서 사용자 생성
-- 2. 생성된 사용자의 UUID를 복사
-- 3. 아래 YOUR_USER_UUID를 실제 UUID로 교체
-- 4. SQL Editor에서 실행

-- ⚠️ 아래 UUID를 실제 사용자 UUID로 교체하세요!
-- 예: db1cae9d-5426-4cad-97ef-9c5c52ff2f36

-- 임시로 RLS 비활성화
ALTER TABLE public.contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.actions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.smalltalk_cache DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- 1. Contacts 데이터 삽입
INSERT INTO public.contacts (name, company, position, phone, phone_link, email, address, last_contact, user_id) 
VALUES
  ('홍길동', 'ABC기술', '부장', '010-1234-5678', 'tel:010-1234-5678', 'hong@abc.com', '서울시 강남구 테헤란로 123', NOW() - INTERVAL '1 day', 'db1cae9d-5426-4cad-97ef-9c5c52ff2f36'),
  ('김철수', 'XYZ솔루션', '팀장', '010-2345-6789', 'tel:010-2345-6789', 'kim@xyz.com', '서울시 서초구 서초대로 456', NOW() - INTERVAL '3 days', 'db1cae9d-5426-4cad-97ef-9c5c52ff2f36'),
  ('이영희', 'DEF컨설팅', '이사', '010-3456-7890', 'tel:010-3456-7890', 'lee@def.com', '서울시 마포구 월드컵북로 789', NOW() - INTERVAL '5 days', 'db1cae9d-5426-4cad-97ef-9c5c52ff2f36'),
  ('박민수', '123인터내셔널', '대리', '010-4567-8901', 'tel:010-4567-8901', 'park@123.com', '서울시 영등포구 여의대로 321', NOW() - INTERVAL '7 days', 'db1cae9d-5426-4cad-97ef-9c5c52ff2f36'),
  ('최지영', 'ABC기술', '과장', '010-5678-9012', 'tel:010-5678-9012', 'choi@abc.com', '서울시 송파구 올림픽로 111', NOW() - INTERVAL '10 days', 'db1cae9d-5426-4cad-97ef-9c5c52ff2f36'),
  ('정우성', 'Global무역', '본부장', '010-6789-0123', 'tel:010-6789-0123', 'jung@global.com', '서울시 중구 세종대로 999', NOW() - INTERVAL '2 days', 'db1cae9d-5426-4cad-97ef-9c5c52ff2f36');

-- 2. Reports 데이터 삽입
INSERT INTO public.reports (contact_id, type, content, created_at, user_id)
SELECT 
  c.id,
  '월간보고',
  '이번 달 매출 목표 달성률 95% 기록. 주요 제품 A의 판매량이 전월 대비 20% 증가했으며, 신규 고객 유치도 순조롭게 진행 중입니다.',
  NOW() - INTERVAL '2 days',
  'db1cae9d-5426-4cad-97ef-9c5c52ff2f36'
FROM public.contacts c WHERE c.name = '홍길동' LIMIT 1;

INSERT INTO public.reports (contact_id, type, content, created_at, user_id)
SELECT 
  c.id,
  '분기보고',
  '1분기 실적 요약: 매출 120억 달성, 영업이익률 15%. 2분기 목표는 130억이며, 신제품 출시를 통한 매출 확대 계획 중입니다.',
  NOW() - INTERVAL '5 days',
  'db1cae9d-5426-4cad-97ef-9c5c52ff2f36'
FROM public.contacts c WHERE c.name = '김철수' LIMIT 1;

INSERT INTO public.reports (contact_id, type, content, created_at, user_id)
SELECT 
  c.id,
  '주간보고',
  '주간 업무 진행 상황: 컨설팅 프로젝트 3건 완료, 신규 계약 2건 체결. 고객 만족도 조사 결과 평균 4.5/5점을 기록했습니다.',
  NOW() - INTERVAL '1 day',
  'db1cae9d-5426-4cad-97ef-9c5c52ff2f36'
FROM public.contacts c WHERE c.name = '이영희' LIMIT 1;

-- 3. Calls 데이터 삽입
INSERT INTO public.calls (contact_id, summary, duration, called_at, user_id)
SELECT 
  c.id,
  '신제품 소개 및 견적 논의. 고객이 제품 사양에 대해 긍정적인 반응을 보였으며, 다음 주 정식 제안서를 요청함.',
  1200,
  NOW() - INTERVAL '1 day',
  'db1cae9d-5426-4cad-97ef-9c5c52ff2f36'
FROM public.contacts c WHERE c.name = '홍길동' LIMIT 1;

INSERT INTO public.calls (contact_id, summary, duration, called_at, user_id)
SELECT 
  c.id,
  '프로젝트 진행 현황 공유. 일정이 계획대로 진행 중이며, 다음 마일스톤은 이번 주 금요일로 설정됨.',
  900,
  NOW() - INTERVAL '3 days',
  'db1cae9d-5426-4cad-97ef-9c5c52ff2f36'
FROM public.contacts c WHERE c.name = '김철수' LIMIT 1;

-- 4. Actions 데이터 삽입
INSERT INTO public.actions (contact_id, type, description, due_date, status, user_id)
SELECT 
  c.id,
  '미팅',
  '고객 미팅 및 제안서 발표. 회의실 예약 완료, 발표 자료 최종 검토 필요.',
  NOW() + INTERVAL '3 days',
  'pending',
  'db1cae9d-5426-4cad-97ef-9c5c52ff2f36'
FROM public.contacts c WHERE c.name = '홍길동' LIMIT 1;

INSERT INTO public.actions (contact_id, type, description, due_date, status, user_id)
SELECT 
  c.id,
  '전화',
  '분기 실적 관련 전화 통화. 실적 보고서 사전 공유 예정.',
  NOW() + INTERVAL '1 day',
  'pending',
  'db1cae9d-5426-4cad-97ef-9c5c52ff2f36'
FROM public.contacts c WHERE c.name = '김철수' LIMIT 1;

-- 5. Smalltalk Cache 데이터 삽입
INSERT INTO public.smalltalk_cache (contact_id, topic, content, expires_at, user_id)
SELECT 
  c.id,
  '골프 라운딩',
  '지난 주말 라운딩 어떠셨어요? 지난 번에 말씀하신 드라이버 교체는 해보셨나요?',
  NOW() + INTERVAL '10 days',
  'db1cae9d-5426-4cad-97ef-9c5c52ff2f36'
FROM public.contacts c WHERE c.name = '홍길동' LIMIT 1;

INSERT INTO public.smalltalk_cache (contact_id, topic, content, expires_at, user_id)
SELECT 
  c.id,
  '커피 취향',
  '지난 번 미팅 때 아메리카노 선호하신다고 하셔서, 다음에는 원두도 준비해볼게요.',
  NOW() + INTERVAL '5 days',
  'db1cae9d-5426-4cad-97ef-9c5c52ff2f36'
FROM public.contacts c WHERE c.name = '김철수' LIMIT 1;

-- 6. Notifications 데이터 삽입
INSERT INTO public.notifications (type, title, message, "userId", read, created_at)
VALUES
  ('report', '새로운 리포트', '홍길동님의 월간보고가 등록되었습니다.', 'db1cae9d-5426-4cad-97ef-9c5c52ff2f36', FALSE, NOW() - INTERVAL '1 hour'),
  ('schedule', '일정 알림', '내일 김철수님과의 전화 통화가 예정되어 있습니다.', 'db1cae9d-5426-4cad-97ef-9c5c52ff2f36', FALSE, NOW() - INTERVAL '2 hours'),
  ('news', '업계 뉴스', 'AI 기술 관련 새로운 소식: 신제품 출시 발표', 'db1cae9d-5426-4cad-97ef-9c5c52ff2f36', FALSE, NOW() - INTERVAL '5 hours');

-- RLS 다시 활성화
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smalltalk_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ 테스트 데이터 생성 완료!';
  RAISE NOTICE '생성된 데이터:';
  RAISE NOTICE '  - 연락처: % 건', (SELECT COUNT(*) FROM public.contacts WHERE user_id = 'db1cae9d-5426-4cad-97ef-9c5c52ff2f36');
  RAISE NOTICE '  - 리포트: % 건', (SELECT COUNT(*) FROM public.reports WHERE user_id = 'db1cae9d-5426-4cad-97ef-9c5c52ff2f36');
  RAISE NOTICE '  - 통화 기록: % 건', (SELECT COUNT(*) FROM public.calls WHERE user_id = 'db1cae9d-5426-4cad-97ef-9c5c52ff2f36');
  RAISE NOTICE '  - 액션 아이템: % 건', (SELECT COUNT(*) FROM public.actions WHERE user_id = 'db1cae9d-5426-4cad-97ef-9c5c52ff2f36');
  RAISE NOTICE '  - 스몰토크: % 건', (SELECT COUNT(*) FROM public.smalltalk_cache WHERE user_id = 'db1cae9d-5426-4cad-97ef-9c5c52ff2f36');
  RAISE NOTICE '  - 알림: % 건', (SELECT COUNT(*) FROM public.notifications WHERE "userId" = 'db1cae9d-5426-4cad-97ef-9c5c52ff2f36');
END $$;
