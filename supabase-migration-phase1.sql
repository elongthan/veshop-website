-- VeShop Phase 1 migration
-- Run this in Supabase SQL Editor. Safe to run once — only adds new things,
-- does not touch your existing products/categories/brands.

alter table settings add column if not exists logo_url text;
alter table settings add column if not exists site_name text default 'VESHOP';
alter table settings add column if not exists site_tagline text default 'Vertex Enterprise catalog';
alter table settings add column if not exists hero_eyebrow text default 'Vertex Enterprise Pte Ltd';
alter table settings add column if not exists hero_title text default 'Hardware, PPE and safety supplies — browse the full catalog';
alter table settings add column if not exists hero_description text default 'Search by name, brand or price, filter by category, and download a PDF catalog for procurement or site reference. Contact our team for quotes and orders.';
alter table settings add column if not exists banner_images text[] default '{}';
alter table settings add column if not exists footer_address text default '9003 Tampines Street 93, #03-158
Tampines Industrial Park A
Singapore 528837';
alter table settings add column if not exists phone1 text default '+65 8363 1218';
alter table settings add column if not exists phone2 text default '+65 6980 8669';
alter table settings add column if not exists whatsapp_number text default '6583631218';
alter table settings add column if not exists contact_email text default 'sales@veshop.com.sg';
alter table settings add column if not exists about_us_text text default 'Vertex Enterprise Pte Ltd has been supplying hardware, PPE and safety equipment across Singapore. Browse our full catalog online, or reach out directly for quotes and bulk orders.';

-- Storage bucket for logo/banner/brand images (separate from product photos)
insert into storage.buckets (id, name, public) values ('site-assets', 'site-assets', true)
on conflict (id) do nothing;

create policy "Public read site assets" on storage.objects for select using (bucket_id = 'site-assets');
create policy "Admin upload site assets" on storage.objects for insert with check (bucket_id = 'site-assets' and auth.role() = 'authenticated');
create policy "Admin delete site assets" on storage.objects for delete using (bucket_id = 'site-assets' and auth.role() = 'authenticated');
