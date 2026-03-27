create extension if not exists pgcrypto;

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  source_mode text not null check (source_mode in ('raw', 'manual')),
  raw_input text,
  canonical_markdown text not null,
  warnings jsonb not null default '[]'::jsonb,
  ip_hash text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.palettes (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  slug text not null unique,
  name text not null,
  sort_order integer not null,
  colors jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint palettes_colors_is_array check (jsonb_typeof(colors) = 'array')
);

create index if not exists submissions_created_at_idx on public.submissions (created_at desc);
create index if not exists submissions_ip_hash_created_at_idx on public.submissions (ip_hash, created_at desc);
create index if not exists palettes_created_at_idx on public.palettes (created_at desc);
create index if not exists palettes_submission_sort_idx on public.palettes (submission_id, sort_order asc);

alter table public.submissions enable row level security;
alter table public.palettes enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'palettes'
      and policyname = 'Public can read palettes'
  ) then
    create policy "Public can read palettes"
      on public.palettes
      for select
      to anon, authenticated
      using (true);
  end if;
end
$$;
