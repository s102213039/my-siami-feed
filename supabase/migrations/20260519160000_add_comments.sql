create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_name text,
  body text,
  ai_reply text,
  created_at timestamptz not null default now()
);

alter table public.comments
  add column if not exists author_name text,
  add column if not exists body text,
  add column if not exists ai_reply text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'comments'
      and column_name = 'user_name'
  ) then
    update public.comments
    set author_name = coalesce(
      nullif(trim(author_name), ''),
      nullif(trim(user_name), ''),
      '匿名訪客'
    )
    where author_name is null;
  else
    update public.comments
    set author_name = coalesce(nullif(trim(author_name), ''), '匿名訪客')
    where author_name is null;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'comments'
      and column_name = 'content'
  ) then
    update public.comments
    set body = coalesce(nullif(trim(body), ''), content, '')
    where body is null;
  else
    update public.comments
    set body = coalesce(nullif(trim(body), ''), '')
    where body is null;
  end if;
end $$;

update public.comments
set ai_reply = coalesce(nullif(trim(ai_reply), ''), 'Siami AI 將根據留言補充文章脈絡。')
where ai_reply is null;

alter table public.comments
  alter column author_name set default '匿名訪客',
  alter column author_name set not null,
  alter column body set not null,
  alter column ai_reply set not null;

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
