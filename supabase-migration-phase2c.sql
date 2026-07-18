-- Categories and brands were missing an UPDATE policy, which is why
-- saving an icon or logo silently did nothing. This adds it.
create policy "Admin update categories" on categories for update using (auth.role() = 'authenticated');
create policy "Admin update brands" on brands for update using (auth.role() = 'authenticated');
