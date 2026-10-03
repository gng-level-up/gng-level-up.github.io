# Monster Recomp Tracker
1. Create a Supabase project. Run `supabase/schema.sql` in the SQL editor.
2. Auth settings: for fastest setup, turn off "Confirm email" (otherwise signup needs an email click first).
3. `cp .env.example .env`, fill in URL and anon key (never the service-role key).
4. `npm install && npm run dev`. Both friends sign up; the DB blocks a third account.
5. Deploy (Vercel/Netlify) over HTTPS to install as a PWA on Android.
