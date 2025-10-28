// 테스트용 미팅 데이터 생성 스크립트 (브라우저 콘솔에서 실행)

const testMeetings = [
  {
    title: '프로젝트 킥오프 미팅',
    summary: '새로운 웹 애플리케이션 개발 프로젝트를 시작하기로 했습니다. 다음주까지 요구사항 문서를 작성하고, 기술 스택을 최종 결정해야 합니다. UI/UX 디자인 시안도 2주 내에 완료하기로 했습니다.',
    notes: '참석자: 개발팀, 기획팀, 디자인팀. 예산 승인 완료. 프로젝트 기간 3개월 예상.'
  },
  {
    title: '월간 실적 검토 회의',
    summary: '지난달 매출이 목표 대비 15% 초과 달성했습니다. 신규 고객 유치 전략이 효과적이었습니다. 다음달에는 기존 고객 관리에 더 집중하기로 했습니다. 고객 만족도 조사를 실시하고 피드백을 수집해야 합니다.',
    notes: '매출 증가 요인: 온라인 마케팅 강화, 제품 품질 개선. 다음 액션: 고객 서비스 교육 실시'
  },
  {
    title: '시스템 업그레이드 논의',
    summary: '현재 시스템의 성능 한계로 인해 업그레이드가 필요합니다. 클라우드 전환을 검토하고 있으며, 보안 강화도 함께 진행해야 합니다. 데이터 마이그레이션 계획을 수립하고 백업 전략을 마련해야 합니다.',
    notes: '예상 비용: 500만원, 작업 기간: 2개월, 다운타임 최소화 방안 필요'
  },
  {
    title: '파트너십 협상 미팅',
    summary: '새로운 비즈니스 파트너와의 협력 방안을 논의했습니다. 상호 윈-윈할 수 있는 조건을 찾았고, 계약서 초안을 작성하기로 했습니다. 법무팀 검토 후 최종 서명 예정입니다.',
    notes: '파트너사 강점: 해외 네트워크, 기술력. 협력 분야: 공동 마케팅, 기술 개발'
  },
  {
    title: '직원 교육 프로그램 기획',
    summary: '내년도 직원 교육 계획을 수립했습니다. AI 기술 교육과 디지털 마케팅 교육을 중점적으로 진행하기로 했습니다. 외부 전문 강사를 섭외하고 교육 예산을 확보해야 합니다.',
    notes: '교육 대상: 전 직원, 예상 비용: 200만원, 교육 기간: 분기별 1회씩'
  }
];

async function createTestMeetings() {
  try {
    if (!window.supabase) {
      console.error('Supabase 클라이언트를 찾을 수 없습니다. 로그인된 상태에서 실행해주세요.');
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

    // 새 미팅 데이터 생성
    const meetingsToInsert = testMeetings.map((meeting, index) => ({
      contact_id: contact.id,
      memo: `${meeting.title}\n\n${meeting.summary}\n\n${meeting.notes}`,
      met_at: new Date(Date.now() - (index * 7 * 24 * 60 * 60 * 1000)).toISOString() // 일주일씩 과거로
    }));

    const { data, error } = await supabase
      .from('meetings')
      .insert(meetingsToInsert);

    if (error) {
      console.error('미팅 생성 실패:', error);
      return;
    }

    console.log(`✅ ${testMeetings.length}개의 테스트 미팅이 생성되었습니다!`);
    console.log(`연락처 ID: ${contact.id}`);
    console.log(`연락처 이름: ${contact.name}`);
    console.log('이제 AI 일정 분석을 실행해보세요!');
    
  } catch (error) {
    console.error('오류 발생:', error);
  }
}

// 함수 실행
createTestMeetings();