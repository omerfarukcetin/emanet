-- Emanet için Supabase tabloları.
-- Supabase paneli → SQL Editor → New query → bu dosyanın tamamını yapıştırıp "Run".

-- 1) Her kullanıcının verisi: kullanıcı başına tek satır, yalnızca sahibi okuyup yazabilir.
create table if not exists public.emanet_state (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb  not null,
  updated_at bigint not null default 0
);
alter table public.emanet_state enable row level security;

drop policy if exists "emanet_state_sahibi" on public.emanet_state;
create policy "emanet_state_sahibi" on public.emanet_state
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2) Fiyatı çekilecek kodların ortak listesi (yalnızca kod; tutar veya kişi bilgisi içermez).
--    Herkes okuyabilir (fiyat işi buradan okur), yalnızca giriş yapanlar ekleyebilir.
create table if not exists public.emanet_watch (
  kind     text not null check (kind in ('hisse','abd','fon','ppf','kripto','diger')),
  symbol   text not null check (symbol ~ '^[A-Z0-9.\-]{1,12}$'),
  cur      text not null default 'TRY' check (cur in ('TRY','USD','EUR')),
  added_at timestamptz not null default now(),
  primary key (kind, symbol)
);
alter table public.emanet_watch enable row level security;

drop policy if exists "emanet_watch_oku" on public.emanet_watch;
create policy "emanet_watch_oku" on public.emanet_watch for select using (true);

drop policy if exists "emanet_watch_ekle" on public.emanet_watch;
create policy "emanet_watch_ekle" on public.emanet_watch for insert to authenticated with check (true);
