create table public.episodes (
  id uuid not null default gen_random_uuid (),
  anime_id uuid not null,
  title text not null,
  description text null,
  episode_number integer not null,
  thumbnail_url text null,
  video_url text null,
  duration text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint episodes_pkey primary key (id),
  constraint episodes_anime_id_fkey foreign KEY (anime_id) references anime (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_episodes_anime_id on public.episodes using btree (anime_id) TABLESPACE pg_default;