# dementa

Chat application for the dementa team.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Study app (`/quick-solution/v1`)

The chemistry revision app is backed by Supabase. To set it up, run these files
in the Supabase SQL editor **in order**:

1. `supabase/schema.sql` — tables, RLS policies, `class_overview` view, and the
   profile-on-signup trigger.
2. `supabase/fix-auth-issues.sql` — safe to run anytime; ensures the signup
   trigger and profile SELECT policy are in place, and moves every existing
   profile onto the single class `S.4 General`.
3. `supabase/seed.sql` — curriculum + quiz content (regenerate with
   `npm run generate-seed`, never hand-edit).
4. `supabase/create-teacher.sql` — creates the single teacher account.

Roles:

- **Students** self-register from the app (`/quick-solution/v1/login`). The
  sign-up form no longer has a role picker or a class-code field — everyone who
  signs up is a student in the single class `S.4 General`.
- **Teacher** is provisioned only by `create-teacher.sql`:
  - email: `victordementa@gmail.com`
  - password: `Admin123@` (change it after first login)
  - The teacher sees `/quick-solution/v1/teacher` — a per-student table of
    processes mastered, average score, best score, number of quiz attempts,
    streak, and last attempt date.

Every quiz attempt is stored in `quiz_attempts`, so students can retake any quiz
as often as they like and the teacher sees the full attempt history.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
