create table if not exists admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  created_at timestamptz default now()
);

alter table admin_profiles enable row level security;

-- Any signed-in admin can see the list of admin usernames (for the "manage admins" screen)
create policy "Admins can read admin profiles" on admin_profiles for select using (auth.role() = 'authenticated');

-- An admin can set/update only their own username
create policy "Admins manage own profile" on admin_profiles for insert with check (auth.uid() = user_id);
create policy "Admins update own profile" on admin_profiles for update using (auth.uid() = user_id);
