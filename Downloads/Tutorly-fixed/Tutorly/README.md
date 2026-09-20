# Tutorly

A full-stack web platform connecting college students with peer tutors — search by subject or university, book a session, message your tutor, and leave a review.

## Status

Core flow is fully functional and tested end to end:

- Student & tutor sign-up/login with role-based dashboards
- Tutor search with subject, university, and rating filters
- Tutors set availability; students book open slots
- Tutors confirm or decline bookings from their dashboard
- Direct messaging between student and tutor
- Reviews after a session

Seeded with demo tutors and students across several subjects and universities so the app is browsable without creating accounts from scratch.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS, Radix UI primitives
- **Data/Auth:** Supabase (Postgres + Auth)
- **Routing/State:** React Router, TanStack Query

## Getting Started

**1. Clone and install**

```bash
git clone <repo-url>
cd tutorly
npm install
```

**2. Set up environment variables**

Copy the example file and fill in your own Supabase project's credentials:

```bash
cp .env.example .env.local
```

VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

**3. Run it**

```bash
npm run dev
```

## Notes

- Row Level Security is enabled on all Supabase tables; the anon key is safe to expose client-side as long as RLS policies stay in place.
- Tutor search defaults to "same university only" — toggle it off to browse all tutors.
