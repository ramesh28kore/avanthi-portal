# CRT Learning Portal — Build Plan

A full-stack learning platform branded **CRT**, modeled on the Avanthi Portal experience: a focused landing page with email/password auth, then a workspace for students to study Python cheat sheets, practice coding in the browser, and take timed MCQ exams with answer review. Teachers/admins can manage content and view results.

## Scope

### In scope
- Public landing page with CRT brand and sign-in CTA.
- Email/password authentication + protected student workspace.
- Three learning modules:
  - Topic-wise Python cheat sheets with worked examples.
  - In-browser coding practice with instant verdicts.
  - Timed MCQ exams with full answer review.
- Admin/teacher role for content management.
- Basic analytics: exam attempts, scores, last activity.

### Out of scope (initial build)
- Real-time collaborative editing.
- Advanced code execution sandboxing beyond a safe serverless judge.
- Payment or subscription tiers.
- Mobile native apps.

## Design Direction

Clean, academic, high-contrast interface inspired by the reference portal. Warm off-white background, deep navy/indigo primary, generous whitespace, and clear typography. Cards for cheat sheets and practice, tabbed navigation for the workspace. No gradients, no generic purple startup aesthetic.

## Technical Approach

- TanStack Start v1 + React 19 + Tailwind CSS v4.
- Lovable Cloud for PostgreSQL, auth, and storage.
- Row-level security policies for user-owned data and admin-only content.
- Separate roles table (`user_roles`) with security-definer `has_role` helper.
- Server functions (`createServerFn`) for auth-protected reads/writes; public routes only for landing + auth callbacks.
- Coding judge: sandboxed evaluation via a server function; no raw `eval` in the browser.

## Database Schema (Lovable Cloud migrations)

1. `profiles` — user profile (id, name, created_at).
2. `user_roles` — role assignments (`student`, `teacher`, `admin`).
3. `cheat_sheets` — topic, title, content blocks, examples, ordering, published flag.
4. `practice_problems` — title, description, starter code, test cases, difficulty, topic.
5. `practice_submissions` — user_id, problem_id, code, passed, output, created_at.
6. `exams` — title, description, time_limit_minutes, published, pass_score.
7. `exam_questions` — exam_id, question text, options, correct_option_index, explanation, ordering.
8. `exam_attempts` — user_id, exam_id, started_at, submitted_at, score.
9. `exam_answers` — attempt_id, question_id, selected_option_index.

All tables get GRANT statements to `authenticated` and `service_role`, RLS enabled, and policies scoped to either `auth.uid()` or `has_role(auth.uid(), 'admin')`.

## Routes

- `/` — Landing page.
- `/auth` — Sign in / sign up.
- `/join` — Join with class/invitation code.
- `/_authenticated/dashboard` — Student workspace overview.
- `/_authenticated/cheat-sheets` — Browse cheat sheets.
- `/_authenticated/cheat-sheets/$slug` — Single cheat sheet.
- `/_authenticated/practice` — Coding problem list.
- `/_authenticated/practice/$id` — Problem + code editor.
- `/_authenticated/exams` — Available exams.
- `/_authenticated/exams/$id` — Take exam.
- `/_authenticated/exams/$id/review` — Review answers.
- `/_authenticated/admin` — Admin/teacher content manager (admin-only).
- `/_authenticated/admin/exams` — Manage exams and questions.
- `/_authenticated/admin/cheat-sheets` — Manage cheat sheets.
- `/_authenticated/admin/practice` — Manage practice problems.

## Implementation Order

1. Enable Lovable Cloud.
2. Create migrations with seed data (sample cheat sheet, practice problem, exam).
3. Set up auth middleware and roles.
4. Build landing page and auth flow.
5. Build student dashboard + cheat sheet module.
6. Build practice coding module + judge.
7. Build exam module with timer and review.
8. Build admin views for content management.
9. Verify routes, metadata, and protected access.

## Metadata

Each route will define `head()` with route-specific title, description, og:title, and og:description. No root-level `og:image`.

## Open Decision

For the coding judge, I will implement a lightweight server function that runs submitted code in a controlled serverless environment using a safe Node.js sandbox approach. If this needs an external judge API, that will be added as a follow-up.
