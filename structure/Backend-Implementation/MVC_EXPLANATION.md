# MVC Explanation

## How MVC Maps to This Stack

MVC (Model–View–Controller) is a pattern that separates concerns into three layers.  
In a tRPC + Express backend there is **no HTML view** — the "View" equivalent is the **Router/Procedure layer** that shapes and exposes data to the client.

---

## The Three Layers

### Model — `src/db/schema.ts` + `src/models/`

The Model layer owns:
- **Data structure**: Drizzle schema defines your Postgres tables
- **Domain types**: Pure TypeScript interfaces that represent business objects

```
src/db/schema.ts         ← Drizzle table definitions
                            Postgres knows the structure from here.
                            TypeScript infers exact row types.

src/models/user.model.ts ← Domain-level types (UserPublic, TokenPayload…)
                            These are decoupled from DB details.
                            Password is excluded from UserPublic here.
```

**Key rule:** Models have zero knowledge of tRPC, Express, or HTTP.

---

### Controller — `src/controllers/`

The Controller layer owns:
- All **business logic**
- DB reads/writes via Drizzle
- Throwing `TRPCError` on domain violations

```
src/controllers/auth.controller.ts
  register(input)   → checks duplicate email → hashes password → inserts → signs token
  login(input)      → finds user → verifies password → signs token

src/controllers/user.controller.ts
  getUserById(id)         → queries DB → returns UserPublic
  getAllUsers()           → queries DB → returns UserPublic[]
  updateProfile(id, data) → checks email uniqueness → updates → returns UserPublic
  deleteUser(id)          → deletes → returns { id }
```

**Key rule:** Controllers are **plain async functions**. They receive typed inputs and return typed outputs. They do NOT import from `src/routers/` or know about HTTP.

---

### Router (View) — `src/routers/`

The Router layer owns:
- Exposing procedures over tRPC
- **Input validation** (Zod schemas)
- Calling the controller
- Applying access control (public / protected / admin)

```
src/routers/auth.router.ts
  auth.register  → validates input → calls register() controller
  auth.login     → validates input → calls login() controller

src/routers/user.router.ts
  user.me            → protected → calls getUserById(ctx.user.id)
  user.getById       → admin     → calls getUserById(input.id)
  user.list          → admin     → calls getAllUsers()
  user.updateProfile → protected → calls updateProfile(ctx.user.id, input)
  user.delete        → admin     → calls deleteUser(input.id)

src/routers/index.ts
  Combines all routers into one appRouter → exports AppRouter type
```

**Key rule:** Routers have no business logic. They are thin connectors between the outside world and the controllers.

---

## Data Flow — Visual

```
Frontend calls trpc.auth.login.mutate({ email, password })
         │
         ▼
[ROUTER]  auth.router.ts
         • loginSchema.parse(input)  ← Zod validates
         • calls login(input)
         │
         ▼
[CONTROLLER]  auth.controller.ts  login()
         • db.select from users WHERE email = input.email
         • comparePassword(input.password, user.password)
         • signToken({ id, email, role })
         • returns { user: UserPublic, token }
         │
         ▼
[MODEL]   db/schema.ts + models/user.model.ts
         • users table definition
         • UserPublic type (no password)
         │
         ▼
[ROUTER]  serialises result → JSON response to client
         │
         ▼
Frontend receives fully-typed { user, token }
```

---

## Why This Structure Scales

1. **Adding a feature** (e.g. posts):
   - Add `src/db/schema.ts` → `posts` table
   - Add `src/models/post.model.ts` → `PostPublic` type
   - Add `src/controllers/post.controller.ts` → CRUD functions
   - Add `src/routers/post.router.ts` → expose procedures
   - Register in `src/routers/index.ts`

2. **Changing a business rule** (e.g. stricter password policy):
   - Edit the Zod schema in the **router** → one place
   - No controller or model changes needed

3. **Swapping the DB** (e.g. Neon, Supabase, PlanetScale):
   - Change only `src/db/index.ts` and `drizzle.config.ts`
   - Controllers and models are untouched
