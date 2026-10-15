/*
 * Diary 목록 조회 성능 테스트 - BEFORE
 *
 * 전체 데이터: 약 100,003건
 * 조회 데이터: 101건
 *
* BEFORE 측정
 *
 * 인덱스: userId, diaryDate 적용 전
 *
 * 1회: 11.378 ms
 * 2회: 20.003 ms
 * 3회: 21.507 ms
 * 4회: 13.130 ms
 * 5회: 13.740 ms

 * 평균: 15.952 ms
 * 중앙값: 13.740 ms
 */



EXPLAIN (ANALYSE, BUFFERS)
SELECT * FROM diaries
WHERE "userId" = '872f3326-551b-4905-94df-f0a6917d607d'
ORDER BY "diaryDate" DESC;