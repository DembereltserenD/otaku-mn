create table public.anime_relations (
  id uuid not null default gen_random_uuid (),
  anime_id uuid not null,
  related_anime_id uuid not null,
  relation_type text not null,
  created_at timestamp with time zone null default now(),
  constraint anime_relations_pkey primary key (id),
  constraint unique_anime_relation unique (anime_id, related_anime_id, relation_type),
  constraint anime_relations_anime_id_fkey foreign KEY (anime_id) references anime (id) on delete CASCADE,
  constraint anime_relations_related_anime_id_fkey foreign KEY (related_anime_id) references anime (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_anime_relations_anime_id on public.anime_relations using btree (anime_id) TABLESPACE pg_default;

create index IF not exists idx_anime_relations_related_anime_id on public.anime_relations using btree (related_anime_id) TABLESPACE pg_default;