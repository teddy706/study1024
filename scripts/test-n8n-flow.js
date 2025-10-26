#!/usr/bin/env node
/**
 * n8n 워크플로우 시뮬레이터
 * - Supabase RPC(get_recent_calls_for_smalltalk)로 최근 통화 요약 조회
 * - OpenAI Chat Completions로 스몰토크 2-3개 생성
 * - Supabase RPC(insert_smalltalk_items)로 DB에 저장
 * - 최근 생성된 smalltalk_cache 레코드 조회 및 출력
 *
 * 사용법 (PowerShell):
 *   $env:SUPABASE_URL="https://xxx.supabase.co"
 *   $env:SUPABASE_KEY="eyJ..."
 *   $env:OPENAI_API_KEY="sk-..."
 *   node ./scripts/test-n8n-flow.js --days 7 --limit 3
 *
 * 옵션:
 *   --days <n>   : 최근 n일 조회 (기본 7)
 *   --limit <n>  : 최대 n명의 고객만 처리 (기본 3, 0이면 모두)
 *   --contact <uuid> : 특정 고객만 처리
 *   --debug      : 상세 디버그 로그 출력
 */

const DAYS_DEFAULT = 7;
const LIMIT_DEFAULT = 3;

const env = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_KEY: process.env.SUPABASE_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
};

let DEBUG = false;

function debug(...args) {
  if (DEBUG) console.log('[DEBUG]', ...args);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { days: DAYS_DEFAULT, limit: LIMIT_DEFAULT, contact: null };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--days' && args[i + 1]) { out.days = Number(args[++i]); }
    else if (a === '--limit' && args[i + 1]) { out.limit = Number(args[++i]); }
    else if (a === '--contact' && args[i + 1]) { out.contact = args[++i]; }
    else if (a === '--debug') { DEBUG = true; }
  }
  return out;
}

function assertEnv() {
  const missing = Object.entries(env).filter(([,v]) => !v).map(([k]) => k);
  if (missing.length) {
    console.error('❌ 환경 변수 누락:', missing.join(', '));
    console.error('필수: SUPABASE_URL, SUPABASE_KEY, OPENAI_API_KEY');
    console.error('\nPowerShell에서 설정:');
    console.error('  $env:SUPABASE_URL="https://xxx.supabase.co"');
    console.error('  $env:SUPABASE_KEY="eyJ..."');
    console.error('  $env:OPENAI_API_KEY="sk-..."');
    process.exit(1);
  }
  debug('환경 변수:', {
    SUPABASE_URL: env.SUPABASE_URL,
    SUPABASE_KEY: env.SUPABASE_KEY?.slice(0, 20) + '...',
    OPENAI_API_KEY: env.OPENAI_API_KEY?.slice(0, 20) + '...',
  });
}

async function supabaseRpc(fnName, body) {
  const url = `${env.SUPABASE_URL}/rest/v1/rpc/${fnName}`;
  debug(`Supabase RPC 호출: ${fnName}`, body);
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': env.SUPABASE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(body || {}),
  });
  
  const text = await res.text();
  debug(`응답 상태: ${res.status} ${res.statusText}`);
  debug(`응답 본문 (처음 200자):`, text.slice(0, 200));
  
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  
  if (!res.ok) {
    console.error(`❌ Supabase RPC ${fnName} 실패:`);
    console.error(`   상태: ${res.status} ${res.statusText}`);
    console.error(`   URL: ${url}`);
    console.error(`   응답:`, text.slice(0, 500));
    throw new Error(`Supabase RPC ${fnName} 실패: ${res.status} ${res.statusText}`);
  }
  return data;
}

async function supabaseSelectRecentSmalltalk(limit = 10) {
  const url = new URL(`${env.SUPABASE_URL}/rest/v1/smalltalk_cache`);
  url.searchParams.set('select', 'contact_id,topic,content,created_at');
  url.searchParams.set('order', 'created_at.desc');
  url.searchParams.set('limit', String(limit));
  
  debug(`Supabase SELECT 호출:`, url.toString());
  
  const res = await fetch(url, {
    headers: {
      'apikey': env.SUPABASE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_KEY}`,
    },
  });
  
  if (!res.ok) {
    const text = await res.text();
    console.error(`❌ Supabase select 실패: ${res.status} ${res.statusText}`);
    console.error(`   응답:`, text.slice(0, 500));
    throw new Error(`Supabase select 실패: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function openaiGenerate(contactName, recentSummaries) {
  const payload = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: '당신은 영업 담당자를 위한 스몰토크 주제 생성 전문가입니다. 고객과의 최근 통화 내용을 기반으로 자연스럽고 친근한 대화 주제를 만들어주세요.' },
      { role: 'user', content: `고객명: ${contactName}\n\n최근 통화 요약:\n${recentSummaries}\n\n위 통화 내용을 바탕으로 다음 만남 시 사용할 수 있는 스몰토크 주제 2-3개를 JSON 배열로 생성해주세요. 각 항목은 다음 형식을 따라야 합니다:\n[{\"topic\": \"주제 제목 (15자 이내)\", \"content\": \"구체적인 질문이나 언급 (50-80자)\", \"days\": 유효 기간(일수, 5-14 사이)}]\n\n응답은 반드시 유효한 JSON 배열만 포함해야 합니다.` },
    ],
    temperature: 0.8,
    max_tokens: 500,
  };
  
  debug(`OpenAI 호출 (고객: ${contactName})`);
  
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  
  const json = await res.json();
  
  if (!res.ok) {
    console.error(`❌ OpenAI 오류: ${res.status} ${res.statusText}`);
    console.error(`   응답:`, JSON.stringify(json, null, 2).slice(0, 500));
    throw new Error(`OpenAI 오류: ${res.status} ${res.statusText}`);
  }
  
  const content = json?.choices?.[0]?.message?.content ?? '';
  debug(`OpenAI 응답 내용:`, content.slice(0, 200));
  
  try {
    const arr = JSON.parse(content);
    if (!Array.isArray(arr)) throw new Error('JSON 배열이 아님');
    return arr;
  } catch (e) {
    console.warn(`⚠️  JSON 파싱 실패 (${contactName}): ${e.message}`);
    console.warn(`   OpenAI 응답:`, content.slice(0, 200));
    // 폴백 1개 생성
    return [{ topic: '최근 통화 후속', content: '지난번 통화 내용 관련하여 추가로 논의할 사항이 있나요?', days: 7 }];
  }
}

async function main() {
  assertEnv();
  const { days, limit, contact } = parseArgs();
  
  console.log(`\n🚀 [시작] n8n 워크플로우 시뮬레이션`);
  console.log(`   조회 기간: 최근 ${days}일`);
  console.log(`   처리 제한: ${limit > 0 ? limit + '명' : '제한 없음'}`);
  if (contact) console.log(`   특정 고객: ${contact}`);
  console.log();

  // 1) 최근 통화 요약 조회
  console.log('📞 [1/4] 최근 통화 데이터 조회 중...');
  const rows = await supabaseRpc('get_recent_calls_for_smalltalk', { days_back: days });
  let targets = Array.isArray(rows) ? rows : [];
  
  console.log(`   ✓ 조회됨: ${targets.length}명`);
  
  if (contact) {
    targets = targets.filter(r => r.contact_id === contact);
    console.log(`   ✓ 필터링 후: ${targets.length}명`);
  }
  if (limit > 0) {
    targets = targets.slice(0, limit);
    console.log(`   ✓ 제한 적용: ${targets.length}명`);
  }

  if (!targets.length) {
    console.log('\n⚠️  처리할 고객이 없습니다.');
    console.log('   - 최근 통화 요약이 있는지 확인하세요.');
    console.log('   - --days 옵션을 늘려보세요 (예: --days 30)');
    process.exit(0);
  }

  console.log(`\n🤖 [2/4] OpenAI로 스몰토크 생성 중...`);
  let totalInserted = 0;
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < targets.length; i++) {
    const r = targets[i];
    console.log(`\n   [${i + 1}/${targets.length}] ${r.contact_name} (${r.company || '회사 미지정'})`);
    
    try {
      // 2) OpenAI로 생성
      const items = await openaiGenerate(r.contact_name, r.recent_summaries || '');
      console.log(`      ✓ 생성: ${items.length}개`);
      debug(`      생성된 항목:`, JSON.stringify(items, null, 2));

      // 3) DB에 저장
      const inserted = await supabaseRpc('insert_smalltalk_items', {
        p_contact_id: r.contact_id,
        p_items: items,
      });
      const count = typeof inserted === 'number' ? inserted : Number(inserted?.[0] ?? 0);
      console.log(`      ✓ 저장: ${count}개`);
      totalInserted += count || 0;
      successCount++;
    } catch (err) {
      console.error(`      ❌ 실패: ${err.message}`);
      failCount++;
    }
  }

  console.log(`\n💾 [3/4] 저장 완료`);
  console.log(`   성공: ${successCount}명 / 실패: ${failCount}명`);
  console.log(`   총 저장: ${totalInserted}개`);

  // 4) 최근 생성 결과 확인
  console.log(`\n🔍 [4/4] 최근 생성된 항목 조회...`);
  const recent = await supabaseSelectRecentSmalltalk(10);
  console.log(`   ✓ 조회: ${recent.length}개`);
  
  if (recent.length > 0) {
    console.log('\n📋 최근 생성 항목 (최대 10개):');
    for (const r of recent) {
      const time = new Date(r.created_at).toLocaleString('ko-KR');
      console.log(`   • [${time}] ${r.topic}`);
      console.log(`     ${r.content.slice(0, 60)}${r.content.length > 60 ? '...' : ''}`);
    }
  }
  
  console.log(`\n✅ 완료!\n`);
}

main().catch(err => {
  console.error('\n❌ 치명적 오류:', err.message);
  if (DEBUG) {
    console.error('\n상세 스택:');
    console.error(err.stack);
  }
  process.exit(1);
});
