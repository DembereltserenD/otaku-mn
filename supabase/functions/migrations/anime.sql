create table public.anime (
  id uuid not null default gen_random_uuid (),
  title text not null,
  image_url text null,
  genres text[] null,
  rating numeric null,
  release_date date null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  alternative_titles text[] null,
  description text null,
  cover_image_url text null,
  popularity numeric null,
  release_year integer null,
  season text null,
  status text null,
  constraint anime_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_anime_title on public.anime using btree (title) TABLESPACE pg_default;

create index IF not exists idx_anime_genres on public.anime using gin (genres) TABLESPACE pg_default;