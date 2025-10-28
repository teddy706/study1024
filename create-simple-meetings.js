// 간단한 테스트 미팅 생성 (브라우저 콘솔에서 실행)

async function createSimpleTestMeetings() {
  try {
    if (!window.supabase) {
      console.error('Supabase 클라이언트를 찾을 수 없습니다.');
      return;
    }
    
    const supabase = window.supabase;
    
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('인증이 필요합니다:', authError);
      return;
    }

    // 첫 번째 연락처 가져오기
    const { data: contacts, error: contactError } = await supabase
      .from('contacts')
      .select('id, name')
      .eq('user_id', user.id)
      .limit(1);

    if (contactError || !contacts || contacts.length === 0) {
      console.error('연락처를 찾을 수 없습니다:', contactError);
      return;
    }

    const contact = contacts[0];
    console.log(`연락처 "${contact.name}"에 테스트 미팅 생성 중...`);

    // 간단한 미팅 데이터
    const meetings = [
      {
        memo: "프로젝트 킥오프 미팅\n\n새로운 웹 애플리케이션 개발 프로젝트를 시작하기로 했습니다. 다음주까지 요구사항 문서를 작성하고, 기술 스택을 최종 결정해야 합니다. UI/UX 디자인 시안도 2주 내에 완료하기로 했습니다.\n\n참석자: 개발팀, 기획팀, 디자인팀. 예산 승인 완료. 프로젝트 기간 3개월 예상.",
        met_at: new Date(Date.now() - (1 * 24 * 60 * 60 * 1000)).toISOString() // 1일 전
      },
      {
        memo: "월간 실적 검토 회의\n\n지난달 매출이 목표 대비 15% 초과 달성했습니다. 신규 고객 유치 전략이 효과적이었습니다. 다음달에는 기존 고객 관리에 더 집중하기로 했습니다. 고객 만족도 조사를 실시하고 피드백을 수집해야 합니다.\n\n매출 증가 요인: 온라인 마케팅 강화, 제품 품질 개선. 다음 액션: 고객 서비스 교육 실시",
        met_at: new Date(Date.now() - (3 * 24 * 60 * 60 * 1000)).toISOString() // 3일 전
      },
      {
        memo: "시스템 업그레이드 논의\n\n현재 시스템의 성능 한계로 인해 업그레이드가 필요합니다. 클라우드 전환을 검토하고 있으며, 보안 강화도 함께 진행해야 합니다. 데이터 마이그레이션 계획을 수립하고 백업 전략을 마련해야 합니다.\n\n예상 비용: 500만원, 작업 기간: 2개월, 다운타임 최소화 방안 필요",
        met_at: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)).toISOString() // 1주일 전
      }
    ];

    const meetingsToInsert = meetings.map(meeting => ({
      contact_id: contact.id,
      memo: meeting.memo,
      met_at: meeting.met_at
    }));

    const { data, error } = await supabase
      .from('meetings')
      .insert(meetingsToInsert);

    if (error) {
      console.error('미팅 생성 실패:', error);
      return;
    }

    console.log(`✅ ${meetings.length}개의 테스트 미팅이 생성되었습니다!`);
    console.log(`연락처 ID: ${contact.id}`);
    console.log(`연락처 이름: ${contact.name}`);
    console.log('✨ 이제 연락처 상세 페이지에서 AI 일정 분석을 실행해보세요!');
    
  } catch (error) {
    console.error('오류 발생:', error);
  }
}

// 함수 실행
createSimpleTestMeetings();