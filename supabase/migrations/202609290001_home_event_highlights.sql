begin;

create table public.home_event_highlights (
  event_id uuid primary key references public.events(id) on delete cascade,
  "position" integer not null default 1 check ("position" > 0),
  pinned boolean not null default true,
  hidden boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

alter table public.home_event_highlights enable row level security;
create policy home_event_highlights_platform_admin_select on public.home_event_highlights for select using (public.is_platform_admin());
create policy home_event_highlights_platform_admin_write on public.home_event_highlights for all using (public.is_platform_admin()) with check (public.is_platform_admin());

create or replace function public.get_home_event_highlight_rules()
returns table (event_id uuid, "position" integer, pinned boolean, active boolean)
language sql stable security definer set search_path = ''
as $$
  select h.event_id, h."position", h.pinned,
    not h.hidden and (h.starts_at is null or h.starts_at <= now()) and (h.ends_at is null or h.ends_at > now()) as active
  from public.home_event_highlights h
  order by h."position", h.created_at;
$$;

revoke execute on function public.get_home_event_highlight_rules() from public;
grant execute on function public.get_home_event_highlight_rules() to anon, authenticated;
commit;
