-- Run this in addition to supabase-migration-phase1.sql (safe to run once)
alter table settings add column if not exists accent_color text default '#1B3A6B';
