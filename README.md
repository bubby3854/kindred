# kindred

내가 만든 웹앱을 보여주는 곳. 메이커가 직접 만든 웹앱을 소유권 인증과 함께 소개하는 큐레이티드 디렉토리.

**Stack**: Next.js 16 (App Router) · Supabase · Toss Payments · Tailwind CSS v4 · TypeScript · Pretendard

## 핵심 기능 (v1)

- 소셜 로그인: 카카오 / Google / GitHub / Apple (Supabase Auth)
- 플랜: Free 1슬롯 → Pro / Business 월 구독으로 슬롯 확장 (Toss Payments 빌링키)
- 메타 태그 소유권 검증: 사이트 `<head>`에 `<meta name="kindred-verify" content="…">` 삽입 후 검증
- 구독 해지 시 초과 서비스는 자동 숨김(삭제 아님), 재구독 시 복원
- 관리자 정의 고정 카테고리

## 셋업

### 1. 의존성 설치

```bash
npm install
```

### 2. Supabase 프로젝트 만들기

1. [supabase.com](https://supabase.com)에서 프로젝트 생성. 리전은 **Seoul** 권장
2. `Project Settings → API`에서 URL, anon key, service_role key 복사
3. `Authentication → Providers`에서 다음 프로바이더 활성화:
   - **Kakao** (REST API 키 + Client Secret 등록)
   - **Google**, **GitHub**, **Apple**
   - 각 프로바이더의 redirect URL: `<your-site>/api/auth/callback` (개발 시 `http://localhost:3000/api/auth/callback`)
4. `SQL Editor`에서 `supabase/migrations/0001_init.sql` 실행

### 3. Toss Payments 셋업

1. [tosspayments.com](https://tosspayments.com) 가입 (사업자 등록 필요)
2. 개발자센터에서 **테스트 클라이언트 키 / 시크릿 키** 발급 → `.env.local`에 입력
3. `웹훅(Webhook)` 메뉴에서 `<your-site>/api/toss/webhook` 등록 + 시크릿 복사

### 4. 환경 변수

```bash
cp .env.local.example .env.local
# 필요한 값 채우기
```

### 5. 로컬 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 열기.

## 프로젝트 구조

```
src/
  app/
    (marketing)/page.tsx                -- 홈 (디렉토리)
    (marketing)/c/[slug]/page.tsx       -- 카테고리 상세
    (marketing)/s/[id]/page.tsx         -- 서비스 상세
    (auth)/login/page.tsx               -- 소셜 로그인
    (dashboard)/me/page.tsx             -- 내 페이지 (서비스 + 플랜)
    (dashboard)/me/services/...         -- 서비스 등록/수정
    (dashboard)/me/subscription/...     -- 구독 관리
    api/auth/callback/route.ts          -- OAuth 콜백
    api/services/verify/route.ts        -- 메타 태그 소유권 검증
    api/toss/webhook/route.ts           -- Toss 웹훅 (구독 동기화)
    api/toss/billing/issue/route.ts     -- 빌링키 발급 + 첫 결제
  lib/
    supabase/{server,client,admin,middleware}.ts
    toss.ts                             -- 빌링키 발급/결제, 웹훅 서명 검증
    verify.ts                           -- 사이트 fetch + 메타 태그 파싱
    plans.ts                            -- 플랜→슬롯
    utils.ts
  proxy.ts                              -- Next 16 proxy (세션 갱신 + 보호 라우트)
supabase/
  migrations/0001_init.sql              -- 스키마 + RLS + 시드 카테고리
```

## 노트

- **Next.js 16**은 `middleware.ts` → `proxy.ts`로 이름이 바뀌었고 `cookies()`가 async가 되었음. 본 프로젝트는 둘 다 적용 완료.
- 한글 폰트는 [Pretendard](https://github.com/orioncactus/pretendard) Variable을 jsDelivr CDN으로 로드.
- 플랜별 슬롯 수는 `src/lib/plans.ts`, 가격은 `.env.local`의 `TOSS_*_AMOUNT`에서 조정.
- Toss 빌링은 빌링키 + 30일 주기로 서버에서 charge하는 구조. 정기 결제 cron은 별도 구현 필요(예: Vercel Cron이 `/api/toss/billing/charge`를 호출).
