-- VeShop database setup
-- Run this once in your Supabase project: SQL Editor > New query > paste all > Run

create extension if not exists "pgcrypto";

-- Products
create table products (
  id uuid primary key default gen_random_uuid(),
  sku text,
  name text not null,
  brand text,
  category text,
  price numeric(10,2) not null default 0,
  short_description text,
  tags text[] default '{}',
  image_url text,
  new_arrival boolean default false,
  created_at timestamptz default now()
);

-- Categories
create table categories (
  id serial primary key,
  name text unique not null
);

-- Brands
create table brands (
  id serial primary key,
  name text unique not null
);

-- Site settings (single row, id = 1)
create table settings (
  id int primary key default 1,
  show_prices boolean default true,
  constraint single_row check (id = 1)
);
insert into settings (id, show_prices) values (1, true);

-- Starting categories (edit freely from the admin portal later)
insert into categories (name) values
  ('PPE & Equipment'), ('Traffic Safety'), ('Paints & Chemicals'), ('Welding Products'),
  ('Office & Dormitory Supplies'), ('Trolley & Ladders'), ('Abrasive'),
  ('Hand & Measuring Tools'), ('Tools & Machines'), ('Packaging & Protection'), ('Others');

-- Starting brands
insert into brands (name) values
  ('3M'), ('Bosch'), ('DEN-SIN'), ('Hikoki'), ('KDK'), ('Kyocera'), ('Nitto Kohki'),
  ('OSS'), ('Pelican'), ('RHINO'), ('Ryobi'), ('Safety Jogger'), ('Safetyware'),
  ('Stanley'), ('Sundstrom');

-- Row Level Security: anyone can read, only signed-in admins can write
alter table products enable row level security;
alter table categories enable row level security;
alter table brands enable row level security;
alter table settings enable row level security;

create policy "Public read products" on products for select using (true);
create policy "Admin write products" on products for insert with check (auth.role() = 'authenticated');
create policy "Admin update products" on products for update using (auth.role() = 'authenticated');
create policy "Admin delete products" on products for delete using (auth.role() = 'authenticated');

create policy "Public read categories" on categories for select using (true);
create policy "Admin write categories" on categories for insert with check (auth.role() = 'authenticated');
create policy "Admin delete categories" on categories for delete using (auth.role() = 'authenticated');

create policy "Public read brands" on brands for select using (true);
create policy "Admin write brands" on brands for insert with check (auth.role() = 'authenticated');
create policy "Admin delete brands" on brands for delete using (auth.role() = 'authenticated');

create policy "Public read settings" on settings for select using (true);
create policy "Admin update settings" on settings for update using (auth.role() = 'authenticated');

-- Storage bucket for product photos
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "Public read product images" on storage.objects for select using (bucket_id = 'product-images');
create policy "Admin upload product images" on storage.objects for insert with check (bucket_id = 'product-images' and auth.role() = 'authenticated');
create policy "Admin delete product images" on storage.objects for delete using (bucket_id = 'product-images' and auth.role() = 'authenticated');
