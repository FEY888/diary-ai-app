# Diary AI — 트러블슈팅 및 기술적 의사결정

개발 과정에서 마주친 문제를 **문제 → 원인 분석 → 해결 → 검증** 순서로 기록합니다.

| # | 주제 | 키워드 |
| --- | --- | --- |
| 1 | [일기 목록 조회 성능 개선 (복합 인덱스)](#1-일기-목록-조회-성능-개선-복합-인덱스) | 인덱스, EXPLAIN ANALYZE |
| 2 | [AI 분석 중복 요청으로 인한 OpenAI 중복 호출](#2-ai-분석-중복-요청으로-인한-openai-중복-호출) | 동시성, 조건부 UPDATE |
| 3 | [서버 장애 시 분석 락이 해제되지 않는 문제](#3-서버-장애-시-분석-락이-해제되지-않는-문제) | 락 만료(TTL), 소유권 확인 |
| 4 | [락 상태 변경이 일기 수정 시각을 바꾸는 문제](#4-락-상태-변경이-일기-수정-시각을-바꾸는-문제) | TypeORM, UpdateDateColumn |
| 5 | [OpenAI 호출 실패 시 오류 처리](#5-openai-호출-실패-시-오류-처리) | 외부 API, 503 |
| 6 | [일기 수정 시 기존 AI 분석과의 정합성](#6-일기-수정-시-기존-ai-분석과의-정합성) | 트랜잭션 |
| - | [남은 과제](#남은-과제) | |

---

## 1. 일기 목록 조회 성능 개선 (복합 인덱스)

> 관련 커밋: `620ded8 perf: 다이어리 목록 조회 복합 인덱스(userId, diaryDate) 적용 및 성능 측정`

### 1) 문제 상황

일기 목록 API(`GET /diaries`)는 로그인한 사용자의 일기만 `diaryDate` 내림차순으로 반환합니다.

```ts
// src/diary/diary.service.ts - diaryFindAll()
this.diaryRepository.findAndCount({
  where: { user: { id: userId } },
  skip: take * (page - 1),
  take,
  order: { diaryDate: 'DESC' },
});
```

운영 중 장애가 난 것은 아닙니다. 일기는 사용자 수와 작성 기간에 비례해 계속 쌓이는 테이블이고, 목록 조회는 가장 자주 호출되는 API입니다. 그래서 데이터가 많아졌을 때의 비용을 **미리 측정**했습니다.

### 2) 원인 분석

**스키마 확인** — 인덱스 추가 전 `diaries` 테이블의 인덱스는 PK(`id`) 하나뿐이었습니다.

```sql
-- src/migrations/1790704167958-InitialMigration.ts
CREATE TABLE "diaries" (..., "userId" uuid NOT NULL, CONSTRAINT "PK_..." PRIMARY KEY ("id"));
ALTER TABLE "diaries" ADD CONSTRAINT "FK_..." FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
```

- PostgreSQL은 FK를 만들 때 **참조하는 쪽(`diaries.userId`)에 인덱스를 자동으로 만들지 않습니다.** (참조되는 `users.id`는 PK라서 인덱스가 있음)
- 그래서 `WHERE "userId" = ?` 조건을 인덱스로 좁힐 수 없고, 조건에 맞는 행을 찾은 다음 `diaryDate`로 다시 정렬해야 합니다.

**측정 결과로 확인한 것** — 약 10만 건 중 101건을 조회하는 데 평균 15.952 ms가 걸렸습니다. (4번 표)

> 인덱스 적용 전후의 실행 계획 원문(Seq Scan / Index Scan, Sort 노드, Buffers)은 기록해 두지 않았습니다.
> 그래서 "전체 테이블을 순차 스캔했다"는 것은 스키마를 근거로 한 **판단**이고, 실행 계획으로 확인한 사실은 아닙니다. 재측정 계획은 6번에 정리했습니다.

### 3) 해결 방법

조회 조건(`userId`, 등치 비교)과 정렬 기준(`diaryDate`)을 순서대로 묶은 복합 인덱스를 마이그레이션으로 추가했습니다.

```ts
// src/diary/entities/diary.entity.ts
@Index('IDX_diaries_user_diary_date', ['user', 'diaryDate'])
```

```sql
-- src/migrations/1791653488772-AddDiaryUserDiaryDateIndex.ts
CREATE INDEX "IDX_diaries_user_diary_date" ON "diaries" ("userId", "diaryDate");
```

컬럼 순서를 `(userId, diaryDate)`로 정한 이유:

- B-tree 복합 인덱스는 **앞 컬럼이 같은 값인 범위 안에서 뒤 컬럼 순서로 정렬**되어 있습니다.
- `userId`를 등치 조건으로 고정하면, 해당 범위의 항목은 이미 `diaryDate` 순서입니다. 그래서 정렬 없이 인덱스 순서대로 읽을 수 있습니다.
- B-tree는 역방향으로도 읽을 수 있어서, `DESC` 정렬을 위해 `DESC` 인덱스를 따로 만들 필요가 없습니다.
- 순서를 반대로 `(diaryDate, userId)`로 두면 `userId`로 범위를 좁힐 수 없습니다.

### 4) 개선 전후 성능 비교

**측정 조건**

| 항목 | 내용 |
| --- | --- |
| 환경 | 로컬 PostgreSQL (Docker `postgres:17`) |
| 데이터 | `diaries` 약 100,003건 (시드 99,900 + 대상 사용자 100 + 기존 3) |
| 대상 | 특정 사용자의 일기 101건 |
| 데이터 생성 | [`seed-performance-data.sql`](../src/diary/sql/seed-performance-data.sql) |
| 측정 | `EXPLAIN (ANALYZE, BUFFERS)`의 Execution Time, 적용 전 · 후 각 5회 |
| 측정 SQL | [`diary-list-before.sql`](../src/diary/sql/performance/diary-list-before.sql), [`diary-list-after.sql`](../src/diary/sql/performance/diary-list-after.sql) |

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM diaries
WHERE "userId" = '<대상 사용자 id>'
ORDER BY "diaryDate" DESC;
```

**결과 (ms)**

| 회차 | 적용 전 | 적용 후 |
| ---: | ---: | ---: |
| 1 | 11.378 | 0.249 |
| 2 | 20.003 | 0.591 |
| 3 | 21.507 | 0.306 |
| 4 | 13.130 | 0.178 |
| 5 | 13.740 | 0.064 |
| **평균** | **15.952** | **0.278** |
| **중앙값** | **13.740** | **0.249** |

- 평균 기준 약 57배 (실행 시간 98.3% 감소)
- 중앙값 기준 약 55배

**해석할 때 주의할 점**

| 한계 | 영향 |
| --- | --- |
| 측정 쿼리에 `LIMIT/OFFSET`이 없음 | 실제 API는 `LIMIT 20 OFFSET n`과 `COUNT(*)` 쿼리를 함께 실행합니다. 수치는 실제 API 쿼리가 아니라 같은 조건 · 정렬의 전체 조회 기준입니다. |
| 실행 계획 원문 미보관 | 어떤 스캔 방식으로 바뀌었는지 문서로 증명할 수 없습니다. |
| 캐시 상태 미통제 | 적용 후 수치가 0.064~0.591 ms로 9배 이상 차이 납니다. 버퍼 캐시 상태에 따라 값이 달라졌을 가능성이 있습니다. |
| 로컬 단일 환경, 5회 | 운영 환경(RDS) 수치로 일반화할 수 없습니다. |
| DB 실행 시간만 측정 | 네트워크, 직렬화를 포함한 API 응답 시간은 측정하지 않았습니다. |

### 5) 기술적 의사결정과 트레이드오프

| 선택지 | 판단 |
| --- | --- |
| `userId` 단일 인덱스 | 조건 필터는 되지만 `diaryDate` 정렬 단계가 남습니다. |
| **`(userId, diaryDate)` 복합 인덱스** | **선택.** 필터와 정렬을 인덱스 하나로 처리할 수 있습니다. 앞 컬럼이 `userId`라서 FK 조건만 쓰는 조회(사용자 삭제 시 CASCADE 등)에도 쓸 수 있습니다. |
| `(userId, diaryDate DESC)` | B-tree는 역방향 스캔이 가능해서 이득이 없다고 판단했습니다. |
| 커버링 인덱스 (`INCLUDE`) | 목록 응답에 `content`(text)가 포함되어 인덱스가 지나치게 커집니다. |

**비용**

- `INSERT`와 `userId` · `diaryDate` 변경 시 인덱스도 함께 갱신해야 해서 쓰기 비용과 저장 공간이 늘어납니다. 일기는 쓰기보다 조회가 많아 받아들일 수 있다고 판단했습니다.
- `CREATE INDEX`는 실행되는 동안 테이블 쓰기를 막습니다. 데이터가 많은 운영 DB라면 `CREATE INDEX CONCURRENTLY`가 필요합니다. (TypeORM 마이그레이션은 기본적으로 트랜잭션 안에서 실행되는데, `CONCURRENTLY`는 트랜잭션 안에서 쓸 수 없어 별도 처리가 필요합니다.)

**이 인덱스로 해결되지 않는 것**

- `OFFSET` 페이지네이션은 뒤 페이지로 갈수록 건너뛸 행을 모두 읽어야 합니다.
- `findAndCount()`는 요청마다 `COUNT(*)`를 실행합니다.
- 정렬 키가 `diaryDate` 하나라서 같은 날짜의 일기가 여러 개면 페이지 사이에서 순서가 바뀔 수 있습니다. `ORDER BY "diaryDate" DESC, id DESC`처럼 고유한 보조 정렬 키가 필요합니다.

### 6) 재발 방지 및 추가 검증

**인덱스 관리 원칙**

- 스키마는 `synchronize: false`, 마이그레이션으로만 변경합니다. 인덱스도 엔티티의 `@Index`와 마이그레이션에 함께 남겨 코드에서 추적할 수 있게 했습니다.
- 새 조회 API를 만들 때 `WHERE` · `ORDER BY` 컬럼에 맞는 인덱스가 있는지 확인합니다. FK 컬럼에는 인덱스가 자동으로 생기지 않는다는 점을 함께 확인합니다.

**추가 검증 (예정)**

1. 실제 API 쿼리로 다시 측정 — TypeORM 로그(`logging: true`)로 실제 SQL을 확인하고, `LIMIT 20 OFFSET 0`, 뒤쪽 페이지, `COUNT(*)`를 각각 측정합니다.
2. 실행 계획 원문 보관 — 인덱스 적용 전후의 `EXPLAIN (ANALYZE, BUFFERS)` 출력 전체를 저장합니다.
3. 측정 조건 통일 — 시드 후 `ANALYZE diaries;` 실행, 측정 전 동일 쿼리로 워밍업 후 N회 측정.
4. 인덱스 전후 비교는 운영 데이터가 없는 로컬 DB에서, 트랜잭션 안에서 인덱스를 지웠다가 되돌리는 방식으로 진행합니다.

```sql
-- 로컬 DB 전용: DROP INDEX도 트랜잭션 안에서 ROLLBACK 가능
BEGIN;
DROP INDEX "IDX_diaries_user_diary_date";
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM diaries WHERE "userId" = '<id>' ORDER BY "diaryDate" DESC LIMIT 20 OFFSET 0;
ROLLBACK;
```

---

## 2. AI 분석 중복 요청으로 인한 OpenAI 중복 호출

### 문제

같은 일기에 분석 요청이 동시에 들어오면, 두 요청이 모두 "기존 분석 없음"을 확인한 뒤
**OpenAI를 각각 호출**할 수 있었습니다. 외부 API 비용이 중복으로 발생합니다.

### 원인 분석

```
요청 A: findOne() → 분석 없음 ─┐
요청 B: findOne() → 분석 없음 ─┼→ 둘 다 OpenAI 호출
```

"조회"와 "분석 시작"이 분리되어 있어, 그 사이에 다른 요청이 끼어들 수 있었습니다.

### 해결

`diaries` 테이블에 `analysisStatus`(`IDLE` / `PROCESSING`) 컬럼을 두고,
PostgreSQL의 **조건부 UPDATE**로 분석 권한을 선점하도록 했습니다.

```sql
UPDATE diaries SET "analysisStatus" = 'PROCESSING'
WHERE id = :id AND "analysisStatus" = 'IDLE';
```

- UPDATE는 **단일 문장으로 원자적으로 실행**되므로, 동시에 실행되어도 `affected = 1`인 요청은 하나뿐입니다.
- 선점에 실패한 요청은 `409 Conflict`를 반환합니다.
- 선점에 성공한 요청은 분석이 끝나면 `finally`에서 `IDLE`로 되돌립니다.
- 선점 직후 기존 분석을 한 번 더 확인해, 직전에 다른 요청이 저장한 결과가 있으면 그대로 반환합니다.

이 방식을 적용한 뒤, **서버 장애 시 락이 해제되지 않는 문제**를 발견했습니다 → [3번](#3-서버-장애-시-분석-락이-해제되지-않는-문제)

---

## 3. 서버 장애 시 분석 락이 해제되지 않는 문제

### 문제

락 해제가 애플리케이션의 `finally` 블록에만 의존하고 있었습니다.

```
tryStartAnalysis()     : IDLE → PROCESSING   (DB에 기록)
OpenAI 호출
finally finishAnalysis(): PROCESSING → IDLE   (애플리케이션이 실행)
```

아래 상황에서는 `finally`가 실행되지 않습니다.

- 배포 중 서버 재시작, 메모리 부족(OOM), 프로세스 강제 종료
- `finishAnalysis` 실행 시점의 DB 연결 끊김

그러면 해당 일기는 **영구히 `PROCESSING`으로 남고**, 이후 모든 분석 요청이 `409`를 받습니다.

### 원인 분석

락의 **상태는 DB**에 있지만, 락을 **해제하는 주체는 애플리케이션 프로세스**입니다.
락을 잡은 프로세스가 사라지면 해제할 주체도 사라집니다.
즉, **소유자가 사라져도 풀리는 장치(만료)**가 없는 것이 원인이었습니다.

### 해결 방안 비교

| 방안 | 장점 | 단점 | 선택 |
| --- | --- | --- | --- |
| 서버 시작 시 `PROCESSING` 일괄 초기화 | 구현이 간단 | 서버가 여러 대이면 다른 서버의 정상 작업까지 해제. DB 연결 끊김은 해결 못 함 | ✕ |
| PostgreSQL 행 락 / advisory lock | 세션이 끊기면 자동 해제 | OpenAI 응답을 기다리는 동안 **DB 커넥션을 점유** → 커넥션 풀 고갈 위험 | ✕ |
| Redis 락 (`SET NX EX`) | TTL 락의 표준 구현 | 현재 규모에서 인프라 추가는 과함 | ✕ |
| **락 만료 시간(TTL)** | 컬럼 1개와 조건 1개로 해결. 서버 대수와 무관 | 만료 시간과 작업 시간의 관계를 설계해야 함 | ✔ |

외부 API를 호출하는 동안 DB 커넥션을 오래 잡지 않으면서 가장 단순한 **TTL 방식**을 선택했습니다.

### 해결 1: 분석 시작 시각 기록 + 만료된 락 재획득

`analysisStartedAt`(`timestamptz`, nullable) 컬럼을 추가하고, 선점 조건을 다음과 같이 바꿨습니다.

> `IDLE`이거나, `PROCESSING`이면서 시작 후 **5분이 지난** 경우 선점 가능

```ts
const result = await this.diaryRepository.update(
  [
    { id: diaryId, analysisStatus: 'IDLE' },
    { id: diaryId, analysisStatus: 'PROCESSING', analysisStartedAt: LessThanOrEqual(expireBefore) },
  ],
  { analysisStatus: 'PROCESSING', analysisStartedAt: now, /* ... */ },
);
return result.affected === 1 ? now : null;
```

- TypeORM `update()`의 조건에 **배열을 넘기면 OR 조건**으로 변환됩니다.
  QueryBuilder로 SQL을 직접 작성하는 방법도 검토했지만, 기존 `update()` 스타일을 유지할 수 있어 배열 방식을 선택했습니다.
- 여전히 **UPDATE 한 문장**이므로 2번의 원자성이 그대로 유지됩니다.
- 반환값을 `boolean`에서 **획득한 락의 시작 시각**(`Date | null`)으로 바꿨습니다. 이 값은 해제할 때 소유권을 증명하는 데 쓰입니다.

실제로 실행된 SQL:

```sql
UPDATE "diaries" SET "analysisStatus" = $1, "analysisStartedAt" = $2, "updatedAt" = "updatedAt"
WHERE (("id" = $3 AND "analysisStatus" = $4)
    OR ("id" = $5 AND "analysisStatus" = $6 AND "analysisStartedAt" <= $7))
```

### 해결 2: 이전 작업이 새 작업의 락을 해제하지 못하게 보호

TTL을 도입하면 새로운 경쟁 조건이 생깁니다.

1. 작업 A가 락을 획득했지만 지연됨
2. 5분이 지나 작업 B가 락을 재획득
3. A가 뒤늦게 끝나 `finishAnalysis` 실행
4. **B의 락이 해제됨** → 또 다른 요청이 들어올 수 있음

해제 조건에 **"내가 획득한 시각"**을 포함해 해결했습니다.

```ts
await this.diaryRepository.update(
  { id: diaryId, analysisStatus: 'PROCESSING', analysisStartedAt: startedAt },
  { analysisStatus: 'IDLE', analysisStartedAt: null, /* ... */ },
);
```

### 해결 3: 작업 시간 < 락 만료 시간 보장

작업이 락 만료(5분)보다 오래 걸리면 두 작업이 동시에 실행될 수 있습니다.
OpenAI 클라이언트에 상한을 설정했습니다.

```ts
new OpenAI({ apiKey, timeout: 60_000, maxRetries: 0 });
```

SDK의 기본 재시도는 2회라서, 최악의 경우 60초 × 3회에 대기 시간까지 더해집니다.
`maxRetries: 0`으로 최대 작업 시간을 명확하게 했습니다.

### 설계 시 고려한 점: 시간 정밀도와 시계 기준

락 시각을 DB(`NOW()`)에서 만들면 문제가 생길 수 있습니다.

- PostgreSQL은 **마이크로초**, JS `Date`는 **밀리초** 정밀도입니다.
  DB 값을 JS로 가져와 다시 `=`로 비교하면 불일치가 생길 수 있고, 그러면 락이 영원히 해제되지 않는 **새로운 고착**이 발생합니다.

그래서 **애플리케이션에서 만든 `Date`를 저장하고 그대로 반환**하도록 설계했습니다.
저장한 값과 비교할 값이 같은 `Date`이므로 정밀도 불일치가 생기지 않습니다.

- **트레이드오프**: 서버가 여러 대이면 서버 간 시계 차이가 생길 수 있습니다.
  NTP로 동기화된 시계의 오차는 보통 1초 미만이고 락 만료는 5분이므로, 영향이 없다고 판단했습니다.

### 검증

**① 단위 테스트 (Jest)**

- 동시 요청 시 OpenAI 1회 호출, 나머지 요청은 409
- OpenAI가 실패해도 **획득한 시각 그대로** `finishAnalysis` 호출 (`toHaveBeenCalledWith(4, startedAt)`)

테스트가 실제로 버그를 잡는지 확인하기 위해 **`finishAnalysis` 호출을 일부러 주석 처리**했고,
'OpenAI 실패' 테스트와 '동시 요청' 테스트 **2개가 실패**하는 것을 확인했습니다.

관련 테스트: [`diary_analysis.service.spec.ts`](../src/diary_analysis/diary_analysis.service.spec.ts)

**② 실제 PostgreSQL 검증**

Mock 테스트로는 SQL 조건이 맞는지 알 수 없어서, 별도 테스트 DB에 실제 마이그레이션을 적용하고
**실제 `DiaryService` / `DiaryAnalysisService`**를 실행해 검증했습니다. OpenAI만 가짜 구현으로 대체했습니다.

| 시나리오 | 기대 | 결과 |
| --- | --- | --- |
| 락 획득 동시 2회 | 성공 1 / 실패 1 | 통과 |
| 분석 API 동시 10회 | OpenAI 1회, 409 9건, 종료 후 `IDLE` | 통과 |
| 1분 전 `PROCESSING` (유효한 락) | 획득 실패 | 통과 |
| 경계값 4분 59초 / 5분 1초 | 실패 / 성공 | 통과 |
| **10분 전 `PROCESSING` (서버 장애 상황)** | **재획득 성공** | 통과 |
| DB 저장 시각 == 반환 시각 (정밀도) | 같음 | 통과 |
| 이전 작업이 옛 시각으로 해제 시도 | `PROCESSING` 유지 | 통과 |
| 새 작업이 자기 시각으로 해제 | `IDLE` / `NULL` | 통과 |
| 고착된 일기에 분석 API 호출 | 성공, 저장 1건, `IDLE` | 통과 |
| OpenAI 실패 | 503, 저장 0건, `IDLE` | 통과 |

> 이 검증은 임시 검증 스크립트로 수행했으며, 스크립트는 저장소에 포함되어 있지 않습니다.

---

## 4. 락 상태 변경이 일기 수정 시각을 바꾸는 문제

### 문제

3번을 검증하면서 실행 SQL을 확인하다가, **코드에 작성하지 않은** 구문이 들어 있는 것을 발견했습니다.

```sql
UPDATE "diaries" SET "analysisStatus" = $1, ..., "updatedAt" = CURRENT_TIMESTAMP WHERE ...
```

사용자가 일기를 수정하지 않았는데도 **AI 분석만 실행하면 일기의 "마지막 수정 시각"이 바뀌고** 있었습니다.
3번 이전의 락 코드부터 있던 문제입니다.

### 원인 분석

엔티티의 `@UpdateDateColumn`은 `update()`를 실행할 때마다 TypeORM이 `updatedAt`을 자동으로 갱신합니다.
TypeORM 소스(`UpdateQueryBuilder`)를 보면, **set에 `updatedAt`이 없을 때** `"updatedAt" = CURRENT_TIMESTAMP`를 추가합니다.

시스템 내부 상태(락)의 변경이 사용자에게 보이는 데이터에 영향을 주고 있었습니다.

### 해결

set에 `updatedAt`을 직접 넣되, **기존 값 그대로** 넣도록 했습니다.

```ts
updatedAt: () => '"updatedAt"', // SQL: "updatedAt" = "updatedAt" → 변화 없음
```

- `() => '...'`는 값이 아닌 **SQL 표현식**을 그대로 넣는 TypeORM 문법입니다.
- `"updatedAt"`의 큰따옴표는 PostgreSQL에서 대소문자가 섞인 컬럼명을 가리키기 위해 필요합니다.
- 락 획득(`tryStartAnalysis`)과 해제(`finishAnalysis`) 두 곳 모두 적용했습니다.

다른 방법으로 락 전용 테이블을 분리하는 것도 고려했지만, 현재 규모에서는 과하다고 판단했습니다.

### 검증 (실제 PostgreSQL)

| 시나리오 | 기대 | 결과 |
| --- | --- | --- |
| 분석 성공 전후 `updatedAt` | 변화 없음 | 통과 |
| 분석 실패(OpenAI 503) 전후 `updatedAt` | 변화 없음 | 통과 |
| 락 획득·해제 SQL | 모두 `"updatedAt" = "updatedAt"` | 통과 |
| (회귀) 사용자가 일기를 직접 수정 | `updatedAt` 갱신됨 | 통과 |

마지막 항목은 **반대 방향 확인**입니다. 수정 시각이 아예 안 바뀌게 망가뜨린 것이 아니라,
락 변경에만 정확히 적용되었는지 확인했습니다.

---

## 5. OpenAI 호출 실패 시 오류 처리

### 문제

OpenAI 호출 실패를 그대로 노출하거나, 실패한 뒤에 분석 진행 상태가 남아 있으면 사용자가 다시 시도할 수 없습니다.

### 해결

- [`AiService`](../src/ai/ai.service.ts)의 `try/catch`에서 오류를 NestJS `Logger`로 기록
- 클라이언트에는 `ServiceUnavailableException`(**HTTP 503**)으로 응답
- SDK 타임아웃 **60초**, 자동 재시도 **0회** ([3번](#해결-3-작업-시간--락-만료-시간-보장) 참고)
- 분석 서비스의 `try/finally`로 실패 시에도 락 해제

### 검증

- Jest: 503 발생, 분석 결과 `create()`/`save()` 미호출, `finishAnalysis(diaryId, startedAt)` 호출
- 실제 PostgreSQL: 503 응답, 분석 결과 0건, 상태 `IDLE` 복구 ([3번 검증](#검증) 참고)

---

## 6. 일기 수정 시 기존 AI 분석과의 정합성

### 문제

본문을 수정한 뒤에도 이전 본문의 AI 분석이 남아 있으면 **일기 내용과 분석 결과가 맞지 않게** 됩니다.
반대로 제목만 바꿨는데 분석을 삭제하면 불필요한 재분석 비용이 듭니다.

### 해결

- 본문이 전달되었고 **실제로 기존 본문과 다를 때만** 분석 삭제
- 일기 수정과 분석 삭제를 `DataSource.transaction()`으로 묶어 하나만 반영되는 상황 방지
- 제목만 수정하면 기존 분석 유지

관련 코드: [`diary.service.ts`](../src/diary/diary.service.ts)의 `updateDiary()`

### 검증

- 제목만 변경 → 분석 삭제 미호출
- 본문 변경 → 분석 삭제 1회 호출

관련 테스트: [`diary.service.spec.ts`](../src/diary/diary.service.spec.ts) (Mock 기반 분기 검증)

---

## 남은 과제

### 분석 진행 중 본문 수정

분석이 진행되는 동안 사용자가 본문을 수정하면 다음 순서가 가능합니다.

1. 분석 요청이 **수정 전 본문**으로 OpenAI 호출
2. 그사이 본문 수정 → 삭제할 분석이 아직 없으므로 아무것도 삭제되지 않음
3. 분석이 끝나며 **수정 전 본문의 분석 결과가 저장됨**

**개선 방향**: 분석 저장 직전에 본문이 바뀌었는지(`updatedAt` 또는 본문 해시 비교) 확인하거나,
`PROCESSING` 상태에서는 본문 수정을 제한하는 방식을 검토하고 있습니다.

### 락 만료 후 이전 작업의 결과 저장

락이 만료되어 작업 B가 재획득한 뒤, 늦게 끝난 작업 A가 분석 결과를 저장하는 경우입니다.

- OpenAI timeout(60초)이 락 만료(5분)보다 짧아 **사실상 발생하지 않습니다.**
- 발생하더라도 `diary_analyses.diaryId`의 **UNIQUE 제약으로 분석 결과는 1건만 저장**됩니다.
  두 작업 모두 같은 본문을 분석한 결과이므로 데이터가 틀어지지 않습니다.
- 다만 나중에 저장하는 쪽은 UNIQUE 위반(`23505`)으로 **500 에러**를 받습니다.

**개선 방향**: `23505`를 잡아 저장된 분석 결과를 반환하거나 `409`로 응답하도록 처리할 예정입니다.

### 기타

- 락 재획득(TTL 발동)이 일어났을 때 로그를 남겨 운영 중 관찰할 수 있도록 개선
- 실제 PostgreSQL 검증을 저장소에 포함해 자동화
