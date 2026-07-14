# VeShop website

Next.js catalog site for Vertex Enterprise Pte Ltd. No cart, no payment —
browse, search, filter, download a PDF catalog, and enquire by email.
Products are managed through a password-protected /admin portal.

See the setup guide provided separately for the full click-by-click walkthrough
(Supabase project, database, admin user, Vercel deploy, domain connection).

Quick reference:

1. Create a Supabase project, run `supabase-schema.sql` in its SQL editor.
2. Create a storage bucket named `product-images` (the SQL script does this too).
3. Add an admin user under Authentication → Users.
4. Copy `.env.local.example` to `.env.local` and fill in your Supabase URL and anon key.
5. `npm install` then `npm run dev` to test locally at localhost:3000.
6. Push to GitHub, import into Vercel, add the same environment variables there, deploy.
7. Point veshop.com.sg's DNS at Vercel.
