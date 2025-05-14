create table public.notifications (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  type text not null,
  content text not null,
  read boolean not null default false,
  created_at timestamp with time zone null default now(),
  constraint notifications_pkey primary key (id),
  constraint notifications_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_notifications_user_id on public.notifications using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_notifications_read on public.notifications using btree (read) TABLESPACE pg_default;