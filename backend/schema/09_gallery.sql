-- 09_gallery.sql
-- Durable public gallery posts. Run after 06_storage.sql.

create table if not exists public.gallery_items (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  caption        text not null,
  category       text not null check (category in ('activities', 'visits', 'celebrations', 'maintenance', 'community')),
  event_date     date not null default current_date,
  image_name     text not null,
  mime_type      text,
  size_bytes     bigint,
  storage_bucket text not null default 'public-assets',
  storage_path   text not null,
  featured       boolean not null default false,
  published_at   timestamptz not null default now(),
  published_by   uuid references public.users(id) on delete set null,
  meta           jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);

create index if not exists gallery_items_public_idx
  on public.gallery_items(featured desc, event_date desc, published_at desc)
  where deleted_at is null;

drop trigger if exists gallery_items_updated_at on public.gallery_items;
create trigger gallery_items_updated_at before update on public.gallery_items
  for each row execute function public.touch_updated_at();

alter table public.gallery_items enable row level security;

drop policy if exists gallery_items_read_public on public.gallery_items;
create policy gallery_items_read_public on public.gallery_items
  for select using (deleted_at is null and published_at <= now());

drop policy if exists gallery_items_write_admin on public.gallery_items;
create policy gallery_items_write_admin on public.gallery_items
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
