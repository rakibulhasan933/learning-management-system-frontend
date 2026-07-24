# EduPrime LMS — README

> A premium, full-stack Learning Management System covering Admin, Instructor, and Student roles. Built with Next.js, Node.js/Express, Drizzle ORM, Supabase (Postgres + Storage), Cloudflare R2, and custom JWT-based authentication.
> 

---

## Table of Contents

1. Project Overview
2. Tech Stack
3. Repo Structure
4. Architecture
5. Database Design
6. Key Features
7. Environment Variables
8. Getting Started
9. Build Order
10. Roadmap

---

## Project Overview

EduPrime is a **dark-first, premium LMS web platform** with three user roles:

| Role | Capabilities |
| --- | --- |
| **Admin** | Full dashboard, user management, course approval, revenue overview, payout review, site settings |
| **Instructor** | Course CRUD, section/lecture builder, quiz/assignment authoring, student roster, payout requests |
| **Student** | Browse & purchase courses, learning dashboard, video player, quizzes, assignments, certificates |

**Mobile app is out of scope** for the current phase.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js (App Router, latest stable) |
| UI | shadcn/ui + Tailwind CSS |
| ORM | Drizzle ORM |
| Database | Supabase Postgres (via Drizzle) |
| File Storage | Supabase Storage (PDFs, slides, certificates, payment proofs) |
| Image Uploads | UploadThing (course thumbnails, user/instructor avatars) |
| Video Storage | Cloudflare R2 (S3-compatible, free egress) |
| Auth | Fully custom — bcrypt + backend-issued JWTs + refresh token rotation |
| Backend API | Node.js + Express (separate service) |
| State / Data Fetching | TanStack Query + Zustand / React Context |
| Forms / Validation | React Hook Form + Zod |
| Charts | Recharts |
| Package Manager | pnpm (workspaces) |
| Monorepo Tool | Turborepo |

> ⚠️ Supabase Auth is **not used**. Identity is fully owned by `services/backend`.
> 

---

## Repo Structure

```
.
├── apps/
│   └── web/                  # Next.js app (App Router)
│       ├── app/              # Routes, layouts, pages
│       ├── components/       # App-level components
│       ├── lib/
│       │   └── api-client.ts # Typed fetch wrapper → backend REST
│       └── middleware.ts     # JWT verification + role-based route protection
├── services/
│   └── backend/              # Node.js + Express API
│       ├── src/
│       │   ├── routes/       # Auth, courses, payments, admin, instructor, etc.
│       │   ├── middleware/   # JWT guard, role guards
│       │   ├── lib/          # Mailer, Supabase Storage, R2 helpers
│       │   └── scripts/      # seed-admin, E2E test scripts
│       └── drizzle.config.ts
├── packages/
│   ├── db/                   # Drizzle schema + migrations (owned by backend)
│   │   └── drizzle/          # SQL migration files
│   ├── types/                # Shared TypeScript DTOs (web imports only types)
│   ├── ui/                   # Shared shadcn-based component library
│   └── config/               # ESLint, tsconfig, Tailwind config presets
├── turbo.json
└── pnpm-workspace.yaml
```

> `apps/web` **never** imports `packages/db` beyond types and **never** queries the database directly.
> 

---

## Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser / Client                      │
│   Next.js App (apps/web)                                     │
│   • React Server Components (default)                        │
│   • "use client" only for video player, forms, watermark    │
│   • TanStack Query for server state                          │
│   • Zustand / Context for UI state                           │
└──────────────┬──────────────────────────┬───────────────────┘
               │ REST (Bearer JWT /        │ UploadThing
               │ httpOnly cookie)          │ (image uploads)
               ▼                           ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│  services/backend        │   │  UploadThing CDN         │
│  Node.js + Express       │   │  (thumbnails / avatars)  │
│                          │   └──────────────────────────┘
│  • Custom Auth (JWT)     │
│  • Business logic        │
│  • Drizzle ORM           │
│  • Mailer (Nodemailer)   │
│  • R2 presigned URLs     │
│  • Supabase Storage      │
└──────┬───────────────────┘
       │
  ┌────┴─────────────────────────────────────────┐
  │                                              │
  ▼                                              ▼
┌─────────────────────┐              ┌─────────────────────┐
│  Supabase Postgres  │              │  Cloudflare R2      │
│  (via Drizzle ORM)  │              │  (video storage,    │
│  + Supabase Storage │              │   free egress)      │
│  (PDFs, slides,     │              │                     │
│   certificates,     │              │  Presigned PUT URL  │
│   payment proofs)   │              │  for uploads,       │
└─────────────────────┘              │  Presigned GET URL  │
                                     │  for playback       │
                                     └─────────────────────┘
```

### Authentication Architecture

```
Signup / Login
      │
      ▼
services/backend
  ├── Hash password (bcrypt/argon2)
  ├── Create users + profiles rows
  ├── Issue Access Token (JWT, ~15 min, signed with JWT_ACCESS_SECRET)
  ├── Issue Refresh Token (random, ~30 days, stored hashed in refresh_tokens)
  └── Set httpOnly cookie (refresh token)

Session Refresh
  └── POST /auth/refresh → reads httpOnly cookie → rotates refresh token → returns new access token

Route Protection (Next.js middleware)
  └── Reads access-token cookie → verifies JWT locally → checks `role` claim → allows/redirects

Backend Guard
  └── Re-verifies JWT on every REST call independently

Google OAuth
  └── apps/web → Google consent → backend /auth/google/callback
      → exchanges code → find-or-create users/profiles → issues tokens (same as password flow)
      Supabase is NOT in this path.
```

### Video Access Control

```
Instructor Upload
  └── Browser → POST /instructor/courses/:id/lectures/:id/video-presign
      → backend issues R2 presigned PUT URL (short expiry)
      → browser uploads MP4 directly to R2
      → browser saves R2 object key via PATCH /instructor/.../lectures/:id

Student Playback
  └── Player → GET /lectures/:id/video-url
      → backend verifies JWT + active enrollment
      → resolves video_provider + video_ref → issues R2 presigned GET URL
      → player loads signed URL (never a raw R2 URL)

Free Preview
  └── Same endpoint, skips enrollment check for is_preview=true published lectures
```

### Design System

| Token | Value |
| --- | --- |
| Background (ink navy) | `#12151C` |
| Surface / card | `#1B1F29` |
| Text primary | `#F2EFE7` |
| Text muted | `#8B8D98` |
| Signature accent (brass gold) | `#C9A15A` |
| Secondary accent (muted teal) | `#3F7A6B` |
- **Display**: Fraunces (serif, headlines only)
- **Body**: Inter / General Sans
- **Mono / stats**: IBM Plex Mono
- **Motif**: Thin gold "progress thread" — slim horizontal/vertical accent line in nav, hero, dividers

---

## Database Design

All tables live in Supabase Postgres, managed by Drizzle ORM in `packages/db`. Migrations run from `services/backend` only.

### Entity Relationship Overview

```
users ──────────────────────────── profiles
  │                                   │
  ├── refresh_tokens                  │
  ├── password_reset_tokens           │
  ├── email_verification_tokens       │
  │                                   │
  ├── orders ──────────── enrollments │
  │      │                    │       │
  │      └── (course_id) ─────┤       │
  │                           │       │
  └── quiz_attempts           │       │
                              │       │
courses ──── sections ─── lectures ──┘
  │              │            │
  │              ├── quizzes  ├── quizzes
  │              │    └── quiz_questions
  │              │         └── quiz_options
  │              │
  │              └── assignments
  │                   └── assignment_submissions
  │
  └── progress (per user per lecture)
  └── certificates
  └── payout_requests (instructor)
```

### Table Schemas

#### 👤 Auth & Identity

```sql
users
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
  email             TEXT UNIQUE NOT NULL
  password_hash     TEXT
  email_verified_at TIMESTAMPTZ
  google_id         TEXT UNIQUE
  auth_provider     TEXT  -- 'password' | 'google'
  suspended_at      TIMESTAMPTZ
  created_at        TIMESTAMPTZ DEFAULT now()
  updated_at        TIMESTAMPTZ DEFAULT now()

profiles
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id    UUID REFERENCES users(id)
  full_name  TEXT
  avatar_url TEXT
  role       TEXT  -- 'admin' | 'instructor' | 'student'
  created_at TIMESTAMPTZ DEFAULT now()
  updated_at TIMESTAMPTZ DEFAULT now()

refresh_tokens
  id         UUID PRIMARY KEY
  user_id    UUID REFERENCES users(id)
  token_hash TEXT NOT NULL
  expires_at TIMESTAMPTZ NOT NULL
  revoked_at TIMESTAMPTZ
  created_at TIMESTAMPTZ DEFAULT now()

password_reset_tokens
  id         UUID PRIMARY KEY
  user_id    UUID REFERENCES users(id)
  token_hash TEXT NOT NULL
  expires_at TIMESTAMPTZ NOT NULL
  used_at    TIMESTAMPTZ
  created_at TIMESTAMPTZ DEFAULT now()

email_verification_tokens
  id         UUID PRIMARY KEY
  user_id    UUID REFERENCES users(id)
  token_hash TEXT NOT NULL
  expires_at TIMESTAMPTZ NOT NULL
  used_at    TIMESTAMPTZ
  created_at TIMESTAMPTZ DEFAULT now()
```

#### 📚 Course Content

```sql
courses
  id            UUID PRIMARY KEY
  instructor_id UUID REFERENCES users(id)
  title         TEXT NOT NULL
  slug          TEXT UNIQUE NOT NULL
  description   TEXT
  thumbnail_url TEXT
  category      TEXT
  level         TEXT  -- 'beginner' | 'intermediate' | 'advanced'
  price         NUMERIC(10,2) DEFAULT 0
  status        TEXT  -- 'draft' | 'pending_review' | 'published' | 'archived'
  created_at    TIMESTAMPTZ DEFAULT now()
  updated_at    TIMESTAMPTZ DEFAULT now()

sections
  id         UUID PRIMARY KEY
  course_id  UUID REFERENCES courses(id)
  title      TEXT NOT NULL
  position   INTEGER NOT NULL
  created_at TIMESTAMPTZ DEFAULT now()
  updated_at TIMESTAMPTZ DEFAULT now()

lectures
  id               UUID PRIMARY KEY
  section_id       UUID REFERENCES sections(id)
  title            TEXT NOT NULL
  position         INTEGER NOT NULL
  description      TEXT
  duration_seconds INTEGER
  is_preview       BOOLEAN DEFAULT false
  is_published     BOOLEAN DEFAULT false
  available_at     TIMESTAMPTZ
  video_provider   TEXT DEFAULT 'r2'  -- 'r2' | 'bunny' | 'cloudflare_stream' | 'mux'
  video_ref        TEXT               -- R2 object key (or provider video ID)
  pdf_url          TEXT
  slides_url       TEXT
  created_at       TIMESTAMPTZ DEFAULT now()
  updated_at       TIMESTAMPTZ DEFAULT now()
```

#### 💳 Orders & Enrollments

```sql
orders
  id                UUID PRIMARY KEY
  user_id           UUID REFERENCES users(id)
  course_id         UUID REFERENCES courses(id)
  amount            NUMERIC(10,2) NOT NULL
  currency          TEXT DEFAULT 'BDT'
  reference_code    TEXT UNIQUE NOT NULL
  status            TEXT  -- 'pending_verification' | 'paid' | 'rejected' | 'expired' | 'refunded'
  payment_method    TEXT  -- 'bkash' | 'nagad' | 'rocket' | 'bank_transfer' | 'gateway'
  transaction_id    TEXT
  sender_number     TEXT
  proof_screenshot_url TEXT
  coupon_code       TEXT
  discount_amount   NUMERIC(10,2) DEFAULT 0
  reviewed_by       UUID REFERENCES users(id)
  reviewed_at       TIMESTAMPTZ
  rejection_reason  TEXT
  created_at        TIMESTAMPTZ DEFAULT now()
  updated_at        TIMESTAMPTZ DEFAULT now()

enrollments
  id          UUID PRIMARY KEY
  user_id     UUID REFERENCES users(id)
  course_id   UUID REFERENCES courses(id)
  order_id    UUID REFERENCES orders(id)
  status      TEXT DEFAULT 'active'  -- 'active' | 'revoked'
  enrolled_at TIMESTAMPTZ DEFAULT now()
```

#### 📈 Progress & Certificates

```sql
progress
  id               UUID PRIMARY KEY
  user_id          UUID REFERENCES users(id)
  lecture_id       UUID REFERENCES lectures(id)
  position_seconds INTEGER DEFAULT 0
  is_completed     BOOLEAN DEFAULT false
  completed_at     TIMESTAMPTZ
  last_watched_at  TIMESTAMPTZ
  created_at       TIMESTAMPTZ DEFAULT now()
  updated_at       TIMESTAMPTZ DEFAULT now()
  UNIQUE(user_id, lecture_id)

certificates
  id                UUID PRIMARY KEY
  user_id           UUID REFERENCES users(id)
  course_id         UUID REFERENCES courses(id)
  pdf_url           TEXT NOT NULL
  verification_code TEXT UNIQUE NOT NULL
  issued_at         TIMESTAMPTZ DEFAULT now()
```

#### 🧠 Quizzes

```sql
quizzes
  id           UUID PRIMARY KEY
  course_id    UUID REFERENCES courses(id)
  section_id   UUID REFERENCES sections(id) NULLABLE
  lecture_id   UUID REFERENCES lectures(id) NULLABLE
  title        TEXT NOT NULL
  is_published BOOLEAN DEFAULT false
  created_at   TIMESTAMPTZ DEFAULT now()
  updated_at   TIMESTAMPTZ DEFAULT now()

quiz_questions
  id           UUID PRIMARY KEY
  quiz_id      UUID REFERENCES quizzes(id)
  question     TEXT NOT NULL
  is_multi     BOOLEAN DEFAULT false
  position     INTEGER NOT NULL

quiz_options
  id          UUID PRIMARY KEY
  question_id UUID REFERENCES quiz_questions(id)
  text        TEXT NOT NULL
  is_correct  BOOLEAN DEFAULT false
  position    INTEGER NOT NULL

quiz_attempts
  id             UUID PRIMARY KEY
  quiz_id        UUID REFERENCES quizzes(id)
  user_id        UUID REFERENCES users(id)
  answers        JSONB NOT NULL
  score          INTEGER NOT NULL
  total          INTEGER NOT NULL
  completed_at   TIMESTAMPTZ DEFAULT now()
```

#### 📝 Assignments

```sql
assignments
  id           UUID PRIMARY KEY
  course_id    UUID REFERENCES courses(id)
  section_id   UUID REFERENCES sections(id) NULLABLE
  lecture_id   UUID REFERENCES lectures(id) NULLABLE
  title        TEXT NOT NULL
  description  TEXT
  max_score    INTEGER DEFAULT 100
  due_at       TIMESTAMPTZ
  is_published BOOLEAN DEFAULT false
  created_at   TIMESTAMPTZ DEFAULT now()
  updated_at   TIMESTAMPTZ DEFAULT now()

assignment_submissions
  id            UUID PRIMARY KEY
  assignment_id UUID REFERENCES assignments(id)
  user_id       UUID REFERENCES users(id)
  content       TEXT NOT NULL
  grade         INTEGER
  feedback      TEXT
  graded_by     UUID REFERENCES users(id)
  graded_at     TIMESTAMPTZ
  submitted_at  TIMESTAMPTZ DEFAULT now()
  updated_at    TIMESTAMPTZ DEFAULT now()
  UNIQUE(assignment_id, user_id)
```

#### 💰 Payouts

```sql
payout_requests
  id            UUID PRIMARY KEY
  instructor_id UUID REFERENCES users(id)
  amount        NUMERIC(10,2) NOT NULL
  status        TEXT  -- 'pending' | 'approved' | 'paid' | 'rejected'
  reviewed_by   UUID REFERENCES users(id)
  reviewed_at   TIMESTAMPTZ
  paid_at       TIMESTAMPTZ
  notes         TEXT
  created_at    TIMESTAMPTZ DEFAULT now()
  updated_at    TIMESTAMPTZ DEFAULT now()
```

---

## Key Features

- 🔐 **Custom Auth** — email/password + Google OAuth, bcrypt hashing, JWT access + refresh token rotation, email verification, password reset
- 🎬 **Video Player** — custom controls, resume from last position, auto-save progress every 15s
- 🌊 **Dynamic Watermark** — logged-in user's email overlaid at low opacity, repositions every 8–12s
- 💳 **Manual Payment** — bKash/Nagad/Rocket/bank transfer, admin approval queue, coupon codes
- 🧪 **Quizzes** — MCQ builder (instructor), auto-graded submission (student)
- 📝 **Assignments** — text submissions, manual grading with score + feedback
- 🏆 **Certificates** — server-side PDF generation on 100% course completion
- 🎛️ **Admin Dashboard** — user management, course approval, revenue charts (Recharts), payout review
- 📊 **Instructor Dashboard** — analytics, per-course student roster, payout requests

---

## Environment Variables

```
# Database (Postgres via Supabase — backend only)
DATABASE_URL=

# Supabase Storage (non-video files)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_COURSE_THUMBNAILS_BUCKET=course-thumbnails
SUPABASE_STORAGE_PROFILE_AVATARS_BUCKET=profile-avatars
SUPABASE_STORAGE_PAYMENT_PROOFS_BUCKET=payment-proofs
SUPABASE_STORAGE_CERTIFICATES_BUCKET=certificates
SUPABASE_STORAGE_LECTURE_MATERIALS_BUCKET=lecture-materials

# Cloudflare R2 (video)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=

# Custom Auth (backend only)
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=

# Email (Nodemailer + Gmail SMTP)
GMAIL_SMTP_USER=
GMAIL_SMTP_APP_PASSWORD=

# Admin seed
SEED_ADMIN_EMAIL=
SEED_ADMIN_PASSWORD=
SEED_ADMIN_NAME=

# Manual payment
MANUAL_PAYMENT_BKASH_NUMBER=
MANUAL_PAYMENT_NAGAD_NUMBER=
MANUAL_PAYMENT_ROCKET_NUMBER=
MANUAL_PAYMENT_BANK_DETAILS=
MANUAL_PAYMENT_COUPONS=  # format: CODE:percent:10,CODE2:amount:500

# UploadThing
UPLOADTHING_TOKEN=

# Web app
NEXT_PUBLIC_BACKEND_API_URL=
```

---

## Getting Started

```bash
# 1. Clone the repo
git clone <repo-url>
cd <repo-name>

# 2. Install dependencies
pnpm install

# 3. Copy env files
cp services/backend/.env.example services/backend/.env
cp apps/web/.env.example apps/web/.env.local
# Fill in all required values

# 4. Run database migrations
pnpm --filter @workspace/backend db:migrate

# 5. Seed the admin user
pnpm --filter @workspace/backend seed:admin

# 6. Start all services in dev mode
pnpm dev
```

- **Web app**: http://localhost:3000
- **Backend API**: http://localhost:4000

---

## Build Order

1. ✅ Monorepo scaffold (Turborepo, pnpm workspaces)
2. ✅ Drizzle schema + migrations
3. ✅ Custom auth (backend — password + Google OAuth + email verification + password reset)
4. ✅ Role-based dashboard routing + shared sidebar layout
5. ✅ Course CRUD (instructor side)
6. ✅ Manual payment flow
7. ✅ Video upload (R2) + custom player + watermark overlay
8. ✅ Progress tracking + resume
9. ✅ Quizzes (MCQ, auto-graded)
10. ✅ Assignments (manual grading)
11. ✅ Certificate generation (PDF)
12. ✅ Admin dashboard (user management, course approval, revenue charts)
13. ✅ Instructor dashboard (analytics, payout requests)
14. 🔜 Rate limiting on auth endpoints
15. 🔜 Automated auth flow tests
16. 🔜 Phase 2 features (AI tutor, discussion forums, gamification, live classes)

---

## Roadmap (Phase 2)

- 🤖 AI tutor chatbot (per-course context, Claude/OpenAI proxy)
- 🧠 Auto-generated quizzes from lecture transcripts
- 💬 Discussion forum per lecture (threaded, upvotes)
- 🎮 Gamification: XP, badges, streaks, leaderboard
- 🔒 Proctored exam mode
- 📅 Live class integration (Zoom/Google Meet embed)
- 🤝 Affiliate/referral program
- 💳 Automated payment gateway (Stripe / SSLCommerz / bKash Merchant API)
- 📦 SCORM/xAPI import
- 📱 Mobile app (deferred)

---

## License

Private — all rights reserved.