# PharmaPRS

REST API powering PharmaPRS, a CRM built for independent pharmacies and pharmacy chains — manage patients, pharmacists, custom intake forms, and multi-branch operations from one dashboard.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat&logo=vitest&logoColor=white)

## Tech Stack

- **Runtime:** Node.js + Express v4 + TypeScript 5.5
- **Database:** MongoDB via Mongoose v8
- **Auth:** JWT (access + refresh tokens) + bcrypt
- **Email:** Resend with React Email templates
- **File Storage:** Cloudinary (multer for upload handling)
- **Logging:** Winston + Logtail
- **Validation:** Joi
- **Security:** helmet, cors, express-rate-limit, compression
- **Tests:** Vitest v2

## Features

**Authentication**
- Register, log in, verify email, resend verification, and reset a forgotten password — each with rate limiting on the abuse-prone endpoints (login, register, resend, forgot-password)
- Short-lived access tokens (1h) + rotating refresh tokens (3d), revocable on logout

**User & Company Profile**
- Manage account details, company name/branding, primary color, and logo upload

**Patient Management**
- Create, list (with search/filter), update, and delete patient records, scoped per account
- Hybrid schema: a few fixed core fields (name, age, phone) plus `customFields`, driven by each pharmacy's own form config, so intake data isn't locked to one fixed shape
- Each patient stores a `formSnapshot` of the form as it looked at creation time, so edits to the form later don't retroactively change what a past intake looked like

**Custom Intake Form Builder (backend side)**
- Per-account `Setting.formConfig.schema` stores the pharmacy's custom patient form definition; a default starter schema is seeded on account creation

**Pharmacist Management**
- Add, edit, remove pharmacists, assignable to a branch

**Multi-Branch Support**
- Users and pharmacists carry a `branches` list so a pharmacy chain can manage multiple locations from one account

**Onboarding**
- `GET /api/settings` returns a computed onboarding checklist (profile complete, first pharmacist added, form built, first patient added) alongside settings

**File Storage**
- Upload patient-related files (images, audio, PDF, Word docs) to Cloudinary, scoped per patient; max size configurable via `MAX_FILE_SIZE` (default 50MB)

**Security & Reliability**
- helmet, compression, per-route rate limiting, centralized error handling with typed error classes, structured logging via Winston + Logtail

## Architecture

Layered architecture with a service factory to keep everything loosely coupled:

```
models → repositories → services → controllers → routes
```

- `models/` — Mongoose schemas (User, Patient, Pharmacist, Setting, File, RefreshToken, VerificationToken)
- `repositories/` — Thin DB layer (BaseRepository + domain repos)
- `services/` — Business logic (auth, user, patient, pharmacist, setting, file, email, onboarding)
- `controllers/` — Thin Express handlers, no business logic
- `routes/` — Route definitions, wire up validation + auth middleware per route
- `middleware/` — JWT auth, Joi validation, multer, rate limiting, centralized error handling
- `factories/ServiceFactory` — Wires repos → services (manual DI, no framework)

**Conventions worth knowing before contributing:**
- Every response goes through one shape: `{ success, message, data }` on success, `{ success: false, message, error: { code } }` on failure — enforced by `responseHandler` + `asyncHandler`, so controllers just return data or throw.
- Errors are typed classes (`ValidationError`, `UnauthorizedError`, `EmailNotVerifiedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `SystemError`) in `errors/CustomErrors.ts`, each carrying its own HTTP status + error code. Throw them anywhere; the `errorHandler` middleware is the only place that touches `res.status()`.
- Auth is JWT-only, no sessions: `Authorization: Bearer <token>`, verified in `middleware/auth.ts`, payload is `{ id, role }`.

## API Routes

| Route | Description |
|-------|-------------|
| `GET /api/health` | Health check |
| `POST /api/auth/register` | Register a new account (sends verification email) |
| `POST /api/auth/login` | Log in (requires verified email) |
| `POST /api/auth/refresh` | Exchange a refresh token for a new token pair |
| `POST /api/auth/logout` | Revoke a refresh token *(requires auth)* |
| `POST /api/auth/verify-email` | Verify email via token |
| `POST /api/auth/resend-verification` | Resend the verification email |
| `POST /api/auth/forgot-password` | Request a password reset email |
| `POST /api/auth/reset-password` | Reset password via token |
| `GET /api/users/profile` | Get the logged-in user's profile *(requires auth)* |
| `PUT /api/users/profile` | Update profile *(requires auth)* |
| `POST /api/users/logo` | Upload company logo *(requires auth)* |
| `GET /api/patients` | List patients (search/filter via query) *(requires auth)* |
| `POST /api/patients` | Create a patient *(requires auth)* |
| `GET/PUT/DELETE /api/patients/:id` | Get, update, delete a patient *(requires auth)* |
| `GET /api/pharmacists` | List pharmacists *(requires auth)* |
| `POST /api/pharmacists` | Create a pharmacist *(requires auth)* |
| `GET/PUT/DELETE /api/pharmacists/:id` | Get, update, delete a pharmacist *(requires auth)* |
| `GET /api/settings` | Get settings + onboarding checklist *(requires auth)* |
| `POST /api/settings` | Create settings (seeds default form) *(requires auth)* |
| `PATCH /api/settings` | Update settings/form config *(requires auth)* |
| `POST /api/files/upload/:id` | Upload a file to a patient record *(requires auth)* |
| `GET /api/files/patient/:id` | List a patient's files *(requires auth)* |
| `DELETE /api/files/:publicId` | Delete a file *(requires auth)* |

## What I Learned

- I originally brought in BullMQ, Redis, and Bull Board to handle background jobs for the mobile client — so DB reads/writes happening behind the scenes wouldn't block the mobile experience. I pulled all of it back out a few commits later: the actual load didn't justify a queue (we're nowhere near the active-user count where it would matter), and the cost of hosting and maintaining a Redis instance outweighed the benefit at this stage. Good reminder to add infra when there's an actual bottleneck, not because it's what "real" apps are supposed to have. The full setup is preserved on the `feat-setup-bullmq-and-redis` branch, ready to bring back in when the load actually calls for it.
- Centralizing errors into typed classes that each carry their own HTTP status and code made the whole error-handling story simpler than I expected — every controller just throws, and `errorHandler` is the only place that ever calls `res.status()`. Consistent response shape for free.
- Reworking the Patient model to be part-fixed, part-form-driven (`customFields` + `formSnapshot`) instead of one rigid schema took a few iterations to get right. This is the one that really opened my eyes to slowing down and actually thinking through the architecture of what I'm building before writing code, instead of bolting structure on after the fact.

## Getting Started

### Prerequisites
- Node.js
- A MongoDB instance (local or hosted)
- Accounts/API keys for Cloudinary, Resend, and Logtail (see below)

### Installation

```bash
git clone https://github.com/Richydos2305/pharma-crm-backend.git
cd pharma-crm-backend
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Required
MONGODB_URI=mongodb://localhost:27017/patient-records
JWT_ACCESS_SECRET=your-access-secret-here       # signs access tokens (1h)
JWT_REFRESH_SECRET=your-refresh-secret-here     # signs refresh tokens (3d)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
LOGTAIL_SOURCE_TOKEN=your-logtail-token
RESEND_API_KEY=your-resend-key
APP_URL=http://localhost:5173                  # used in email links (e.g. verify/reset)
EMAIL_FROM=noreply@yourdomain.com

# Optional (defaults shown)
PORT=3000
NODE_ENV=development
MAX_FILE_SIZE=52428800                          # 50MB, in bytes
```

### Run locally

```bash
npm run dev
```

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with nodemon |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled build |
| `npm test` | Run the test suite (Vitest) |
| `npm run test:coverage` | Run tests with coverage |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |
| `npm run validate` | Format check + lint + build |

## Related Repositories

- [pharma-crm-frontend](https://github.com/Richydos2305/pharma-crm-frontend) — the dashboard this API serves
- [pharma-prs-mobile](https://github.com/Richydos2305/pharma-prs-mobile) — mobile client
