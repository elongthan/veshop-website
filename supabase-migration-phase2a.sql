-- Phase 2a: catalog structure changes
-- Safe to run once. Keeps your existing category/image_url columns and
-- backfills the new ones from them, so nothing is lost.

alter table categories add column if not exists parent_id integer references categories(id) on delete set null;
alter table categories add column if not exists icon_url text;

alter table products add column if not exists categories text[] default '{}';
update products set categories = array[category] where category is not null and category <> '' and (categories is null or array_length(categories,1) is null);

alter table products add column if not exists images text[] default '{}';
update products set images = array[image_url] where image_url is not null and image_url <> '' and (images is null or array_length(images,1) is null);

alter table products add column if not exists active boolean default true;

alter table brands add column if not exists logo_url text;
