/*
 * Diary 목록 조회 성능 테스트 - AFTER
 *
 * 전체 데이터: 약 100,003건
 * 조회 데이터: 101건
 *
 * 적용 인덱스:
 * IDX_diaries_user_diary_date
 * ("userId", "diaryDate")
 *
 * 1회: 0.249 ms
 * 2회: 0.591 ms
 * 3회: 0.306 ms
 * 4회: 0.178 ms
 * 5회: 0.064 ms
 *
 * 평균: 0.278 ms
 * 중앙값: 0.249 ms
 *
 * 평균 기준 개선:
 * 15.952 ms -> 0.278 ms
 * 약 57.5배 향상
 * Execution Time 약 98.3% 감소
 *
 */

EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM diaries
WHERE "userId" = '872f3326-551b-4905-94df-f0a6917d607d'
ORDER BY "diaryDate" DESC;

