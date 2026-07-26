# AGENTS.md — LMS Web Application

This file is the entry point for AI coding agents (Codex, etc.) working in this repo.
Read this fully before writing any code.

## Project
A premium LMS web platform covering all three roles: Admin, Instructor, Student.
**Mobile app is out of scope for now** — do not scaffold, mention, or design around a
mobile app anywhere in this project until explicitly instructed later.

## Tech Stack
- **Framework**: Next.js (App Router, latest stable)
- **UI**: shadcn/ui + Tailwind CSS
- **ORM**: Drizzle ORM
- **DB + Storage**: Supabase (Postgres via Drizzle, Supabase Storage for
  PDF/slides/certificates/payment screenshots. Image uploads for course thumbnails
  and user/instructor avatars use UploadThing in `apps/web`. Video files use
  **Cloudflare R2** instead — see "Video Storage" section below.
- **Auth**: **Fully custom, built entirely in `services/backend`. Supabase Auth is NOT
  used.** The backend owns the `users`/`profiles` table, hashes passwords itself
  (bcrypt or argon2), issues its own JWTs (short-lived access token + longer-lived
  refresh token), and handles Google OAuth by exchanging the OAuth code itself —
  no Supabase Auth client, no Supabase session, no Supabase JWKS involved anywhere.
  See "Custom Authentication" section below.
- **Backend API**: Separate Node.js + Express service. The Next.js app talks to it via
  REST calls, NOT via Next.js API routes for core business logic. Next.js API routes
  are allowed only for thin BFF concerns: webhook forwarding, etc.
- **State/data fetching**: TanStack Query (React Query) for server state, Zustand (or
  React context) for lightweight client/UI state
- **Forms/validation**: React Hook Form + Zod
- **Package manager**: pnpm (workspaces)
- **Monorepo tool**: Turborepo

## Repo Structure
```
/apps
  /web        <- Next.js app (this is the only app right now)
/services
  /backend    <- Node.js + Express API, all business logic + DB access + auth lives here
/packages
  /ui         <- shared shadcn-based components
  /db         <- Drizzle schema + migrations, owned/migrated by services/backend
  /types      <- shared TypeScript types/DTOs used by web + backend
  /config     <- eslint, tsconfig, tailwind config presets
```
> Drizzle schema lives in `packages/db`, owned by `services/backend`. `apps/web` only
> imports **types** from `packages/types` — it never runs migrations or writes raw DB
> queries, and never imports any Supabase client SDK. All data mutations, all auth,
> and all reads go through the backend REST API.

## User Roles & Access
| Role | Access |
|---|---|
| Admin | Full dashboard, user management, all courses, payouts, site settings |
| Instructor | Own courses CRUD, own students, own analytics, payout requests |
| Student | Browse/buy courses, learning dashboard, progress, certificates |

Role stored in the backend-owned `profiles` table (`role: 'admin' | 'instructor' |
'student'`), linked 1:1 with the backend's own `users` table (not `auth.users`). Route
protection via Next.js middleware that verifies the backend-issued JWT (read from an
httpOnly cookie) and reads the `role` claim encoded in that JWT — no Supabase session
check anywhere in the web app.

## Hard Rules (do not violate)
1. `apps/web` never queries the database directly and never imports `packages/db`
   beyond types. All mutations go through `services/backend` REST API.
2. Payment system is **manual verification** right now (transaction ID + screenshot,
   admin approves). Do NOT implement Stripe/SSLCommerz/any automated gateway unless
   explicitly asked — see "Manual Payment System" section below.
3. Video files are stored in **Cloudflare R2**, not Supabase Storage (Supabase's free
   tier bandwidth is too small for video at scale). See "Video Storage" section below.
4. Every video player must render the **watermark overlay** (logged-in user's email,
   low opacity, repositioning every 8–12s) — required on every lecture view, not
   optional per-course.
5. No mobile app work of any kind until explicitly instructed.
6. **Authentication is fully custom and lives only in `services/backend`.** Do NOT use
   `@supabase/supabase-js`'s auth client, `supabase.auth.*` methods, Supabase session
   cookies, or Supabase JWKS verification anywhere — not in `apps/web`, not in
   `services/backend`. Supabase is used only as the Postgres database (via Drizzle) and
   for non-video file storage. See "Custom Authentication" below.

## Custom Authentication (build this now — replaces Supabase Auth)

Supabase Auth is **not used at all**. `services/backend` is the single source of truth
for identity.

### Data Model (Drizzle) — sketch
```
users
  id, email (unique), password_hash, email_verified_at (nullable),
  google_id (nullable, unique), auth_provider: 'password' | 'google',
  created_at, updated_at

profiles
  id, user_id (FK -> users.id), full_name, avatar_url,
  role: 'admin' | 'instructor' | 'student',
  created_at, updated_at

refresh_tokens
  id, user_id (FK -> users.id), token_hash, expires_at, revoked_at (nullable),
  created_at
  -- store a hash of the refresh token, never the raw token

password_reset_tokens
  id, user_id, token_hash, expires_at, used_at (nullable), created_at

email_verification_tokens
  id, user_id, token_hash, expires_at, used_at (nullable), created_at
```

### Flow
1. **Signup (email/password)**: backend hashes password (bcrypt/argon2), creates
   `users` + `profiles` row (`role: 'student'` by default), creates an
   `email_verification_tokens` row, sends a verification email (Resend/Nodemailer).
2. **Login**: backend verifies password hash, issues:
   - **Access token**: short-lived JWT (e.g. 15 min), signed with the backend's own
     secret/keypair, contains `sub` (user id) and `role`.
   - **Refresh token**: long-lived random token (e.g. 30 days), stored hashed in
     `refresh_tokens`, returned to the client as an **httpOnly, secure cookie**.
3. **Session persistence**: `apps/web` never stores the raw refresh token in JS-readable
   storage. The access token can be kept in memory (or a short-lived httpOnly cookie)
   and silently refreshed via a `POST /auth/refresh` call that reads the refresh cookie.
4. **Google OAuth**: `apps/web` redirects to Google's OAuth consent screen with the
   backend's own client ID/redirect URI. Google redirects back to a backend callback
   route (`/auth/google/callback`), which exchanges the code itself, finds-or-creates
   the `users`/`profiles` row, and issues access + refresh tokens exactly like the
   password flow — Supabase is never in this path.
5. **Email verification**: link emailed to the user hits a backend endpoint (or a thin
   `/auth/verify` web page that calls the backend) which marks `email_verified_at`.
6. **Password reset**: request → backend creates a `password_reset_tokens` row, emails a
   link → `/auth/reset-password` page → backend verifies token, updates `password_hash`.
7. **Logout**: backend revokes the refresh token (`revoked_at`) and the web app clears
   the refresh cookie.

### Route Protection
- Next.js middleware reads the access-token cookie, verifies its signature/expiry
  locally (or calls a lightweight backend `GET /auth/me` if you'd rather not duplicate
  verification logic in the edge runtime), and checks the `role` claim against the
  route's required role before allowing access to `/dashboard/admin`,
  `/dashboard/instructor`, etc.
- The backend independently re-verifies the JWT on every REST call — the frontend check
  is UX only, never the source of truth.

### What stays on Supabase
- **Postgres** (via Drizzle) — the actual database, including the `users`/`profiles`
  tables above.
- **Supabase Storage** — PDFs, slides, certificates, payment screenshots
  (unchanged from before).
- **UploadThing** — course thumbnails and user/instructor avatars in `apps/web`.
- Supabase Auth itself (the `auth.users` table, Supabase's auth API, Supabase session
  cookies) is **not used**. Do not create the old `auth.users` trigger/sync pattern —
  identity lives entirely in the backend's own `users` table now.

## Core Features (MVP — build first)
1. Auth: custom email/password signup+login + Google OAuth (all backend-issued JWTs,
   no Supabase Auth), email verification, password reset — see "Custom Authentication"
2. Course catalog (public): list, search, filter (category/level/price), course detail page
3. Course creation (Instructor): sections → lectures, upload PDF/slides to Supabase
   Storage and video to Cloudflare R2 (see "Video Storage"), drip content scheduling,
   free preview toggle per lecture
4. Checkout & payments: **manual payment verification** (see below), coupon codes.
   Automated gateway is a later phase, not MVP.
5. Student learning page: video player (custom, not raw `<video>`), progress tracking,
   mark-complete, resume-from-last-position
6. **Dynamic watermark overlay** on video player: renders logged-in user's email,
   floats/repositions every 8–12s via `setInterval`, low opacity (15–20%), value
   injected from session (never hardcoded/inspectable as static text)
7. Quiz + assignment: MCQ builder (instructor side), submission + basic auto-grading
   (MCQ), manual grading UI for assignments
8. Certificate generation: PDF generated server-side (backend) on course completion,
   downloadable from student dashboard
9. Admin dashboard: user list, course approval, revenue overview (charts via Recharts)
10. Instructor dashboard: own course analytics, student list, payout requests

## Manual Payment System (build this now — MVP)

Automated gateways (Stripe/SSLCommerz/bKash Merchant API) are deferred. The schema is
generic enough to absorb an automated gateway later without a rewrite.

### Flow
1. Student clicks "Enroll" on a paid course → sees a payment instructions page: admin's
   bKash/Nagad/Rocket number (or bank details), exact amount, and a unique **reference
   code** (e.g. `ORD-XXXXXX`) generated per order to help match payments manually.
2. Student pays outside the app via their own bKash/Nagad app, then returns to submit a
   **payment proof form**: transaction ID, sender number, payment method
   (bKash/Nagad/Rocket/Bank Transfer), optional screenshot upload → Supabase Storage.
3. Order created with status `pending_verification`. Student dashboard shows "Payment
   under review" — enrollment is NOT active yet.
4. **Admin "Pending Payments" queue** lists all `pending_verification` orders:
   transaction ID, screenshot, student, course, amount.
   - **Approve** → status → `paid`, enrollment auto-activates, confirmation email sent.
   - **Reject** (with reason field) → status → `rejected`, student notified, can resubmit.
5. Optional: auto-expire `pending_verification` orders after N days (cron/edge function).

### Data Model (Drizzle) — sketch
```
orders
  id, user_id, course_id, amount, currency, reference_code,
  status: 'pending_verification' | 'paid' | 'rejected' | 'expired' | 'refunded',
  payment_method: 'bkash' | 'nagad' | 'rocket' | 'bank_transfer' | 'gateway' (future),
  transaction_id, sender_number, proof_screenshot_url,
  reviewed_by (admin user_id, nullable), reviewed_at, rejection_reason,
  created_at, updated_at

enrollments
  id, user_id, course_id, order_id, enrolled_at, status: 'active' | 'revoked'
```

### Admin UI Requirements
- "Pending Payments" table: sortable/filterable by course, date, payment method
- Order detail view: full screenshot preview, copyable transaction ID, one-click
  Approve/Reject with confirmation dialog
- Audit trail: `reviewed_by`, `reviewed_at` shown per order
- Search by reference code or student email (for support cases)

### Student-Facing Requirements
- Clear status indicator on dashboard: Pending / Approved / Rejected
- Resubmit proof if rejected (edit transaction ID/screenshot on same order)
- Email notification on approval/rejection (backend-sent, e.g. Resend/Nodemailer)

### Coupons & Free Courses
- Coupon applied at order-creation time; discounted amount shown as what to pay
- Free courses skip the flow entirely: enroll immediately, `orders` row still created
  with `amount = 0`, `status = 'paid'` for consistent reporting/analytics

### Future: Automated Gateway (do not build yet)
- Stripe / SSLCommerz / bKash Merchant API, webhook-driven `paid` transition (no admin
  step), subscription billing for membership tiers. Because `payment_method` and
  `status` are already generic, gateway becomes just a new `payment_method` value —
  manual and automated can coexist per-course if ever needed.

## Video Storage — Cloudflare R2 Now, Dedicated Video Service Later

**Decision**: Store video files in **Cloudflare R2** (S3-compatible object storage),
not Supabase Storage. Reason: Supabase's free tier caps out at 1 GB file storage and
5 GB bandwidth/month — a handful of video views exhausts that. R2 gives 10 GB free
storage and, critically, **free egress** (no bandwidth charge), which is what actually
matters for video since bandwidth is the cost that scales with views. PDFs, slides,
thumbnails, and certificates stay on Supabase Storage — this decision applies to video
only. Migrate to a dedicated video service (Bunny.net Stream / Cloudflare Stream / Mux)
once adaptive bitrate streaming or automatic transcoding is needed.

### Build it now so migration is painless later
- Store the video reference as an **abstract `video_source` object** in the `lectures`
  table, not a raw hardcoded URL string:
  ```
  lectures
    ...
    video_provider: 'r2' | 'bunny' | 'cloudflare_stream' | 'mux'   (default 'r2')
    video_ref: text   -- R2 object key today, provider's video ID later
  ```
- Backend exposes a single endpoint like `GET /lectures/:id/video-url` that resolves
  `video_provider` + `video_ref` into a **signed, time-limited URL**. The web player
  always calls this endpoint — it never reads a raw R2 URL directly from the DB. This
  is the key abstraction: when you migrate providers later, only this one resolver
  function changes, not the frontend player code or the DB rows of old videos.
- Use R2 **presigned URLs** (S3-compatible SDK, short expiry, e.g. 10–30 min) from day
  one, not public bucket URLs — this gives hotlink protection even before a dedicated
  video CDN is in place.
- R2 is accessed via the standard S3 API (`@aws-sdk/client-s3` works against it with a
  custom endpoint), so the backend integration is a normal S3 upload/presign flow — no
  R2-specific SDK needed.

### Known limitations while on R2 (accept for MVP)
- No adaptive bitrate — all students get the same file quality regardless of connection
  speed. Keep uploaded videos at a reasonable compressed resolution (e.g. 720p) to avoid
  extreme buffering issues.
- No automatic transcoding — instructor must upload an already-compressed, web-friendly
  MP4 (H.264). Add file-size/format validation on upload to enforce this.
- Storage beyond the 10 GB free tier is cheap but still monitor usage as the course
  library grows.

### Migration trigger points (revisit when any of these happen)
- Need for adaptive streaming or automatic multi-resolution transcoding
- Student complaints about buffering/quality
- Need for DRM-level protection beyond signed URLs + watermark

### Migration path when ready
1. Pick provider (Bunny.net Stream recommended first for cost)
2. Bulk-upload existing videos from R2 to the new provider via their API
3. Update each `lectures` row: `video_provider` → new value, `video_ref` → new video ID
4. Update the backend's `video-url` resolver to handle the new provider case
5. Old R2-stored videos can stay as-is for rows not yet migrated — both providers can
   coexist during a gradual rollout, no downtime needed

## Phase 2 / Advanced Features (not MVP)
- AI tutor chatbot (per-course context, calls backend which proxies to Claude/OpenAI)
- Auto-generated quizzes from lecture transcripts
- Discussion forum per lecture (threaded comments, upvote)
- Gamification: XP, badges, streaks, leaderboard
- Proctored exam mode (fullscreen lock + devtools detection + tab-switch warning)
- Live class integration (Zoom/Google Meet link embed + calendar sync)
- Affiliate/referral program
- SCORM/xAPI import for enterprise content

## Key Pages (App Router structure)
```
/                          landing/marketing
/courses                   catalog
/courses/[slug]            course detail + purchase
/learn/[courseId]          student player (protected)
/dashboard/student         student home (protected)
/dashboard/instructor      instructor home (protected, role=instructor)
/dashboard/instructor/courses/[id]/edit   course builder (protected)
/dashboard/admin           admin home (protected, role=admin)
/auth/login /auth/signup /auth/verify /auth/reset-password
```

## Backend Communication
- All mutations (create course, enroll, submit quiz, etc.) → REST calls to
  `services/backend` (Express), never direct Drizzle calls from `apps/web`.
- Use a typed API client (`apps/web/lib/api-client.ts`) wrapping `fetch`, attaching the
  backend-issued access token as `Authorization: Bearer <accessToken>` (or relying on
  the httpOnly cookie, depending on how you wire the client vs. server components).
- **Auth is fully custom**: `services/backend` issues and verifies its own JWTs (its own
  signing secret/keypair) and manages refresh tokens itself in the `refresh_tokens`
  table. It never talks to Supabase Auth, never validates against Supabase's JWKS, and
  never trusts a client-supplied Supabase session.

## Design System (use for all UI — do not default to generic AI styling)
**Palette**
- Background (ink navy): `#12151C`
- Surface/card: `#1B1F29`
- Text primary (warm off-white): `#F2EFE7`
- Text muted: `#8B8D98`
- Signature accent (brass gold): `#C9A15A` — reserve for CTAs, progress indicators,
  key highlights only. Do not overuse.
- Secondary accent (muted teal): `#3F7A6B`

**Typography**
- Display/headline: `Fraunces` (serif, used sparingly for headlines)
- Body: `Inter` or `General Sans`
- Stats / course codes / numeric data: `IBM Plex Mono`

**Signature element**
A thin gold "progress thread" — a slim horizontal/vertical accent line used
consistently in nav, hero, and section dividers, echoing course completion/progress.
Reuse this motif rather than inventing a new decorative device per page.

**Layout tendency**
Prefer asymmetric, content-driven layouts (headline + copy on one side, a real
functional UI element like a course/module card on the other) over generic centered
hero + 3-icon-feature-grid templates.

**General constraints**
- Flat design, no gradients/drop-shadows/glow.
- Sentence case everywhere in UI copy, never Title Case or ALL CAPS.
- Dark theme is the primary theme — build every component dark-first using the
  palette above, not retrofitted from a light-mode default.

## Performance Guidelines
- Use React Server Components by default; mark `"use client"` only where interactivity
  (video player, forms, watermark overlay) is required.
- Use `next/image` for all thumbnails/avatars.
- Paginate/virtualize long lists (course catalog, student lists) — use TanStack
  Query's infinite queries.
- Cache public catalog pages with ISR (`revalidate`), keep dashboards fully dynamic.
- Keep shadcn/ui components in `packages/ui` to avoid duplication and bundle bloat.

## Environment Variables
```
# Database (Postgres via Supabase, accessed only from services/backend)
DATABASE_URL=

# Supabase Storage (non-video files only — PDFs, slides, thumbnails, certificates)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=       # server-only, used by services/backend for storage

# Cloudflare R2 (video)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=

# Custom auth (services/backend only — never exposed to apps/web)
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=
GMAIL_SMTP_USER=
GMAIL_SMTP_APP_PASSWORD=
SEED_ADMIN_EMAIL=            # backend-only seed script: services/backend/src/scripts/seed-admin.ts
SEED_ADMIN_PASSWORD=         # backend-only seed script: services/backend/src/scripts/seed-admin.ts
SEED_ADMIN_NAME=             # backend-only seed script: services/backend/src/scripts/seed-admin.ts

# Manual payment
MANUAL_PAYMENT_BKASH_NUMBER=
MANUAL_PAYMENT_NAGAD_NUMBER=
MANUAL_PAYMENT_ROCKET_NUMBER=
MANUAL_PAYMENT_BANK_DETAILS=
MANUAL_PAYMENT_COUPONS=         # format: CODE:percent:10,CODE2:amount:500
# UploadThing dashboard -> API Keys -> V7 token. Used by apps/web image uploads.
UPLOADTHING_TOKEN=
SUPABASE_STORAGE_COURSE_THUMBNAILS_BUCKET=course-thumbnails
SUPABASE_STORAGE_PROFILE_AVATARS_BUCKET=profile-avatars
SUPABASE_STORAGE_PAYMENT_PROOFS_BUCKET=payment-proofs
SUPABASE_STORAGE_CERTIFICATES_BUCKET=certificates
SUPABASE_STORAGE_LECTURE_MATERIALS_BUCKET=lecture-materials

# apps/web
NEXT_PUBLIC_BACKEND_API_URL=
```
> Note: `apps/web` no longer needs `NEXT_PUBLIC_SUPABASE_URL` or
> `NEXT_PUBLIC_SUPABASE_ANON_KEY` — it never talks to Supabase directly for auth, DB,
> or storage. Everything goes through `NEXT_PUBLIC_BACKEND_API_URL`.

## Non-Goals
- No mobile app work of any kind right now.
- Do not put raw Express-style route handlers for core business logic in Next.js —
  keep that in services/backend.
- Do not use Supabase Auth, Supabase session cookies, or `supabase.auth.*` anywhere.

## Build Order
1. Monorepo scaffold (Turborepo, pnpm workspaces, folder structure above)
2. Supabase project (Postgres + storage buckets only — **Supabase Auth is not used**)
   + Cloudflare R2 bucket
3. Drizzle schema: `users`, `profiles`, `refresh_tokens`, `password_reset_tokens`,
   `email_verification_tokens`, `courses`, `sections`, `lectures`, `enrollments`,
   `orders`, `progress`
4. Backend skeleton: Express + Drizzle + custom auth (password hashing, JWT
   issuing/verification, refresh-token rotation, Google OAuth code exchange) + auth
   middleware + role guards
5. Web auth flow (login/signup/verify/reset pages calling backend REST endpoints,
   role-based middleware verifying the backend-issued JWT)
6. Course CRUD (instructor side)
7. Manual payment flow (student submit proof → admin approve/reject)
8. Video upload (R2) + player + watermark overlay
9. Progress tracking, quizzes, certificates
10. Remaining features per "Phase 2 / Advanced Features" above

## Progress Log
- Monorepo scaffold is in place with pnpm workspaces, Turborepo, shared TypeScript,
  ESLint, Tailwind/config packages, `apps/web`, `services/backend`, `packages/ui`,
  `packages/db`, and `packages/types`.
- Dark-first LMS design system is wired into the web app with the required ink navy,
  brass gold, muted teal, Fraunces/Inter-style typography direction, and progress
  thread motif.
- Drizzle schema and initial migration cover `profiles`, `courses`, `sections`,
  `lectures`, `orders`, `enrollments`, and `progress`, including R2-oriented video
  fields (`video_provider`, `video_ref`) and manual-payment-ready order fields.
  Custom auth tables (`users`, `refresh_tokens`, `password_reset_tokens`,
  `email_verification_tokens`) are now included, and `profiles.user_id` references the
  backend-owned `users.id` instead of `auth.users`.
- Supabase Auth has been removed from active code paths. Authentication is fully custom
  and owned by `services/backend`: backend-owned users/profiles, bcrypt password
  hashing, backend-issued JWT access tokens, hashed refresh-token rotation, logout
  revocation, backend-handled Google OAuth, email verification, and password reset.
- Custom auth hardening completed this session: password login now rejects unverified
  email accounts with a clear error, the login UI exposes a resend-verification action,
  Google OAuth callback sets httpOnly cookies directly from the backend and redirects
  without `access_token`/`refresh_token` query params, and the old web callback route no
  longer accepts tokens from URL params.
- Role-based dashboard routing was fixed end-to-end: password login now falls back to
  the authenticated user profile's actual role dashboard, the Google callback now
  resolves missing `next` values to the logged-in user's role instead of `/dashboard/student`,
  and web middleware now redirects role mismatches back to the correct dashboard for
  `admin`, `instructor`, or `student` rather than defaulting to the student route.
- Validation completed for this change set: `pnpm typecheck`, `pnpm lint`, and
  `pnpm build` all pass. A live browser login replay was not completed because no
  seeded admin credential was available in the checked-in env and the local dev ports
  were already occupied by existing processes.
- Real email sending is wired through `services/backend/src/lib/mailer.ts` using
  Nodemailer + Gmail SMTP (`smtp.gmail.com`, port `465`, secure), with reusable dark
  navy/brass templates for verification and password reset links. Gmail SMTP env vars
  are documented as `GMAIL_SMTP_USER` and `GMAIL_SMTP_APP_PASSWORD`.
- Custom auth E2E verification is pending local credentials: the loaded environment has
  database/JWT/backend URL values, but Google OAuth and Gmail SMTP variables are missing
  locally, so real signup-email delivery, verify-click-login, and Google OAuth browser
  tests could not be completed in this session.
- Follow-up items for custom auth: add rate limiting on login/reset endpoints and add
  automated tests for auth flows.
- ~~Supabase auth integration is scaffolded in the web app with login, signup, OAuth
  callback, verify/reset pages, session-aware middleware/proxy, and role-based
  dashboard routing.~~ (superseded — see architecture change above)
- ~~Auth profile creation is database-backed via `packages/db/drizzle/
  0001_auth_user_profile_trigger.sql` (`AFTER INSERT ON auth.users` trigger) and the
  `/auth/sync-profile` endpoint.~~ (superseded — no `auth.users` table anymore under
  custom auth; profile creation now happens directly in the backend's signup/OAuth
  handlers)
- Public catalog and course detail pages are connected to backend REST reads; the web
  app still does not import `packages/db` or query the database directly.
- Manual payment MVP is implemented: order/enrollment schema is in place with coupon
  audit fields (`coupon_code`, `discount_amount`), backend payment endpoints create
  reference-code orders, apply configured coupons, instantly enroll free/fully
  discounted courses, accept proof submissions with optional Supabase Storage
  screenshot upload, expose student order status, and provide admin pending-payment
  approve/reject endpoints that activate enrollments and send mailer-based
  notifications when email credentials are configured.
- Manual payment web flow is implemented: course detail enrollment creates an order,
  `/courses/[slug]/enroll` shows payment instructions and proof submission,
  `/dashboard/student` shows pending/paid/rejected order status with resubmission for
  rejected orders, and `/dashboard/admin/payments` provides a filterable pending
  payments queue with approve/reject actions and screenshot links.
- Manual payment E2E verification is pending external credentials/configuration:
  Supabase Storage credentials/bucket are needed to verify screenshot upload,
  Gmail SMTP credentials are needed to verify approval/rejection emails, and manual
  payment account env vars are needed to display real bKash/Nagad/Rocket/bank details.
  Drizzle generation also exposed an existing migration metadata limitation:
  `_journal.json` lists post-0000 migrations but only `0000_snapshot.json` exists, so
  `drizzle-kit generate` reaches an interactive conflict prompt in non-TTY mode; the
  manual SQL migration `0002_manual_payment_coupons.sql` was added for this session's
  schema change.
- Video storage milestone is implemented: backend R2 integration uses the S3-compatible
  AWS SDK to generate time-limited presigned PUT URLs for instructor lecture uploads
  and time-limited presigned GET URLs through `GET /lectures/:id/video-url`. The video
  URL resolver is provider-aware and currently supports `video_provider = 'r2'`, with
  unsupported providers returning a clear not-implemented response for future migration.
- UploadThing is now wired for image uploads only. The web app hosts a typed
  `/api/uploadthing` route with a single `imageUploader` file route limited to JPG, PNG,
  and WEBP images up to 4 MB. The instructor course builder now uses an UploadThing
  button for course thumbnails, and the profile settings page uses the same flow for
  user/instructor avatars. Successful uploads persist the returned URL string into the
  existing `thumbnail_url` and `avatar_url` fields, and the web app now allows the
  UploadThing CDN domains in `next/image` so previews render correctly. Video,
  PDFs/slides/certificates, and payment proofs remain on their existing R2/Supabase
  Storage paths unchanged.
- Instructor course builder now includes an MP4 upload control that requests a backend
  presigned upload URL, uploads directly from the browser to R2, then saves the
  returned abstract R2 object key in `lectures.video_ref`.
- Student learning page now loads enrolled course outlines from the backend and renders
  a custom video player on `/learn/[courseId]` with signed video URL loading, custom
  play/progress controls, and the mandatory dynamic low-opacity email watermark that
  repositions every 8-12 seconds.
- Video access control is enforced server-side: only users with an active enrollment
  for the lecture's course can fetch a signed lecture video URL. The web player never
  reads raw R2 URLs from the database.
- R2 E2E verification is pending real Cloudflare credentials and bucket CORS:
  `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, and a
  bucket CORS rule allowing browser PUT uploads from the web origin are required to
  verify actual upload/playback against R2.
- Quiz MVP is implemented for MCQ quizzes only. The Drizzle schema now includes
  `quizzes`, `quiz_questions`, `quiz_options`, and `quiz_attempts`, with each quiz
  attached to exactly one section or lecture, normalized MCQ options with
  `is_correct`, and scored attempts storing submitted answer maps, score,
  total-question count, and completion timestamp.
- Instructor quiz APIs are implemented under the existing course-builder backend
  surface: instructors/admins can create or update a section quiz via
  `PUT /instructor/courses/:id/sections/:sectionId/quiz`, create or update a lecture
  quiz via `PUT /instructor/courses/:id/lectures/:lectureId/quiz`, and delete a quiz
  via `DELETE /instructor/courses/:id/quizzes/:quizId`. Ownership checks reuse the
  course/section/lecture guards already used by the course builder.
- Student quiz APIs are implemented under `/quizzes`: enrolled students/admins can
  fetch a published quiz by target (`GET /quizzes/target?sectionId=...` or
  `lectureId=...`), fetch a quiz by id, and submit answers through
  `POST /quizzes/:quizId/submit`. Submission is auto-graded immediately by exact
  correct-option matching, supports single-answer and multi-answer MCQs, returns score
  and percentage, and persists a `quiz_attempts` row.
- Learning responses now include published section and lecture quizzes with latest
  attempt summaries. The instructor course builder includes quiz builder controls for
  section and lecture quizzes with add/remove question, add/remove option, correct
  option marking, publish toggle, save, and delete. The student learning page renders
  quiz-taking panels, submits selected answers to the backend, and shows the immediate
  score/result.
- Quiz access control is enforced server-side: only users with an active enrollment in
  the quiz's course can fetch or submit student quiz endpoints; instructor mutation
  endpoints still require course ownership.
- Quiz verification completed: `pnpm --filter @workspace/db typecheck`,
  `pnpm --filter @workspace/types typecheck`,
  `pnpm --filter @workspace/backend typecheck`,
  `pnpm --filter @workspace/web typecheck`, `pnpm lint`, and `pnpm build` all pass.
  `pnpm --filter @workspace/db db:migrate` applied pending migrations and the quiz
  tables were confirmed present in the configured database. Full HTTP E2E was
  attempted with temporary instructor/student/course/enrollment data, but the
  configured database is missing the backend-owned `users` table, so the setup failed
  before exercising the quiz routes. Once the custom-auth migrations are aligned on
  that database, rerun an HTTP E2E covering instructor quiz creation, enrolled student
  quiz fetch, submission, score calculation, and `quiz_attempts` persistence.
- Assignment MVP is implemented for manually graded text submissions. The Drizzle
  schema now includes `assignments` and `assignment_submissions`, with each assignment
  attached to exactly one section or lecture, one current submission per enrolled
  student, optional due dates, max score, grade feedback, grader audit fields, and a
  manual SQL migration at `packages/db/drizzle/0005_assignments.sql`.
- Instructor assignment APIs are implemented under the existing course-builder
  backend surface: instructors/admins can create or update a section assignment via
  `PUT /instructor/courses/:id/sections/:sectionId/assignment`, create or update a
  lecture assignment via `PUT /instructor/courses/:id/lectures/:lectureId/assignment`,
  delete an assignment via `DELETE /instructor/courses/:id/assignments/:assignmentId`,
  and grade submissions via
  `PATCH /instructor/courses/:id/assignment-submissions/:submissionId/grade`.
  Ownership checks reuse the course/section/lecture guards already used by the course
  builder, and grading rejects scores above the assignment max score.
- Student assignment submission is implemented through
  `POST /assignments/:assignmentId/submit`. The endpoint only accepts published
  assignments for users with an active enrollment in the assignment's course, and
  resubmission resets any previous grade/feedback so instructors can re-grade the
  latest work.
- Learning responses now include published section and lecture assignments with the
  current student's submission/grade state. The instructor course builder includes
  assignment authoring and inline manual grading panels, and the student learning page
  renders assignment submission/resubmission panels with grade feedback when available.
- Assignment verification completed: `pnpm --filter @workspace/db typecheck`,
  `pnpm --filter @workspace/types typecheck`,
  `pnpm --filter @workspace/backend typecheck`,
  `pnpm --filter @workspace/web typecheck`, `pnpm lint`, and `pnpm build` all pass.
  After correcting the root `DATABASE_URL`, `pnpm --filter @workspace/db db:migrate`
  applies successfully. Live schema verification confirms the backend-owned auth
  tables (`users`, `refresh_tokens`, `password_reset_tokens`,
  `email_verification_tokens`) and assignment tables (`assignments`,
  `assignment_submissions`) exist with the expected columns, foreign keys, checks, and
  indexes. The verification exposed migration drift from the original `profiles`
  table: `profiles.id` lacked the UUID default expected by the current Drizzle schema,
  so `packages/db/drizzle/0006_profiles_id_default.sql` now aligns it with
  `DEFAULT gen_random_uuid()`. Full assignment HTTP E2E now passes against the
  configured database through `services/backend/src/scripts/assignment-e2e.ts`:
  instructor creates a published section assignment, enrolled student submits,
  instructor grades it, and the student learning response shows score `23` with grade
  feedback. Follow-up verification this session: `pnpm --filter @workspace/db
  typecheck` and `pnpm --filter @workspace/backend typecheck` pass.
- Instructor course CRUD is implemented with list, new, edit, update, and delete
  screens calling backend REST mutations through server actions.
- Instructor course builder now supports sections and lectures on the course edit page:
  create/update/delete sections, create/update/delete lectures, lecture ordering,
  duration, preview toggle, publication toggle, availability date, video provider,
  and abstract video reference.
- Backend lecture deletion now verifies that the lecture belongs to the course in the
  URL before deleting, matching the ownership checks used by other instructor course
  mutations.
- `pnpm install` failure was confirmed as environment-specific. `pnpm@10.33.4` is a
  published signed registry version; sandboxed runs failed during pnpm's version
  fetch/signature path, while the same `pnpm install` succeeded outside the sandbox
  with the pinned version. This should not block normal installs on a local machine
  with ordinary network and package-manager cache access.
- Verification completed this session: `pnpm install`, backend typecheck
  (`pnpm --filter @workspace/backend typecheck`), web typecheck
  (`pnpm --filter @workspace/web typecheck`), `pnpm lint`, and `pnpm build`.
- Progress tracking is implemented end-to-end for published lectures in enrolled
  courses. The backend now exposes `PUT /progress/lectures/:lectureId`, which verifies
  the logged-in student/admin has an active enrollment before upserting
  `progress.position_seconds`, `last_watched_at`, `updated_at`, and completion fields;
  non-complete resume saves preserve any existing completed state, while
  `isCompleted: true` marks the lecture complete and sets `completed_at`.
- The student learning API now includes each lecture's saved progress plus course-level
  `completedLectureCount`, `totalLectureCount`, and `completionPercentage`, so
  certificate eligibility can be reached through normal lecture completion rather than
  only manual database state.
- The `/learn/[courseId]` player now resumes from the saved lecture position, auto-saves
  the current playback position about every 15 seconds and on pause/lecture switch,
  provides a dark-first `Mark complete` control, automatically marks the lecture
  complete on video end, and updates the course completion progress thread and outline
  completion/resume labels locally after saves.
- Progress tracking verification completed: `pnpm --filter @workspace/types
  typecheck`, `pnpm --filter @workspace/db typecheck`, `pnpm --filter
  @workspace/backend typecheck`, `pnpm --filter @workspace/web typecheck`,
  `pnpm lint`, and `pnpm build` all pass.
- Certificate generation is now verified end-to-end against the configured database and
  Supabase Storage path. The certificate E2E script
  `services/backend/src/scripts/certificate-e2e.ts` seeds a test instructor, student,
  published course, published lectures, and active enrollment; marks every published
  lecture complete through `PUT /progress/lectures/:lectureId`; calls
  `GET /certificates`; and confirms the generated certificate appears in the student's
  certificate list with a PDF URL and verification code. The run passed with two
  published lectures completed and a generated certificate returned.
- Certificate verification exposed two Supabase Storage integration issues that are now
  fixed in `services/backend/src/lib/supabase-storage.ts`: the helper can derive the
  HTTP project URL from a Supabase Postgres URL when `SUPABASE_URL` is configured that
  way locally, and it creates the configured Storage bucket on demand with the
  service-role key when Supabase reports the bucket is missing. The same helper path is
  used for certificate PDFs and payment proof uploads.
- Certificate verification completed: `pnpm --filter @workspace/types typecheck`,
  `pnpm --filter @workspace/db typecheck`, `pnpm --filter @workspace/backend
  typecheck`, `pnpm --filter @workspace/web typecheck`, `pnpm lint`, and `pnpm build`
  all pass after the certificate E2E and Storage fixes.
- Lecture PDF/slides upload is implemented through the backend course-builder surface:
  instructors upload PDF/slides from the lecture editor, the web sends the selected
  file to `POST /instructor/courses/:id/lectures/:lectureId/material`, and
  `services/backend` validates type/size, writes the file to Supabase Storage in the
  configured `SUPABASE_STORAGE_LECTURE_MATERIALS_BUCKET` bucket, then stores the
  returned public material URL on `lectures.pdf_url` or `lectures.slides_url`.
- Free-preview lecture playback now works for unauthenticated and non-enrolled users:
  `GET /lectures/:id/video-url` allows published lectures marked `is_preview` to
  resolve a signed R2 playback URL without enrollment, while all non-preview lectures
  still require a valid backend-issued JWT and active enrollment. The public course
  detail page renders a dark-first free-preview player for preview lectures, and the
  enrolled learning player still uses the same endpoint with optional auth.
- Course creation gap verification completed: `pnpm --filter @workspace/types
  typecheck`, `pnpm --filter @workspace/db typecheck`, `pnpm --filter
  @workspace/backend typecheck`, `pnpm --filter @workspace/web typecheck`,
  `pnpm lint`, and `pnpm build` all pass.
- Admin dashboard MVP features are implemented. A backend-owned `users.suspended_at`
  field and manual migration `packages/db/drizzle/0008_user_suspension.sql` support
  user activate/suspend actions, and backend auth rejects suspended accounts on
  protected REST calls.
- A dedicated admin REST surface is mounted at `/admin`: admins can list/filter users
  with role/status, suspend/reactivate users, list `pending_review` courses, approve
  courses into `published`, reject courses into `archived`, and fetch revenue metrics
  with paid/pending revenue, order counts, course counts, user counts, enrollment
  counts, monthly revenue, and revenue by payment method.
- The web admin dashboard now links to real dark-first admin work surfaces:
  `/dashboard/admin/users`, `/dashboard/admin/courses`, and
  `/dashboard/admin/revenue`, alongside the existing manual payments queue. The revenue
  page uses Recharts, now installed in `@workspace/web`, for the monthly paid-revenue
  chart.
- Admin dashboard verification completed: `pnpm --filter @workspace/types typecheck`,
  `pnpm --filter @workspace/db typecheck`, `pnpm --filter @workspace/backend
  typecheck`, `pnpm --filter @workspace/web typecheck`, `pnpm lint`, and
  `pnpm build` all pass.
- Task 2 admin dashboard surface is now confirmed end-to-end in this session:
  user management exposes list/filter/activate/suspend actions, the course approval
  queue handles `pending_review` courses with approve/reject actions, and the revenue
  overview renders charted revenue data with Recharts. No additional Recharts
  install was needed because `@workspace/web` already depended on it.
- Instructor dashboard Task 3 is now implemented: the backend exposes instructor
  overview analytics, per-course student rosters with completion state, and a payout
  request surface; the web app renders an instructor dashboard home, per-course
  student list page, and payout request/history page; and the admin dashboard now
  includes a payout review queue with approve/reject/mark-paid actions backed by a
  new `payout_requests` table and `payout_status` enum.
- Instructor dashboard verification completed this session: `pnpm typecheck`,
  `pnpm lint`, and `pnpm build` all pass after adding the instructor analytics and
  payout workflow.
- Responsive web pass completed across the main LMS surfaces: the dashboard shell now
  uses a mobile drawer/sidebar pattern, public and auth pages use smaller responsive
  paddings and text scales, course detail and enrollment layouts stack cleanly on
  narrow screens, admin user and instructor student rosters switch to mobile card
  layouts, and the learning/preview video players keep controls and watermark text
  usable at phone widths. A few dense analytics and builder areas still rely on
  intentional card/scroll patterns for long data sets, but the pages no longer depend
  on fixed desktop-only widths.
- Responsive verification completed: `pnpm typecheck`, `pnpm lint`, and `pnpm build`
  all pass after the layout updates.
- Admin user management now supports direct instructor creation from the backend-owned
  user store, and `services/backend/src/scripts/seed-admin.ts` seeds or updates a
  single verified admin account from `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, and
  `SEED_ADMIN_NAME`. The backend package exposes `pnpm --filter @workspace/backend
  seed:admin` for that script.
- Task 1 redirect fix completed: the password login server action now preserves
  Next.js `NEXT_REDIRECT` throws instead of swallowing them in the login `catch`
  block, and the dashboard redirect path now resolves cleanly for admin,
  instructor, and student sessions without showing the redirect error page.
- Task 2 dashboard shell completed: a shared role-aware dashboard layout now renders
  the ink-navy sidebar with brass-accent active states, sentence-case nav labels,
  role-specific links, user name/email, logout action, and a mobile collapsible
  drawer for admin, instructor, and student dashboards.
- Frontend UI/UX consistency pass completed: the shared floating-label field pattern
  now lives in `packages/ui` (`FloatingInput` and `FloatingTextarea`), the app-local
  wrapper re-exports the shared component, and the auth login/signup flows were moved
  to RHF + Zod client forms with field-level validation, distinct server error
  handling, resend-verification actions, and disabled loading submit states.
- Key frontend screens were brought onto the shadcn primitives used elsewhere in the
  design system, including the reset-password flow, profile settings, course
  enrollment, pending payments, payout requests, instructor course forms, course
  outline builder, assignment/quiz builders, student assignment/quiz panels, upload
  controls, and the learning player controls.
- Verification for this pass completed successfully: `pnpm typecheck`, `pnpm lint`,
  and `pnpm build` all pass after moving auth form state out of the `use server`
  module and forwarding refs from the shared input/textarea primitives.
