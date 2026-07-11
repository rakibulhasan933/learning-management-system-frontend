# apps/web — LMS Web Application Spec

## 1. Purpose
Full-featured LMS web application covering **all three roles**: Admin, Instructor, and Student.
This is the primary/heaviest app in the monorepo — course creation, content management,
payments, analytics, and student learning experience all happen here.

Mobile app (apps/mobile) is intentionally scoped down to **Student-only, learning-focused**
features. Do NOT duplicate admin/instructor logic into mobile.

## 2. Tech Stack
- **Framework**: Next.js (App Router, latest stable)
- **UI**: shadcn/ui + Tailwind CSS
- **ORM**: Drizzle ORM
- **Auth + DB + Storage**: Supabase (Postgres, Supabase Auth, Supabase Storage for
  video/PDF/thumbnails)
- **Backend API**: Separate Node.js + Express service (see section 8). Next.js talks to it
  via REST calls, NOT via Next.js API routes for core business logic. Next.js API routes
  are allowed only for thin BFF (backend-for-frontend) concerns: webhook forwarding,
  server actions that need Supabase service-role key, etc.
- **State/data fetching**: TanStack Query (React Query) for server state, Zustand (or React
  context) for lightweight client/UI state
- **Forms/validation**: React Hook Form + Zod
- **Package manager**: pnpm (workspaces)
- **Monorepo tool**: Turborepo

## 3. Monorepo Position
```
/apps
  /web        <- this app (Next.js)
/services
  /backend    <- Node.js + Express API (separate deploy target)
/packages
  /ui         <- shared shadcn-based components (used by web only, mobile has its own)
  /db         <- Drizzle schema + migrations (shared source of truth, imported by backend)
  /types      <- shared TypeScript types/interfaces (DTOs) used by web, mobile, backend
  /config     <- eslint, tsconfig, tailwind config presets
```
> Drizzle schema lives in `packages/db` and is owned/migrated by the backend service.
> `apps/web` should import **types only** from `packages/db` (or better, from
> `packages/types` generated from it) — it should never run migrations or write raw
> DB queries directly. All data mutations go through the backend REST API.

## 4. User Roles & Access
| Role | Access |
|---|---|
| Admin | Full dashboard, user management, all courses, payouts, site settings |
| Instructor | Own courses CRUD, own students, own analytics, payout requests |
| Student | Browse/buy courses, learning dashboard, progress, certificates |

Role stored in Supabase `profiles` table (`role: 'admin' \| 'instructor' \| 'student'`).
Route protection via Next.js middleware checking Supabase session + role claim.

## 5. Core Features (MVP — build first)
1. Auth: email/password + Google OAuth via Supabase Auth, email verification, password reset
2. Course catalog (public): list, search, filter (category/level/price), course detail page
3. Course creation (Instructor): sections → lectures, upload video/PDF/slides to Supabase
   Storage, drip content scheduling, free preview toggle per lecture
4. Checkout & payments: **Manual payment verification system** (see Section 5A below),
   coupon codes. Automated gateway (Stripe/SSLCommerz) is a later phase, not MVP.
5. Student learning page: video player (custom, not raw `<video>`), progress tracking,
   mark-complete, resume-from-last-position
6. **Dynamic watermark overlay** on video player: renders logged-in user's email, floats/
   repositions every 8–12s via `setInterval`, low opacity (15–20%), value injected from
   session (never hardcoded/inspectable as static text)
7. Quiz + assignment: MCQ builder (instructor side), submission + basic auto-grading
   (MCQ), manual grading UI for assignments
8. Certificate generation: PDF generated server-side (backend) on course completion,
   downloadable from student dashboard
9. Admin dashboard: user list, course approval, revenue overview (charts via Recharts)
10. Instructor dashboard: own course analytics, student list, payout requests

## 5A. Manual Payment System (build this now — MVP)

Automated gateways (Stripe/SSLCommerz/bKash Merchant API) are deferred. Build the schema
generic enough to absorb an automated gateway later without a rewrite (see 5A.6).

### 5A.1 Flow
1. Student clicks "Enroll" on a paid course → sees a payment instructions page: admin's
   bKash/Nagad/Rocket number (or bank details), exact amount, and a unique **reference
   code** (e.g. `ORD-XXXXXX`) generated per order to help match payments manually.
2. Student pays outside the app via their own bKash/Nagad app, then returns to submit a
   **payment proof form**:
   - Transaction ID (text)
   - Sender number (text)
   - Payment method (select: bKash / Nagad / Rocket / Bank Transfer)
   - Screenshot upload (optional, recommended) → Supabase Storage
3. Order created with status `pending_verification`. Student dashboard shows "Payment
   under review" — enrollment is NOT active yet.
4. **Admin "Pending Payments" queue** lists all `pending_verification` orders: transaction
   ID, screenshot, student, course, amount.
   - Admin checks their bKash/Nagad account/SMS for a matching transaction ID + amount.
   - **Approve** → status → `paid`, enrollment auto-activates, confirmation email sent.
   - **Reject** (with reason field) → status → `rejected`, student notified, can resubmit.
5. Optional: auto-expire `pending_verification` orders after N days (cron/edge function).

### 5A.2 Data Model (Drizzle) — sketch
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

### 5A.3 Admin UI Requirements
- "Pending Payments" table: sortable/filterable by course, date, payment method
- Order detail view: full screenshot preview, copyable transaction ID, one-click
  Approve/Reject with confirmation dialog
- Audit trail: `reviewed_by`, `reviewed_at` shown per order
- Search by reference code or student email (for support cases)

### 5A.4 Student-Facing Requirements
- Clear status indicator on dashboard: Pending / Approved / Rejected
- Resubmit proof if rejected (edit transaction ID/screenshot on same order)
- Email notification on approval/rejection (backend-sent, e.g. Resend/Nodemailer)

### 5A.5 Coupons & Free Courses
- Coupon applied at order-creation time; discounted amount shown as what to pay
- Free courses skip the flow entirely: enroll immediately, `orders` row still created
  with `amount = 0`, `status = 'paid'` for consistent reporting/analytics

### 5A.6 Future: Automated Gateway (do not build yet)
- Stripe / SSLCommerz / bKash Merchant API, webhook-driven `paid` transition (no admin
  step), subscription billing for membership tiers
- Because `payment_method` and `status` are already generic, gateway becomes just a new
  `payment_method` value — manual and automated can coexist per-course if ever needed

## 6. Phase 2 / Advanced Features
- AI tutor chatbot (per-course context, calls backend which proxies to Claude/OpenAI)
- Auto-generated quizzes from lecture transcripts
- Discussion forum per lecture (threaded comments, upvote)
- Gamification: XP, badges, streaks, leaderboard
- Proctored exam mode (fullscreen lock + devtools detection + tab-switch warning)
- Live class integration (Zoom/Google Meet link embed + calendar sync)
- Affiliate/referral program
- SCORM/xAPI import for enterprise content

## 7. Key Pages (App Router structure)
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

## 8. Backend Communication
- All mutations (create course, enroll, submit quiz, etc.) → REST calls to
  `services/backend` (Express), never direct Drizzle calls from `apps/web`.
- Use a typed API client in `packages/types` or `apps/web/lib/api-client.ts` wrapping
  `fetch`, with the Supabase JWT attached as `Authorization: Bearer <token>`.
- Backend validates the JWT against Supabase (via Supabase's JWKS or service-role
  verification), NOT by trusting the client.

## 9. Performance Guidelines
- Use React Server Components by default; mark `"use client"` only where interactivity
  (video player, forms, watermark overlay) is required.
- Video (MVP decision): store raw video files in **Supabase Storage** for now — simple,
  free-tier friendly, good enough to launch. This is a deliberate temporary choice, not
  the final architecture (see Section 12 below for the migration plan).
- Use `next/image` for all thumbnails/avatars.
- Paginate/virtualize long lists (course catalog, student lists) — use TanStack Query's
  infinite queries.
- Cache public catalog pages with ISR (`revalidate`), keep dashboards fully dynamic.
- Keep shadcn/ui components in `packages/ui` to avoid duplication and bundle bloat.

## 10. Environment Variables (web)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_BACKEND_API_URL=
SUPABASE_SERVICE_ROLE_KEY=       # server-only, for BFF routes if any
```

## 11. Non-Goals for This App
- Do not implement mobile-specific push notifications here (belongs to apps/mobile).
- Do not put raw Express-style route handlers for core business logic in Next.js —
  keep that in services/backend.

## 12. Video Storage — MVP Now, Migrate Later

**Decision**: Launch with video files stored in **Supabase Storage** (private bucket,
e.g. `course-videos`). Migrate to a dedicated video service (Bunny.net Stream /
Cloudflare Stream / Mux) once user base or bandwidth cost justifies it.

### 12.1 Build it now so migration is painless later
- Store the video reference as an **abstract `video_source` object** in the `lectures`
  table, not a raw hardcoded Supabase URL string:
  ```
  lectures
    ...
    video_provider: 'supabase' | 'bunny' | 'cloudflare' | 'mux'   (default 'supabase')
    video_ref: text   -- Supabase storage path today, provider's video ID later
  ```
- Backend exposes a single endpoint like `GET /lectures/:id/video-url` that resolves
  `video_provider` + `video_ref` into a **signed, time-limited URL**. The web player
  always calls this endpoint — it never reads a raw Supabase Storage URL directly from
  the DB. This is the key abstraction: when you migrate providers later, only this one
  resolver function changes, not the frontend player code or the DB rows of old videos.
- Use Supabase Storage **signed URLs** (short expiry, e.g. 10–30 min) from day one, not
  public bucket URLs — this also gives you basic hotlink protection even before a real
  video CDN is in place.

### 12.2 Known limitations while on Supabase Storage (accept for MVP)
- No adaptive bitrate — all students get the same file quality regardless of connection
  speed. Keep uploaded videos at a reasonable compressed resolution (e.g. 720p) to avoid
  extreme buffering issues.
- No automatic transcoding — instructor must upload an already-compressed, web-friendly
  MP4 (H.264). Add file-size/format validation on upload to enforce this.
- Bandwidth costs scale linearly with views — monitor Supabase usage dashboard as
  enrollment grows; this is your main trigger to migrate.

### 12.3 Migration trigger points (revisit when any of these happen)
- Supabase Storage bandwidth/egress cost becomes noticeably high
- Student complaints about buffering/quality
- Need for adaptive streaming, offline download (mobile Phase 2), or DRM-level
  protection beyond signed URLs + watermark

### 12.4 Migration path when ready
1. Pick provider (Bunny.net Stream recommended first for cost — see earlier discussion)
2. Bulk-upload existing videos from Supabase Storage to the new provider via their API
3. Update each `lectures` row: `video_provider` → new value, `video_ref` → new video ID
4. Update the backend's `video-url` resolver to handle the new provider case
5. Old Supabase-stored videos can stay as-is for rows not yet migrated — both providers
   can coexist during a gradual rollout, no downtime needed