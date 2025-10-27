-- 사용자가 관심있는 조직(기업/관공서/대학) 관리 테이블
CREATE TABLE IF NOT EXISTS report_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('company', 'government', 'university')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, name)
);

-- 리포트 생성 프롬프트 설정 테이블
CREATE TABLE IF NOT EXISTS report_prompt_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_template TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS 활성화
ALTER TABLE report_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_prompt_settings ENABLE ROW LEVEL SECURITY;

-- RLS 정책: report_organizations
CREATE POLICY "Users can view their own organizations"
  ON report_organizations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own organizations"
  ON report_organizations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own organizations"
  ON report_organizations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own organizations"
  ON report_organizations FOR DELETE
  USING (auth.uid() = user_id);

-- RLS 정책: report_prompt_settings
CREATE POLICY "Users can view their own prompt settings"
  ON report_prompt_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prompt settings"
  ON report_prompt_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prompt settings"
  ON report_prompt_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prompt settings"
  ON report_prompt_settings FOR DELETE
  USING (auth.uid() = user_id);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_report_organizations_user_id ON report_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_report_organizations_type ON report_organizations(type);
CREATE INDEX IF NOT EXISTS idx_report_prompt_settings_user_id ON report_prompt_settings(user_id);

-- 기본 프롬프트 템플릿 삽입 함수
CREATE OR REPLACE FUNCTION initialize_default_report_prompt()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO report_prompt_settings (user_id, prompt_template)
  VALUES (
    NEW.id,
    '다음 조직들의 최근 동향을 분석하여 간결한 리포트를 작성해주세요:

조직 목록:
{organizations}

각 조직에 대해:
1. 최근 1개월 이내의 주요 뉴스나 이벤트
2. 사업 확장, 신제품 출시, 인사 변동 등의 중요 변화
3. 비즈니스 관계에 영향을 줄 수 있는 이슈

리포트 형식:
- 조직별로 구분하여 작성
- 각 항목은 2-3문장으로 간결하게 요약
- 출처나 날짜 정보 포함'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 신규 사용자 생성 시 기본 프롬프트 자동 삽입
DROP TRIGGER IF EXISTS trigger_init_report_prompt ON auth.users;
CREATE TRIGGER trigger_init_report_prompt
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_default_report_prompt();

COMMENT ON TABLE report_organizations IS '사용자가 관심을 가지는 조직(기업/관공서/대학) 목록';
COMMENT ON TABLE report_prompt_settings IS '리포트 생성 프롬프트 사용자 설정';
