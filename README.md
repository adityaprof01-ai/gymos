# GymOS

Modern gym-management workspace built with React, Vite, Tailwind CSS and Supabase.

## Features
- Supabase email/password authentication
- Owner onboarding and gym workspace creation
- Live members, attendance, memberships and payments
- Member portal at `/client`
- Responsive dashboard
- Vercel SPA deployment configuration
- GitHub Actions validation

## Environment
The client expects `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the deployment environment. Never expose a Supabase service-role key in browser variables.

## Build
`pnpm exec vite build`

Vite outputs to `dist/public`; `vercel.json` configures the SPA fallback.

## Data model
The app uses the supplied existing tables: `profiles`, `gyms`, `gym_staff`, `gym_members`, `memberships`, `payments`, and `attendance`. No workout table was supplied, so the Workouts area does not fabricate data.

## Security
Browser access uses the Supabase publishable key. Tenant isolation and write authorization must be enforced by Supabase RLS policies. Existing unknown policies are not overwritten by this repository.
