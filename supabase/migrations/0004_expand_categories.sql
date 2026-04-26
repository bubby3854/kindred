-- ============================================================
-- Expand categories
--
-- Adds 8 categories common in Korean indie maker output, and refocuses
-- 'entertainment' now that 게임 / 사진·영상 each have dedicated buckets.
-- ============================================================
update public.categories set
  description = '콘텐츠 소비, 팬덤, 여가'
where slug = 'entertainment';

insert into public.categories (slug, name, description, sort_order, is_active) values
  ('ai',        'AI 도구',      'ChatGPT 래퍼, 이미지 생성, AI 번역, 데이터 처리', 15, true),
  ('design',    '디자인',        '디자인 도구, 이미지 편집, 시각화',                25, true),
  ('writing',   '글쓰기·번역',   '작문 도우미, 번역, 요약',                          28, true),
  ('media',     '사진·영상',     '사진·영상 편집, 미디어 생성',                       35, true),
  ('game',      '게임',         '게임, 인터랙티브 즐길거리',                         45, true),
  ('commerce',  '쇼핑·커머스',   '쇼핑몰, 마켓플레이스, 결제',                       65, true),
  ('lifestyle', '라이프스타일',  '일상, 취미, 자기관리',                              75, true),
  ('travel',    '여행·지도',     '여행 계획, 지도, 위치 서비스',                      80, true);
