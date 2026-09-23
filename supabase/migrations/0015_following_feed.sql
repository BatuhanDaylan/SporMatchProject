-- 0015: Takip akışı — takip ettiğin kullanıcıların herkese açık programları (en yeni önce).

create or replace function public.following_feed(p_limit int default 50)
returns json
language sql
stable
security definer
set search_path = public
as $$
  with base as (
    select p.id, p.title, p.description, p.owner_id, p.visibility, p.template, p.updated_at, p.sport_id,
      coalesce(lc.cnt, 0) as like_count, coalesce(sc.cnt, 0) as save_count
    from programs p
    join follows f on f.following_id = p.owner_id and f.follower_id = auth.uid()
    left join (select program_id, count(*) cnt from program_likes group by program_id) lc on lc.program_id = p.id
    left join (select program_id, count(*) cnt from program_saves group by program_id) sc on sc.program_id = p.id
    where p.visibility = 'public'
    order by p.updated_at desc
    limit greatest(p_limit, 1)
  )
  select coalesce(json_agg(row_to_json(t)), '[]'::json)
  from (
    select b.id, b.title, b.description, b.owner_id, b.visibility, b.template, b.updated_at,
      b.like_count, b.save_count,
      (select row_to_json(pr) from (select username, display_name, avatar_url from profiles where id = b.owner_id) pr) as owner,
      (select row_to_json(sp) from (select name, icon from sports where id = b.sport_id) sp) as sport
    from base b
  ) t;
$$;
grant execute on function public.following_feed(int) to authenticated;
