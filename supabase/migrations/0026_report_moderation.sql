-- 0026: Şikayet yönetimi (UGC uyumu).
--  1) app_admins + is_admin(): yönetici yetkisi.
--  2) comments.hidden_at: gizlenen yorum herkesten saklanır (yazar + admin hariç).
--  3) reports insert trigger: bir yorum ayrı ayrı >=3 kullanıcı tarafından şikayet
--     edilince OTOMATİK gizlenir (yönetici müdahalesi beklemeden).
--  4) admin RPC'leri: şikayetleri listele + yorumu gizle/göster.
-- Idempotent yazıldı.

-- =========================================================
-- 1) Yönetici yetkisi
-- =========================================================
create table if not exists public.app_admins (
  user_id    uuid primary key references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.app_admins enable row level security;
-- Politika yok → istemci bu tabloyu doğrudan okuyamaz/yazamaz (yalnız security-definer fonksiyonlar).

create or replace function public.is_admin(p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from app_admins where user_id = p_user);
$$;
grant execute on function public.is_admin(uuid) to authenticated;

-- İstemcinin menüyü göstermesi için hafif yardımcı.
create or replace function public.am_i_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin(auth.uid());
$$;
grant execute on function public.am_i_admin() to authenticated;

-- İlk yöneticiyi tohumla (kullanıcı adı 'batuhan'). Yoksa sessiz geçer.
insert into public.app_admins (user_id)
  select id from public.profiles where username = 'batuhan'
  on conflict (user_id) do nothing;

-- =========================================================
-- 2) Yorum gizleme alanı + görünürlük kuralı
-- =========================================================
alter table public.comments add column if not exists hidden_at timestamptz;

-- Gizlenen yorum yalnızca YAZARINA ve YÖNETİCİYE görünür; diğer herkesten saklanır.
drop policy if exists "comments_select" on public.comments;
create policy "comments_select" on public.comments
  for select to authenticated
  using (
    exists (
      select 1 from public.programs p
      where p.id = comments.program_id
        and (p.visibility = 'public' or p.owner_id = auth.uid())
    )
    and (
      comments.hidden_at is null
      or comments.author_id = auth.uid()
      or public.is_admin(auth.uid())
    )
  );

-- =========================================================
-- 3) Şikayet eşiği → otomatik gizleme
-- =========================================================
create or replace function public.reports_auto_hide() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_comment uuid;
  v_distinct int;
begin
  -- Yalnızca yorum şikayetlerinde çalışır.
  if coalesce(new.context->>'type','') = 'comment' and (new.context->>'comment_id') is not null then
    v_comment := (new.context->>'comment_id')::uuid;
    select count(distinct r.reporter_id) into v_distinct
      from reports r
      where r.context->>'type' = 'comment'
        and r.context->>'comment_id' = new.context->>'comment_id';
    if v_distinct >= 3 then
      update comments set hidden_at = coalesce(hidden_at, now()) where id = v_comment;
    end if;
  end if;
  return new;
end; $$;

drop trigger if exists trg_reports_auto_hide on public.reports;
create trigger trg_reports_auto_hide after insert on public.reports
  for each row execute function public.reports_auto_hide();

-- =========================================================
-- 4) Yönetici RPC'leri
-- =========================================================
-- Son şikayetleri, şikayet eden/edilen profili + (varsa) yorum içeriği ve gizli durumuyla döner.
create or replace function public.admin_list_reports(p_limit int default 100)
returns json language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'yetki yok'; end if;
  return (
    select coalesce(json_agg(row_to_json(t)), '[]'::json) from (
      select
        r.id, r.reason, r.context, r.created_at,
        r.reported_id,
        (select row_to_json(rp) from (select username, display_name, avatar_url from profiles where id = r.reported_id) rp) as reported,
        (select row_to_json(rr) from (select username, display_name from profiles where id = r.reporter_id) rr) as reporter,
        case when r.context->>'type' = 'comment' and (r.context->>'comment_id') is not null then (
          select row_to_json(cc) from (
            select c.id, c.body, c.hidden_at, c.program_id
            from comments c where c.id = (r.context->>'comment_id')::uuid
          ) cc
        ) end as comment
      from reports r
      order by r.created_at desc
      limit greatest(p_limit, 1)
    ) t
  );
end; $$;
grant execute on function public.admin_list_reports(int) to authenticated;

-- Yöneticinin bir yorumu elle gizlemesi/göstermesi.
create or replace function public.admin_set_comment_hidden(p_comment_id uuid, p_hidden boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'yetki yok'; end if;
  update comments set hidden_at = case when p_hidden then coalesce(hidden_at, now()) else null end
    where id = p_comment_id;
end; $$;
grant execute on function public.admin_set_comment_hidden(uuid, boolean) to authenticated;
