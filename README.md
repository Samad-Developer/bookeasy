# BookEasy

A full-stack venue booking platform. Customers find a venue and book a time slot, owners manage their venues and bookings, and admins oversee the platform. Prices are in PKR.

**Live demo:** _coming soon_  
**API docs / Postman collection:

![BookEasy home page](docs/screenshots/home.png)

---

## Why this project

Booking systems look simple, but they hide real engineering problems. BookEasy focuses on solving those properly:

- **No double bookings, even under race conditions.** Two people booking the same slot at the same moment can never both succeed. The rule is enforced inside PostgreSQL (an exclusion constraint on time ranges), not only in application code.
- **Secure authentication.** Short-lived access tokens, rotating refresh tokens in HttpOnly cookies, and role-based authorization.
- **Safe file uploads.** Venue photos are validated by their real content (not just the file extension), resized, stripped of GPS metadata, and stored in S3-compatible storage.
- **A maintainable backend.** A layered Controller / Service / Repository architecture with schema validation and centralized error handling.

---

## Features

### Customers
- Sign up, log in, log out
- Browse venues with cover photos and prices
- View a venue's photo gallery and details
- Book an available time slot
- View and cancel your own bookings

### Venue owners
- Create, edit and hide venues
- Upload up to 8 photos per venue, choose the cover photo, and reorder photos
- Manage bookings for their own venues
- Cannot touch other owners' venues (ownership is checked on the server)

### Admins
- Platform-wide oversight
- Admin accounts are created from the command line, never through public sign-up

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), React, TypeScript |
| Backend | Node.js, Express, TypeScript |
| Validation | Zod |
| Database | PostgreSQL (`pg`, SQL migrations) |
| Auth | JWT access tokens + rotating refresh tokens (HttpOnly cookie) |
| Images | multer, sharp |
| File storage | S3-compatible storage (Supabase Storage) via `@aws-sdk/client-s3` |
| Package manager | pnpm |

---

## Architecture

```
Browser (Next.js)
      │  HTTPS / JSON
      ▼
Express API
  routes → controller → service → repository → PostgreSQL
                │
                └── storage module → S3-compatible bucket (venue photos)
```

Each layer has one job:

| Layer | Responsibility |
|---|---|
| **Routes** | Map URLs to controllers and attach middleware (auth, validation) |
| **Controller** | Read the request, call a service, send the response |
| **Service** | Business rules (who may do what, limits, transactions) |
| **Repository** | The only place that writes SQL |

### Key design decisions

1. **Double-booking prevention in the database.** An exclusion constraint (using the `btree_gist` extension) rejects overlapping time ranges for the same venue. Even if two requests arrive together, PostgreSQL lets only one through.
2. **Refresh token rotation.** Every refresh issues a new token and invalidates the old one, so a stolen token has a short useful life.
3. **Photo limits enforced with a row lock.** When uploading, the venue row is locked inside a transaction, so parallel uploads cannot exceed 8 photos.
4. **Thumbnails.** Each photo is stored as a full-size copy (1600px) and a thumbnail (640px), so list pages stay fast.
5. **Cleanup on failure.** If a database write fails after files were uploaded, the uploaded files are deleted again so no orphan files are left behind.
6. **Graceful storage failure.** If storage is not configured or is down, the API still runs and returns a clear `503` for upload requests only.

---

## Project structure

```
bookeasy/
├── backend/
│   ├── migrations/          # SQL migrations
│   ├── scripts/             # CLI scripts (e.g. create-admin)
│   └── src/
│       ├── config/          # Environment validation
│       ├── modules/         # auth, venues, venue-images, bookings, ...
│       │   └── <module>/    # routes, controller, service, repository, schema, types
│       ├── shared/          # errors, middleware, storage, utilities
│       ├── app.ts
│       └── server.ts
├── frontend/
│   └── src/
│       ├── app/             # Next.js routes
│       ├── components/      # Shared components
│       ├── features/        # Feature folders (venues, owner, auth, ...)
│       └── lib/             # API client and helpers
└── README.md
```

> The tree shows the main idea. Exact folder names may differ slightly.

---

## Getting started (local development)

### Prerequisites

- Node.js 20 or newer
- pnpm (`npm install -g pnpm`)
- PostgreSQL 14 or newer
- _(Optional)_ An S3-compatible bucket for photo uploads. Everything else works without it.

### 1. Clone the repository

```bash
git clone https://github.com/Samad-Developer/bookeasy.git
cd bookeasy
```

### 2. Set up the database

Create an empty database:

```bash
createdb bookeasy
```

### 3. Run the backend

```bash
cd backend
pnpm install
cp .env.example .env      # then fill in the values (see below)
pnpm migrate up           # create the tables
pnpm dev                  # start the API with auto-reload
```

### 4. Run the frontend

In a second terminal:

```bash
cd frontend
pnpm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL
pnpm dev
```

Open the URL printed in the terminal.

### 5. Create an admin (optional)

Sign up normally first, then promote that account:

```bash
cd backend
pnpm create-admin you@example.com
```

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Port the API listens on |
| `NODE_ENV` | No | `development` or `production` |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `DB_SSL` | No | `true` for hosted databases that require SSL |
| `DB_SSL_REJECT_UNAUTHORIZED` | No | `true` to verify the database certificate |
| `JWT_ACCESS_SECRET` | Yes | Long random string used to sign access tokens |
| `FRONTEND_ORIGIN` | Yes | Frontend URL allowed by CORS |
| `TRUST_PROXY_HOPS` | No | Number of proxies in front of the API (for correct client IPs) |
| `STORAGE_ENDPOINT` | No* | S3-compatible endpoint URL |
| `STORAGE_REGION` | No* | Storage region |
| `STORAGE_ACCESS_KEY_ID` | No* | Storage access key ID |
| `STORAGE_SECRET_ACCESS_KEY` | No* | Storage secret key |
| `STORAGE_BUCKET` | No* | Bucket name (must be public for photo URLs to load) |
| `STORAGE_PUBLIC_URL` | No* | Public base URL of the bucket |

\* Needed only for photo uploads. If missing, the API still starts and upload requests return `503 STORAGE_NOT_CONFIGURED`.

Generate a strong secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API |

> Never commit `.env` files. Only the `.env.example` files belong in git.

---

## Scripts

### Backend

| Command | What it does |
|---|---|
| `pnpm dev` | Run the API in development with auto-reload |
| `pnpm build` | Compile TypeScript into `dist/` |
| `pnpm start` | Run the compiled app (`dist/server.js`). Run `pnpm build` first |
| `pnpm migrate create <name>` | Create a new migration |
| `pnpm migrate up` | Apply pending migrations |
| `pnpm create-admin <email>` | Promote an existing account to admin |

### Frontend

| Command | What it does |
|---|---|
| `pnpm dev` | Start the development server |
| `pnpm build` | Create a production build |
| `pnpm start` | Run the production build |

---

## API overview

| Area | Examples |
|---|---|
| Auth | sign up, log in, refresh token, log out |
| Venues | `GET /venues`, `GET /venues/:id`, `GET /venues/mine`, create / update / hide |
| Venue photos | `POST /venues/:id/images`, `PATCH /venues/:id/images/order`, `DELETE /venues/:id/images/:imageId` |
| Bookings | create, list, cancel |
| Health | `GET /health` (also checks the database connection) |

Errors always use one consistent shape, for example:

```json
{
  "success": false,
  "error": { "code": "VALIDATION_ERROR", "message": "..." }
}
```

---

## Security notes

- Passwords are hashed, never stored in plain text.
- Refresh tokens are stored as hashes and rotated on use.
- All input is validated with Zod before reaching business logic.
- Ownership checks run on the server, so owners cannot edit other owners' venues.
- Uploads are checked by real file content, size-limited, and re-encoded, which strips metadata such as GPS location.
- Rate limiting protects the API from abuse.
- Admin accounts cannot be created through the public API.

---

## Deployment

The app is designed to run with:

- **Database:** a hosted PostgreSQL (for example Neon)
- **File storage:** an S3-compatible bucket (for example Supabase Storage)
- **API:** any Node host that runs `pnpm build` then `pnpm start`
- **Frontend:** any host that supports Next.js

Production checklist:

1. Set every backend environment variable on the host (never in git).
2. Use a new `JWT_ACCESS_SECRET` for production.
3. Set `DB_SSL=true` for hosted databases.
4. Run `pnpm migrate up` against the production database.
5. Set `FRONTEND_ORIGIN` to the real frontend URL.
6. Check `GET /health` returns `"db": "up"`.

---
