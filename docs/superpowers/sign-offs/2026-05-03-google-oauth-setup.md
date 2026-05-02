1. Supabase Dashboard → Authentication → Providers → Google → Enable.
2. Supply Google Cloud OAuth Client ID + Secret.
3. Authorized redirect URI (Google side): https://<project>.supabase.co/auth/v1/callback
4. Site URL (Supabase Auth → URL Configuration): http://localhost:3000 in dev,
   production URL in prod.
5. Add http://localhost:3000/auth/callback to "Additional redirect URLs".
