-- Split phone field into mobile, office_phone, and fax
-- 기존 phone 필드는 유지하면서 새로운 필드들 추가

-- 컬럼이 존재하지 않을 경우에만 추가
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='contacts' AND column_name='mobile') THEN
    ALTER TABLE contacts ADD COLUMN mobile TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='contacts' AND column_name='office_phone') THEN
    ALTER TABLE contacts ADD COLUMN office_phone TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='contacts' AND column_name='fax') THEN
    ALTER TABLE contacts ADD COLUMN fax TEXT;
  END IF;
END $$;

-- 기존 phone 데이터를 mobile로 마이그레이션 (휴대폰 번호로 가정)
UPDATE contacts 
SET mobile = phone 
WHERE phone IS NOT NULL AND phone LIKE '010%' AND mobile IS NULL;

COMMENT ON COLUMN contacts.mobile IS '휴대폰 번호';
COMMENT ON COLUMN contacts.office_phone IS '일반 전화번호 (사무실)';
COMMENT ON COLUMN contacts.fax IS '팩스 번호';
