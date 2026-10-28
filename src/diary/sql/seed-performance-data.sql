/*
 * Diary 성능 테스트용 데이터 생성
 *
 * 전체 테스트 데이터: 100,000건
 *
 * test@test.com
 * → 조회 성능 측정 대상
 * → 100건
 *
 * 나머지 테스트 사용자
 * → 99,900건
 */

-- 이전 성능 테스트 데이터가 있으면 삭제
DELETE FROM diaries
WHERE title LIKE 'PERF_TEST_%';


-- 1. 조회 대상 사용자에게 일기 100건 생성
INSERT INTO diaries (
    title,
    content,
    "diaryDate",
    "createdAt",
    "updatedAt",
    "userId"
)
SELECT
    'PERF_TEST_TARGET_' || g,
    '성능 테스트용 일기',
    CURRENT_DATE - (g % 365),
    NOW(),
    NOW(),
    u.id
FROM generate_series(1, 100) AS g
CROSS JOIN users u
WHERE u.email = 'test@test.com';


-- 2. 다른 사용자에게 일기 99,900건 생성
INSERT INTO diaries (
    title,
    content,
    "diaryDate",
    "createdAt",
    "updatedAt",
    "userId"
)
SELECT
    'PERF_TEST_OTHER_' || g,
    '성능 테스트용 더미 일기',
    CURRENT_DATE - (g % 3650),
    NOW(),
    NOW(),
    CASE
        WHEN g % 2 = 0 THEN (
            SELECT id
            FROM users
            WHERE email = 'fey@google.com'
        )
        ELSE (
            SELECT id
            FROM users
            WHERE email = 'test1@test.com'
        )
    END
FROM generate_series(1, 99900) AS g;

-- 전체 Diary 개수
SELECT COUNT(*) AS total_diaries
FROM diaries;


-- 사용자별 Diary 개수
SELECT
    u.email,
    COUNT(d.id) AS diary_count
FROM users u
LEFT JOIN diaries d
    ON d."userId" = u.id
GROUP BY u.id, u.email
ORDER BY diary_count DESC;