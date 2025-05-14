create table public.users (
  id uuid not null,
  username text not null,
  avatar_url text null,
  bio text null,
  created_at timestamp with time zone null default now(),
  role text not null default 'user'::text,
  constraint users_pkey primary key (id),
  constraint users_username_key unique (username),
  constraint users_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint valid_role check ((role = any (array['user'::text, 'admin'::text])))
) TABLESPACE pg_default;

create index IF not exists idx_users_role on public.users using btree (role) TABLESPACE pg_default;