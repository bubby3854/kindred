-- ============================================================
-- Localize categories to Korean
--
-- kindred targets Korean users only (per product spec). Categories were
-- seeded in English; translate name/description while keeping slugs
-- (used in URLs like /c/productivity) untouched.
-- ============================================================
update public.categories set
  name = '생산성',
  description = '할 일을 정리하고 효율적으로 처리하는 도구'
where slug = 'productivity';

update public.categories set
  name = '개발자 도구',
  description = 'API, 개발 유틸리티, 개발 경험 향상 도구'
where slug = 'developer';

update public.categories set
  name = '교육·학습',
  description = '학습 플랫폼, 강의, 공부 도우미'
where slug = 'education';

update public.categories set
  name = '소셜',
  description = '커뮤니티, 네트워킹, 메신저'
where slug = 'social';

update public.categories set
  name = '엔터테인먼트',
  description = '게임, 미디어, 즐길거리'
where slug = 'entertainment';

update public.categories set
  name = '금융',
  description = '가계부, 투자, 결제, 자산 관리'
where slug = 'finance';

update public.categories set
  name = '건강·웰니스',
  description = '운동, 명상, 의료'
where slug = 'health';

update public.categories set
  name = '기타',
  description = '그 외 무엇이든'
where slug = 'other';
