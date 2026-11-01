# CardVault — Personal Credit Card Manager

A private, dark-mode dashboard for manually managing up to 16 credit cards in INR.

## Features in this starter
- Supabase email magic-link authentication.
- User-isolated card records protected by Row Level Security.
- Add, edit and delete up to 16 cards.
- Manual entry for credit limit, outstanding, statement amount, minimum due and total due.
- Automatic available-credit, utilisation and due-ageing calculations.
- Dashboard totals and card search.
- Responsive layout for mobile and desktop.

## Setup
1. Install Node.js 20.9+.
2. Create a Supabase project.
3. In Supabase SQL Editor, run `supabase/schema.sql`.
4. In Supabase Authentication > URL Configuration, set your local Site URL to `http://localhost:3000` and add your deployed URL after deployment.
5. Copy `.env.example` to `.env.local` and fill in your Supabase Project URL and anon/public key.
6. Run:
   ```bash
   npm install
   npm run dev
   ```
7. Open http://localhost:3000 and request a magic sign-in link.

## Deploy to Vercel
- Push this project to GitHub and import it in Vercel.
- Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel Environment Variables.
- Deploy, then add the Vercel URL to Supabase Auth redirect URLs.

## Important notes
- This is a starter application, not yet deployed or connected to your Supabase account.
- Amounts are manually entered; available credit is calculated as credit limit minus outstanding.
- Ageing is based on the entered actual due date. Update that date each billing cycle.
- Alerts currently appear as due-status badges and ageing totals inside the dashboard. Browser/email/push notifications need a separate notification setup.
- Never enter full card numbers, CVV, PIN, OTP or internet banking passwords.
- Do not commit `.env.local` to GitHub.
