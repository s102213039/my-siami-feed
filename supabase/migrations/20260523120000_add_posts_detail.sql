alter table public.posts
  add column if not exists detail text;

comment on column public.posts.detail is 'RSS 或來源提供的原始新聞內文，供主畫面完整展示';
