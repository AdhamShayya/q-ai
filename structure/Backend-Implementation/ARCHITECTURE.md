# Architecture Overview

## MVC Pattern in a tRPC Context

Traditional MVC maps neatly to tRPC + Express. Here is exactly how:

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT REQUEST                        │
│           (HTTP POST → /trpc/auth.login)                     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Express Middleware  │
                    │  cors, json, /health  │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   tRPC Middleware     │
                    │  createContext()      │  ← extracts JWT, builds ctx
                    └──────────┬──────────┘
                               │
          ┌────────────────────▼──────────────────────┐
          │  R O U T E R   (View/Route Layer)           │
          │  src/routers/auth.router.ts                  │
          │  • Validates input with Zod                  │
          │  • Calls the controller                      │
          │  • Returns typed response                    │
          └────────────────────┬──────────────────────┘
                               │ calls
          ┌────────────────────▼──────────────────────┐
          │  C O N T R O L L E R  (Business Logic)      │
          │  src/controllers/auth.controller.ts          │
          │  • Orchestrates logic                        │
          │  • Reads/writes via db                       │
          │  • Throws TRPCError on failures              │
          │  • Returns typed result                      │
          └────────────────────┬──────────────────────┘
                               │ queries
          ┌────────────────────▼──────────────────────┐
          │  M O D E L  (Data Layer)                    │
          │  src/db/schema.ts     ← Drizzle tables       │
          │  src/models/*.ts      ← Pure TS types         │
          │  src/db/index.ts      ← DB client             │
          └──────────────────────────────────────────┘
```

---

## Type Safety Flow

The system is designed so types **flow automatically** from one layer to another — no manual casting, no `any`.

```
Drizzle Schema
  └─► typeof users.$inferSelect      → User  (full row with password)
  └─► typeof users.$inferInsert      → NewUser
        │
        ▼
  UserPublic (password removed)      → models/user.model.ts
        │
        ▼
  Controller return type             → Promise<UserPublic>
        │
        ▼
  tRPC router inferring output type  → auto-inferred from controller
        │
        ▼
  AppRouter type exported            → routers/index.ts
        │
        ▼
  Frontend tRPC client               → import type { AppRouter } from "..."
```

No type is written twice. Change the DB schema → TypeScript catches every affected place at compile time.

---

## tRPC Procedure Hierarchy

```
publicProcedure          — anyone can call
    └─► protectedProcedure   — requires valid JWT (ctx.user is non-null)
            └─► adminProcedure   — requires role === "admin"
```

Middleware is **composable and typesafe** — if you access `ctx.user` inside a `protectedProcedure`, TypeScript knows it is `TokenPayload`, never `null`.

---

## Request Lifecycle

```
1. Request hits Express
2. CORS + JSON middleware run
3. tRPC adapter invokes createContext()
   → parse Authorization header
   → verify JWT with verifyToken()
   → populate ctx.user or ctx.user = null
4. tRPC router matches the procedure
5. Middleware chain runs (public / protected / admin check)
6. Zod validates .input() — throws TRPC BAD_REQUEST if invalid
7. Controller is called with typed input + ctx
8. Controller interacts with Drizzle/Postgres
9. Typed result serialised back as JSON
```

---

## Directory Responsibilities

| Directory          | Layer        | Responsibility                                              |
|--------------------|--------------|-------------------------------------------------------------|
| `src/config/`      | Infrastructure | Zod-validated env, loaded once at startup                 |
| `src/db/`          | Model        | Drizzle schema, Postgres pool, DB client                    |
| `src/models/`      | Model        | Pure TypeScript domain types (no DB or HTTP dependencies) |
| `src/utils/`       | Infrastructure | JWT sign/verify, bcrypt hash/compare                      |
| `src/controllers/` | Controller   | Pure business logic functions, return typed domain objects  |
| `src/routers/`     | Router/View  | tRPC procedures: validate input, call controller, return    |
| `src/context.ts`   | Infrastructure | Per-request context factory                               |
| `src/trpc.ts`      | Infrastructure | tRPC instance + reusable procedure builders               |
| `src/index.ts`     | Infrastructure | Express server bootstrap                                  |
