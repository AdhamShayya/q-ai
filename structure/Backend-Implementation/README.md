# Q-Ai Backend

> **Stack:** Node.js · Express · tRPC v11 · TypeScript (strict, zero `any`) · PostgreSQL · Drizzle ORM · Zod

---

## Quick Start

```bash
cd backend
cp .env.example .env        # fill in your values
npm install
npm run db:generate          # generate SQL migrations from schema
npm run db:migrate           # apply migrations to your Postgres DB
npm run dev                  # start dev server with hot-reload
```

---

## Folder Structure

```
backend/
├── drizzle/                 # Auto-generated SQL migration files
├── src/
│   ├── config/
│   │   └── env.ts           # Zod-validated environment variables
│   ├── db/
│   │   ├── schema.ts        # Drizzle ORM table definitions + inferred types
│   │   └── index.ts         # Postgres connection pool + Drizzle client
│   ├── models/
│   │   └── user.model.ts    # Pure TypeScript domain types (no DB coupling)
│   ├── utils/
│   │   ├── jwt.ts           # signToken / verifyToken
│   │   └── hash.ts          # hashPassword / comparePassword
│   ├── controllers/
│   │   ├── auth.controller.ts   # register, login
│   │   └── user.controller.ts   # getUserById, getAllUsers, updateProfile, deleteUser
│   ├── routers/
│   │   ├── auth.router.ts   # tRPC auth procedures (public)
│   │   ├── user.router.ts   # tRPC user procedures (protected / admin)
│   │   └── index.ts         # Root appRouter — exports AppRouter type
│   ├── context.ts           # Per-request tRPC context (extracts user from JWT)
│   ├── trpc.ts              # tRPC instance, publicProcedure, protectedProcedure, adminProcedure
│   └── index.ts             # Express server entry point
├── .env.example
├── drizzle.config.ts
├── package.json
└── tsconfig.json
```

---

## Environment Variables

| Variable        | Required | Description                                  |
|-----------------|----------|----------------------------------------------|
| `PORT`          | No       | HTTP port (default: `4000`)                  |
| `NODE_ENV`      | No       | `development` / `test` / `production`        |
| `DATABASE_URL`  | **Yes**  | PostgreSQL connection string                 |
| `JWT_SECRET`    | **Yes**  | Min 32 chars. Sign/verify tokens             |
| `JWT_EXPIRES_IN`| No       | Token TTL (default: `7d`)                    |
| `CORS_ORIGIN`   | No       | Allowed CORS origin (default: localhost:3000)|

---

## Available Scripts

| Script              | What it does                                    |
|---------------------|-------------------------------------------------|
| `npm run dev`       | Start dev server with `tsx watch`              |
| `npm run build`     | Compile TypeScript → `dist/`                   |
| `npm run start`     | Run compiled production server                 |
| `npm run db:generate`| Generate SQL migrations from Drizzle schema   |
| `npm run db:migrate` | Apply pending migrations                      |
| `npm run db:studio`  | Open Drizzle Studio (visual DB browser)        |

---

## TypeScript Strictness

`tsconfig.json` enables:

- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`
- `noUncheckedIndexedAccess: true`
- `noImplicitReturns: true`

Zero `any` — every inferred type flows from Drizzle schema → models → controllers → routers.
