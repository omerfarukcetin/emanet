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

-- ---------------------------------------------------------------------------
-- Bildirimler: bildirimi açan cihazların adresi ve o cihazın bildirim ayarları.
-- Tutar ya da portföy içeriği burada durmaz. "Büyük hareket uyarısı" açıksa yalnızca
-- portföyün yüzde dağılımı (hangi fiyata yüzde kaç bağlı) tutulur.
-- Satırları yalnızca sahibi görür. Bildirim gönderen iş, deponun gizli anahtarını bilen
-- iki işlev üzerinden okur; anahtarın kendisi burada yazmaz, yalnızca özeti (sha256) yazar.
-- Bu bölüm birden çok kez çalıştırılabilir.
-- ---------------------------------------------------------------------------
create table if not exists public.emanet_push (
  endpoint   text primary key,
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.emanet_push
  add column if not exists prefs     jsonb not null default '{}'::jsonb,
  add column if not exists weights   jsonb not null default '{}'::jsonb,
  add column if not exists last_poke date,
  add column if not exists last_big  date;
alter table public.emanet_push enable row level security;
drop policy if exists "push_oku"      on public.emanet_push;
drop policy if exists "push_ekle"     on public.emanet_push;
drop policy if exists "push_guncelle" on public.emanet_push;
drop policy if exists "push_sil"      on public.emanet_push;
create policy "push_oku"      on public.emanet_push for select to authenticated using (auth.uid() = user_id);
create policy "push_ekle"     on public.emanet_push for insert to authenticated with check (auth.uid() = user_id);
create policy "push_guncelle" on public.emanet_push for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "push_sil"      on public.emanet_push for delete to authenticated using (auth.uid() = user_id);
revoke all on public.emanet_push from anon;
grant select, insert, update, delete on public.emanet_push to authenticated;

create or replace function public.emanet_push_list(secret text)
returns table (endpoint text, prefs jsonb, weights jsonb, last_poke date, last_big date)
language sql security definer set search_path = public as $$
  select p.endpoint, p.prefs, p.weights, p.last_poke, p.last_big from public.emanet_push p
  where encode(sha256(convert_to(secret, 'UTF8')), 'hex') = 'f1dc2fa04692b3944bba7d1b8416499e7e3a636c899ba9486f7e66d0f10a35a0';
$$;
create or replace function public.emanet_push_mark(secret text, ep text, kind text, d date)
returns void language plpgsql security definer set search_path = public as $$
begin
  if encode(sha256(convert_to(secret, 'UTF8')), 'hex') <> 'f1dc2fa04692b3944bba7d1b8416499e7e3a636c899ba9486f7e66d0f10a35a0' then return; end if;
  if kind = 'gone' then delete from public.emanet_push where endpoint = ep;
  elsif kind = 'big' then update public.emanet_push set last_big = d where endpoint = ep;
  else update public.emanet_push set last_poke = d where endpoint = ep;
  end if;
end $$;
revoke all on function public.emanet_push_list(text) from public;
revoke all on function public.emanet_push_mark(text, text, text, date) from public;
grant execute on function public.emanet_push_list(text) to anon, authenticated;
grant execute on function public.emanet_push_mark(text, text, text, date) to anon, authenticated;
