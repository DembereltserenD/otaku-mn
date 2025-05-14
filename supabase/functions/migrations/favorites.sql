create table public.favorites (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  anime_id uuid not null,
  created_at timestamp with time zone null default now(),
  constraint favorites_pkey primary key (id),
  constraint unique_user_anime_favorite unique (user_id, anime_id),
  constraint favorites_anime_id_fkey foreign KEY (anime_id) references anime (id) on delete CASCADE,
  constraint favorites_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_favorites_user_id on public.favorites using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_favorites_anime_id on public.favorites using btree (anime_id) TABLESPACE pg_default;