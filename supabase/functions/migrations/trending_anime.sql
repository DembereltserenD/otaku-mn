create view public.trending_anime as
select
  a.id,
  a.title,
  a.image_url,
  a.genres,
  a.rating,
  a.release_date,
  a.created_at,
  a.updated_at,
  count(distinct ual.user_id) as watch_count,
  count(
    distinct case
      when ual.list_type = 'watching'::text then ual.user_id
      else null::uuid
    end
  ) as currently_watching,
  count(
    distinct case
      when ual.list_type = 'completed'::text then ual.user_id
      else null::uuid
    end
  ) as completed_count,
  count(
    distinct case
      when ual.list_type = 'plan_to_watch'::text then ual.user_id
      else null::uuid
    end
  ) as plan_to_watch_count,
  count(distinct f.user_id) as favorite_count,
  count(
    distinct case
      when ual.list_type = 'watching'::text then ual.user_id
      else null::uuid
    end
  ) * 3 + count(
    distinct case
      when ual.list_type = 'plan_to_watch'::text then ual.user_id
      else null::uuid
    end
  ) * 1 + count(
    distinct case
      when ual.list_type = 'completed'::text then ual.user_id
      else null::uuid
    end
  ) * 2 + count(distinct f.user_id) * 4 as trending_score
from
  anime a
  left join user_anime_lists ual on a.id = ual.anime_id
  left join favorites f on a.id = f.anime_id
group by
  a.id,
  a.title,
  a.image_url,
  a.genres,
  a.rating,
  a.release_date,
  a.created_at,
  a.updated_at
order by
  (
    count(
      distinct case
        when ual.list_type = 'watching'::text then ual.user_id
        else null::uuid
      end
    ) * 3 + count(
      distinct case
        when ual.list_type = 'plan_to_watch'::text then ual.user_id
        else null::uuid
      end
    ) * 1 + count(
      distinct case
        when ual.list_type = 'completed'::text then ual.user_id
        else null::uuid
      end
    ) * 2 + count(distinct f.user_id) * 4
  ) desc,
  (count(distinct ual.user_id)) desc,
  a.rating desc;