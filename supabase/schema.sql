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

alter table public.emanet_push add column if not exists fired jsonb not null default '{}'::jsonb;

drop function if exists public.emanet_push_list(text);
create function public.emanet_push_list(secret text)
returns table (endpoint text, prefs jsonb, weights jsonb, last_poke date, last_big date, fired jsonb)
language sql security definer set search_path = public as $$
  select p.endpoint, p.prefs, p.weights, p.last_poke, p.last_big, p.fired from public.emanet_push p
  where encode(sha256(convert_to(secret, 'UTF8')), 'hex') = 'f1dc2fa04692b3944bba7d1b8416499e7e3a636c899ba9486f7e66d0f10a35a0';
$$;
create or replace function public.emanet_push_mark(secret text, ep text, kind text, d date)
returns void language plpgsql security definer set search_path = public as $$
begin
  if encode(sha256(convert_to(secret, 'UTF8')), 'hex') <> 'f1dc2fa04692b3944bba7d1b8416499e7e3a636c899ba9486f7e66d0f10a35a0' then return; end if;
  if kind = 'gone' then delete from public.emanet_push where endpoint = ep;
  elsif kind = 'big' then update public.emanet_push set last_big = d where endpoint = ep;
  elsif kind like 'alert:%' then update public.emanet_push set fired = fired || jsonb_build_object(substr(kind, 7), d::text) where endpoint = ep;
  elsif kind like 'rearm:%' then update public.emanet_push set fired = fired - substr(kind, 7) where endpoint = ep;
  else update public.emanet_push set last_poke = d where endpoint = ep;
  end if;
end $$;
revoke all on function public.emanet_push_list(text) from public;
revoke all on function public.emanet_push_mark(text, text, text, date) from public;
grant execute on function public.emanet_push_list(text) to anon, authenticated;
grant execute on function public.emanet_push_mark(text, text, text, date) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Otomatik yedek: her kullanıcı için günde bir kopya (uygulama 35 günden eskileri siler).
-- Satırları yalnızca sahibi görür ve değiştirir.
-- ---------------------------------------------------------------------------
create table if not exists public.emanet_backup (
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  day        date not null,
  data       jsonb not null,
  meta       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);
alter table public.emanet_backup enable row level security;
drop policy if exists "yedek_sahibi" on public.emanet_backup;
create policy "yedek_sahibi" on public.emanet_backup for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
revoke all on public.emanet_backup from anon;
grant select, insert, update, delete on public.emanet_backup to authenticated;

-- ---------------------------------------------------------------------------
-- Portföy paylaşımı: sahibi bir portföyü e-postayla paylaşır, karşı taraf salt okunur görür.
-- Satırda portföyün kopyası (ad ve varlıklar) durur; sahibi her kayıtta günceller.
-- Sahibi kendi satırlarını yönetir; paylaşılan kişi yalnızca kendi e-postasına açılmış satırları okur.
-- Bu bölüm birden çok kez çalıştırılabilir.
-- ---------------------------------------------------------------------------
create table if not exists public.emanet_share (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid not null default auth.uid() references auth.users on delete cascade,
  owner_email text,
  pf_id       text not null,
  email       text not null check (email = lower(email)),
  data        jsonb,
  updated_at  timestamptz not null default now(),
  unique (owner, pf_id, email)
);
alter table public.emanet_share enable row level security;

drop policy if exists "emanet_share_sahip" on public.emanet_share;
create policy "emanet_share_sahip" on public.emanet_share for all to authenticated
  using (owner = auth.uid()) with check (owner = auth.uid());

drop policy if exists "emanet_share_okuyan" on public.emanet_share;
create policy "emanet_share_okuyan" on public.emanet_share for select to authenticated
  using (email = lower(coalesce(auth.jwt() ->> 'email', '')));

-- ---------------------------------------------------------------------------
-- Portföy paylaşımında yetki: "view" (yalnızca görür) ya da "edit" (düzenler).
-- Düzenleyen kişi tabloya doğrudan yazamaz; yalnızca aşağıdaki işlevle, kendisine "edit" yetkisiyle açılmış
-- satırın "edits" listesine bir değişiklik paketi ekleyebilir. Paketleri sahibinin uygulaması işler ve
-- emanet_share_ack ile listeden düşer. Bu bölüm birden çok kez çalıştırılabilir.
-- ---------------------------------------------------------------------------
alter table public.emanet_share add column if not exists role  text  not null default 'view';
alter table public.emanet_share add column if not exists edits jsonb not null default '[]'::jsonb;
alter table public.emanet_share drop constraint if exists emanet_share_role_chk;
alter table public.emanet_share add constraint emanet_share_role_chk check (role in ('view', 'edit'));

create or replace function public.emanet_share_edit(p_id uuid, p_delta jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare me text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if me = '' then raise exception 'giriş gerekli'; end if;
  if jsonb_typeof(p_delta) <> 'object' or length(p_delta::text) > 300000 then raise exception 'geçersiz değişiklik'; end if;
  update public.emanet_share
     set edits = case when jsonb_array_length(edits) >= 300 then edits else edits || jsonb_build_array(
                   jsonb_build_object('set', coalesce(p_delta -> 'set', '[]'::jsonb), 'del', coalesce(p_delta -> 'del', '[]'::jsonb), 'by', me, 'at', now())) end
   where id = p_id and role = 'edit' and email = me;
  if not found then raise exception 'düzenleme yetkin yok'; end if;
end $$;

create or replace function public.emanet_share_ack(p_id uuid, p_n int, p_data jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.emanet_share
     set edits = coalesce((select jsonb_agg(e order by i) from jsonb_array_elements(edits) with ordinality as t(e, i) where i > p_n), '[]'::jsonb),
         data = p_data, updated_at = now()
   where id = p_id and owner = auth.uid();
  if not found then raise exception 'izin yok'; end if;
end $$;

revoke all on function public.emanet_share_edit(uuid, jsonb) from public, anon;
revoke all on function public.emanet_share_ack(uuid, int, jsonb) from public, anon;
grant execute on function public.emanet_share_edit(uuid, jsonb) to authenticated;
grant execute on function public.emanet_share_ack(uuid, int, jsonb) to authenticated;
