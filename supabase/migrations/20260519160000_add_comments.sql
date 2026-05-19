create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_name text not null default '匿名訪客',
  body text not null,
  ai_reply text not null,
  created_at timestamptz not null default now()
);

create index if not exists comments_post_id_created_at_idx
  on public.comments (post_id, created_at);

alter table public.comments enable row level security;

drop policy if exists "Anyone can read comments" on public.comments;
create policy "Anyone can read comments"
  on public.comments
  for select
  using (true);

drop policy if exists "Anyone can create comments" on public.comments;
create policy "Anyone can create comments"
  on public.comments
  for insert
  with check (
    length(trim(body)) >= 2
    and length(trim(body)) <= 1000
    and length(trim(author_name)) <= 40
  );

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'comments'
  ) then
    alter publication supabase_realtime add table public.comments;
  end if;
end $$;
