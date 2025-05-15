-- Create notifications table if it doesn't exist
create table if not exists public.notifications (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  type text not null,
  content text not null,
  read boolean not null default false,
  created_at timestamp with time zone null default now(),
  constraint notifications_pkey primary key (id),
  constraint notifications_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

-- Create indexes for better performance
create index IF not exists idx_notifications_user_id on public.notifications using btree (user_id) TABLESPACE pg_default;
create index IF not exists idx_notifications_read on public.notifications using btree (read) TABLESPACE pg_default;

-- Enable Row Level Security
alter table public.notifications enable row level security;

-- Create policies for notifications
-- Allow users to read their own notifications and global notifications (null user_id)
drop policy if exists "Users can view their own notifications and global ones" on public.notifications;
create policy "Users can view their own notifications and global ones"
  on public.notifications for select
  using (user_id = auth.uid() or user_id is null);

-- Allow authenticated users to update their own notifications
drop policy if exists "Users can update their own notifications" on public.notifications;
create policy "Users can update their own notifications"
  on public.notifications for update
  using (user_id = auth.uid());

-- Allow authenticated users to delete their own notifications
drop policy if exists "Users can delete their own notifications" on public.notifications;
create policy "Users can delete their own notifications"
  on public.notifications for delete
  using (user_id = auth.uid());

-- Allow service role (admin) to insert notifications for any user
drop policy if exists "Service role can insert notifications" on public.notifications;
create policy "Service role can insert notifications"
  on public.notifications for insert
  with check (true);

-- Grant permissions to authenticated users
grant select, update, delete on public.notifications to authenticated;

-- Grant all permissions to service_role (admin)
grant all on public.notifications to service_role;