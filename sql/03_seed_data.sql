-- =====================================================
-- 테스트 데이터 시드
-- =====================================================
-- 실행 순서: 3번째 (선택 사항)
-- Supabase SQL Editor에서 실행하세요
-- 주의: 이 스크립트는 개발/테스트 환경에서만 사용하세요!

-- =====================================================
-- 사용자 ID 확인
-- =====================================================
-- 실행 전에 먼저 사용자를 생성하고 로그인해야 합니다.
-- Supabase Dashboard → Authentication → Users에서 사용자 ID를 확인하세요.
-- 아래 변수를 실제 사용자 ID로 교체하세요.

DO $$
DECLARE
  v_user_id UUID := auth.uid(); -- 현재 로그인한 사용자 ID (SQL Editor에서는 NULL일 수 있음)
  v_contact_id_1 UUID;
  v_contact_id_2 UUID;
  v_contact_id_3 UUID;
  v_contact_id_4 UUID;
BEGIN
  -- 사용자 ID가 없으면 경고 메시지 출력
  IF v_user_id IS NULL THEN
    RAISE WARNING '⚠️ 사용자가 인증되지 않았습니다. SQL Editor에서는 auth.uid()가 NULL입니다.';
    RAISE WARNING '대안: 1) 프론트엔드에서 로그인 후 실행';
    RAISE WARNING '     2) 또는 아래 주석을 해제하고 실제 사용자 UUID를 입력하세요:';
    RAISE WARNING '     v_user_id := ''00000000-0000-0000-0000-000000000000''::UUID;';
    RETURN;
  END IF;

  -- =====================================================
  -- 1. Contacts 데이터 삽입
  -- =====================================================
  
  INSERT INTO public.contacts (id, name, company, position, phone, phone_link, email, address, last_contact, user_id) 
  VALUES
    (gen_random_uuid(), '홍길동', 'ABC기술', '부장', '010-1234-5678', 'tel:010-1234-5678', 'hong@abc.com', '서울시 강남구 테헤란로 123', NOW() - INTERVAL '1 day', v_user_id),
    (gen_random_uuid(), '김철수', 'XYZ솔루션', '팀장', '010-2345-6789', 'tel:010-2345-6789', 'kim@xyz.com', '서울시 서초구 서초대로 456', NOW() - INTERVAL '3 days', v_user_id),
    (gen_random_uuid(), '이영희', 'DEF컨설팅', '이사', '010-3456-7890', 'tel:010-3456-7890', 'lee@def.com', '서울시 마포구 월드컵북로 789', NOW() - INTERVAL '5 days', v_user_id),
    (gen_random_uuid(), '박민수', '123인터내셔널', '대리', '010-4567-8901', 'tel:010-4567-8901', 'park@123.com', '서울시 영등포구 여의대로 321', NOW() - INTERVAL '7 days', v_user_id),
    (gen_random_uuid(), '최지영', 'ABC기술', '과장', '010-5678-9012', 'tel:010-5678-9012', 'choi@abc.com', '서울시 송파구 올림픽로 111', NOW() - INTERVAL '10 days', v_user_id),
    (gen_random_uuid(), '정우성', 'Global무역', '본부장', '010-6789-0123', 'tel:010-6789-0123', 'jung@global.com', '서울시 중구 세종대로 999', NOW() - INTERVAL '2 days', v_user_id)
  RETURNING id INTO v_contact_id_1;

  -- 연락처 ID 가져오기
  SELECT id INTO v_contact_id_1 FROM public.contacts WHERE name = '홍길동' AND user_id = v_user_id LIMIT 1;
  SELECT id INTO v_contact_id_2 FROM public.contacts WHERE name = '김철수' AND user_id = v_user_id LIMIT 1;
  SELECT id INTO v_contact_id_3 FROM public.contacts WHERE name = '이영희' AND user_id = v_user_id LIMIT 1;
  SELECT id INTO v_contact_id_4 FROM public.contacts WHERE name = '박민수' AND user_id = v_user_id LIMIT 1;

  -- =====================================================
  -- 2. Reports 데이터 삽입
  -- =====================================================
  
  INSERT INTO public.reports (contact_id, type, content, created_at, user_id)
  VALUES
    (v_contact_id_1, '월간보고', '이번 달 매출 목표 달성률 95% 기록. 주요 제품 A의 판매량이 전월 대비 20% 증가했으며, 신규 고객 유치도 순조롭게 진행 중입니다.', NOW() - INTERVAL '2 days', v_user_id),
    (v_contact_id_2, '분기보고', '1분기 실적 요약: 매출 120억 달성, 영업이익률 15%. 2분기 목표는 130억이며, 신제품 출시를 통한 매출 확대 계획 중입니다.', NOW() - INTERVAL '5 days', v_user_id),
    (v_contact_id_3, '주간보고', '주간 업무 진행 상황: 컨설팅 프로젝트 3건 완료, 신규 계약 2건 체결. 고객 만족도 조사 결과 평균 4.5/5점을 기록했습니다.', NOW() - INTERVAL '1 day', v_user_id),
    (v_contact_id_1, '상담보고', '신제품 도입 관련 상담 진행. 예산 승인 대기 중이며, 다음 주 초에 최종 의사결정 예정입니다.', NOW() - INTERVAL '4 days', v_user_id),
    (v_contact_id_4, '방문보고', '사무실 방문하여 시스템 데모 시연. 긍정적인 반응을 얻었으며, 추가 미팅 일정 조율 중입니다.', NOW() - INTERVAL '6 days', v_user_id);

  -- =====================================================
  -- 3. Calls 데이터 삽입
  -- =====================================================
  
  INSERT INTO public.calls (contact_id, summary, duration, called_at, user_id)
  VALUES
    (v_contact_id_1, '신제품 소개 및 견적 논의. 고객이 제품 사양에 대해 긍정적인 반응을 보였으며, 다음 주 정식 제안서를 요청함.', 1200, NOW() - INTERVAL '1 day', v_user_id),
    (v_contact_id_2, '프로젝트 진행 현황 공유. 일정이 계획대로 진행 중이며, 다음 마일스톤은 이번 주 금요일로 설정됨.', 900, NOW() - INTERVAL '3 days', v_user_id),
    (v_contact_id_3, '계약 조건 협의. 결제 조건 및 납기일에 대해 합의점을 찾았으며, 법무팀 검토 후 최종 서명 예정.', 1500, NOW() - INTERVAL '5 days', v_user_id),
    (v_contact_id_1, '추가 요구사항 확인. 커스터마이징 필요 항목 3가지를 리스트업하고, 기술팀과 협의 후 회신 약속.', 600, NOW() - INTERVAL '8 days', v_user_id),
    (v_contact_id_4, '분기 실적 리뷰. 목표 대비 실적 분석 및 다음 분기 계획 수립. 마케팅 예산 증액 검토 중.', 1800, NOW() - INTERVAL '2 days', v_user_id);

  -- =====================================================
  -- 4. Actions 데이터 삽입
  -- =====================================================
  
  INSERT INTO public.actions (contact_id, type, description, due_date, status, user_id)
  VALUES
    (v_contact_id_1, '미팅', '고객 미팅 및 제안서 발표. 회의실 예약 완료, 발표 자료 최종 검토 필요.', NOW() + INTERVAL '3 days', 'pending', v_user_id),
    (v_contact_id_2, '전화', '분기 실적 관련 전화 통화. 실적 보고서 사전 공유 예정.', NOW() + INTERVAL '1 day', 'pending', v_user_id),
    (v_contact_id_3, '이메일', '견적서 이메일 발송. 계약서 초안 첨부, 법무팀 검토 완료.', NOW() + INTERVAL '5 days', 'pending', v_user_id),
    (v_contact_id_4, '방문', '사무실 방문 및 상담. 데모 장비 준비, 주차권 발급 완료.', NOW() + INTERVAL '7 days', 'in_progress', v_user_id),
    (v_contact_id_1, '전화', '프로젝트 킥오프 미팅 일정 조율', NOW() + INTERVAL '2 days', 'pending', v_user_id),
    (v_contact_id_2, '미팅', '계약 갱신 논의', NOW() + INTERVAL '14 days', 'pending', v_user_id),
    (v_contact_id_3, '이메일', '월간 뉴스레터 발송', NOW() + INTERVAL '10 days', 'completed', v_user_id);

  -- =====================================================
  -- 5. Smalltalk Cache 데이터 삽입
  -- =====================================================
  
  INSERT INTO public.smalltalk_cache (contact_id, topic, content, expires_at, user_id)
  VALUES
    (v_contact_id_1, '골프 라운딩', '지난 주말 라운딩 어떠셨어요? 지난 번에 말씀하신 드라이버 교체는 해보셨나요?', NOW() + INTERVAL '10 days', v_user_id),
    (v_contact_id_1, '자녀 교육', '자녀분이 대학 입시 준비 중이시라고 들었는데, 요즘 입시 상황은 어떤가요?', NOW() + INTERVAL '7 days', v_user_id),
    (v_contact_id_2, '커피 취향', '지난 번 미팅 때 아메리카노 선호하신다고 하셔서, 다음에는 원두도 준비해볼게요.', NOW() + INTERVAL '5 days', v_user_id),
    (v_contact_id_2, '산업 뉴스', '어제 업계 뉴스에 AI 관련 신기술 기사가 있던데, 혹시 눈여겨보신 부분 있으신가요?', NOW() + INTERVAL '14 days', v_user_id),
    (v_contact_id_3, '취미 생활', '등산 동호회 활동하신다고 하셨죠? 요즘 좋은 코스 다녀오신 게 있으신가요?', NOW() + INTERVAL '7 days', v_user_id),
    (v_contact_id_4, '건강 관리', '최근 헬스장 등록하셨다고 들었는데, 루틴은 잘 유지되고 계신가요?', NOW() + INTERVAL '10 days', v_user_id);

  -- =====================================================
  -- 6. Notifications 데이터 삽입
  -- =====================================================
  
  INSERT INTO public.notifications (type, title, message, "userId", read, created_at)
  VALUES
    ('report', '새로운 리포트', '홍길동님의 월간보고가 등록되었습니다.', v_user_id, FALSE, NOW() - INTERVAL '1 hour'),
    ('schedule', '일정 알림', '내일 김철수님과의 전화 통화가 예정되어 있습니다.', v_user_id, FALSE, NOW() - INTERVAL '2 hours'),
    ('news', '업계 뉴스', 'AI 기술 관련 새로운 소식: 신제품 출시 발표', v_user_id, FALSE, NOW() - INTERVAL '5 hours'),
    ('report', '리포트 승인', '이영희님의 주간보고가 승인되었습니다.', v_user_id, TRUE, NOW() - INTERVAL '1 day'),
    ('schedule', '미팅 알림', '다음 주 화요일 홍길동님과의 미팅이 확정되었습니다.', v_user_id, TRUE, NOW() - INTERVAL '2 days');

  -- =====================================================
  -- 완료 메시지
  -- =====================================================
  RAISE NOTICE '✅ 테스트 데이터 생성 완료!';
  RAISE NOTICE '생성된 데이터:';
  RAISE NOTICE '  - 연락처: % 건', (SELECT COUNT(*) FROM public.contacts WHERE user_id = v_user_id);
  RAISE NOTICE '  - 리포트: % 건', (SELECT COUNT(*) FROM public.reports WHERE user_id = v_user_id);
  RAISE NOTICE '  - 통화 기록: % 건', (SELECT COUNT(*) FROM public.calls WHERE user_id = v_user_id);
  RAISE NOTICE '  - 액션 아이템: % 건', (SELECT COUNT(*) FROM public.actions WHERE user_id = v_user_id);
  RAISE NOTICE '  - 스몰토크: % 건', (SELECT COUNT(*) FROM public.smalltalk_cache WHERE user_id = v_user_id);
  RAISE NOTICE '  - 알림: % 건', (SELECT COUNT(*) FROM public.notifications WHERE "userId" = v_user_id);
  
END $$;
