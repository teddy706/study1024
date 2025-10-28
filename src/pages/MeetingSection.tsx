import React, { useEffect, useState } from 'react';
import { addMeeting, getMeetings } from '../services/meeting.service';
import ScheduleService from '../services/schedule.service';
import ActionsList from '../components/dashboard/ActionsList';
import type { Meeting } from '../types/meeting';
import type { Database } from '../types/supabase';

type Action = Database['public']['Tables']['actions']['Row'];

interface MeetingSectionProps {
  contactId: string;
  lastContact: string | null;
  onMeetingAdded?: (date: string) => void;
}

const PAGE_SIZE = 3;

const MeetingSection: React.FC<MeetingSectionProps> = ({ contactId, lastContact, onMeetingAdded }) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actions, setActions] = useState<Action[]>([]);
  const [actionsLoading, setActionsLoading] = useState(false);
  const scheduleService = new ScheduleService();

  const loadMeetings = async (p = 1) => {
    setLoading(true);
    try {
      const { data, count } = await getMeetings(contactId, p, PAGE_SIZE);
      setMeetings(data || []);
      setTotal(count || 0);
    } catch (e) {
      alert('미팅 기록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadActions = async () => {
    setActionsLoading(true);
    try {
      console.log('🔄 MeetingSection: 일정 로딩 시작, contactId:', contactId);
      const data = await scheduleService.getActions({ contactId, limit: 20 });
      console.log('✅ MeetingSection: 일정 로딩 완료, 개수:', data.length);
      setActions(data);
    } catch (e) {
      console.error('💥 MeetingSection: 일정 로딩 실패:', e);
    } finally {
      setActionsLoading(false);
    }
  };

  useEffect(() => {
    loadMeetings(page);
    loadActions();
    // eslint-disable-next-line
  }, [contactId, page]);

  const handleAddMeeting = async () => {
    if (!memo.trim()) {
      alert('메모를 입력해주세요.');
      return;
    }
    setSaving(true);
    try {
      const meeting = await addMeeting(contactId, memo);
      setMemo('');
      setShowModal(false);
      setPage(1);
      loadMeetings(1);
      if (onMeetingAdded && (meeting as any).met_at) onMeetingAdded((meeting as any).met_at);
    } catch (e) {
      alert('미팅 기록 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
      <div className="flex items-center gap-4 mb-2">
        <span className="font-semibold text-blue-700">최근 미팅 날짜:</span>
        <span className="text-gray-800">{lastContact ? new Date(lastContact).toLocaleDateString('ko-KR') : '기록 없음'}</span>
        <button
          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          onClick={() => setShowModal(true)}
        >
          미팅
        </button>
      </div>
      {/* 미팅 기록 리스트 */}
      <div className="mt-2">
        <h4 className="text-sm font-semibold text-blue-700 mb-2">미팅 이력</h4>
        {loading ? (
          <div className="text-gray-500">불러오는 중...</div>
        ) : meetings.length === 0 ? (
          <div className="text-gray-400">미팅 기록이 없습니다.</div>
        ) : (
          <ul className="space-y-2">
            {meetings.map(m => (
              <li key={m.id} className="bg-white rounded border p-3 text-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-blue-600">{new Date(m.met_at).toLocaleDateString('ko-KR')}</span>
                  <span className="text-xs text-gray-400">{new Date(m.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="text-gray-800 whitespace-pre-line">{m.memo}</div>
              </li>
            ))}
          </ul>
        )}
        {/* 페이지네이션 */}
        {total > PAGE_SIZE && (
          <div className="flex gap-2 mt-3 justify-end">
            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-2 py-1 text-xs bg-gray-200 rounded">이전</button>
            <span className="text-xs">{page} / {Math.ceil(total / PAGE_SIZE)}</span>
            <button disabled={page * PAGE_SIZE >= total} onClick={() => setPage(page + 1)} className="px-2 py-1 text-xs bg-gray-200 rounded">다음</button>
          </div>
        )}
      </div>
      {/* 메모 입력 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs">
            <h3 className="text-lg font-bold mb-2">미팅 메모 남기기</h3>
            <textarea
              value={memo}
              onChange={e => setMemo(e.target.value)}
              rows={3}
              className="w-full border rounded p-2 mb-3"
              placeholder="미팅 내용을 간단히 남겨주세요"
              maxLength={300}
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowModal(false)} className="px-3 py-1 bg-gray-200 rounded">취소</button>
              <button onClick={handleAddMeeting} disabled={saving} className="px-3 py-1 bg-blue-600 text-white rounded">{saving ? '저장 중...' : '저장'}</button>
            </div>
          </div>
        </div>
      )}

      {/* 일정 관리 섹션 */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 일정 관리</h3>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {actionsLoading ? (
            <div className="text-center py-8">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-green-600 border-r-transparent"></div>
              <p className="mt-2 text-sm text-gray-500">일정을 불러오는 중...</p>
            </div>
          ) : (
            <>
              {console.log('🎯 MeetingSection: ActionsList에 전달할 props:', { 
                actionsLength: actions.length, 
                contactId, 
                showAIAnalysis: true 
              })}
              <ActionsList 
                actions={actions} 
                itemsPerPage={5}
                showAIAnalysis={true}
                contactId={contactId}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeetingSection;
