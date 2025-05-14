create table public.user_anime_lists (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  anime_id uuid not null,
  list_type text not null,
  progress integer null default 0,
  rating numeric null,
  notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint user_anime_lists_pkey primary key (id),
  constraint unique_user_anime unique (user_id, anime_id),
  constraint user_anime_lists_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint user_anime_lists_anime_id_fkey foreign KEY (anime_id) references anime (id) on delete CASCADE,
  constraint valid_list_type check (
    (
      list_type = any (
        array[
          'watching'::text,
          'completed'::text,
          'plan_to_watch'::text,
          'on_hold'::text,
          'dropped'::text
        ]
      )
    )
  ),
  constraint valid_progress check (
    (
      (progress >= 0)
      and (progress <= 100)
    )
  ),
  constraint valid_rating check (
    (
      (rating is null)
      or (
        (rating >= (0)::numeric)
        and (rating <= (5)::numeric)
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_user_anime_lists_user_id on public.user_anime_lists using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_user_anime_lists_anime_id on public.user_anime_lists using btree (anime_id) TABLESPACE pg_default;

create index IF not exists idx_user_anime_lists_list_type on public.user_anime_lists using btree (list_type) TABLESPACE pg_default;