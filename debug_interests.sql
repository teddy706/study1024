-- 관심사 데이터 확인 쿼리
-- 이 쿼리로 연락처들의 관심사 데이터를 확인할 수 있습니다

SELECT 
    id,
    name,
    company,
    interests,
    LENGTH(interests) as interests_length,
    CASE 
        WHEN interests IS NULL THEN '❌ NULL'
        WHEN LENGTH(interests) = 0 THEN '❌ 빈 문자열'
        ELSE '✅ 데이터 있음'
    END as interests_status
FROM contacts 
WHERE interests IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 10;

-- 스몰토크 생성 결과 확인
SELECT 
    sc.id,
    sc.topic,
    sc.content,
    sc.created_at,
    c.name as contact_name,
    c.interests,
    sc.meta
FROM smalltalk_cache sc
JOIN contacts c ON c.id = sc.contact_id
ORDER BY sc.created_at DESC
LIMIT 5;