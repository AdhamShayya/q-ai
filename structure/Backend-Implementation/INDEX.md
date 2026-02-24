# Backend Implementation — Index

| Document | What it covers |
|---|---|
| [README.md](./README.md) | Quick start, folder structure, scripts, env vars |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | MVC diagram, type-safety flow, procedure hierarchy |
| [SETUP.md](./SETUP.md) | Step-by-step installation, DB migration, troubleshooting |
| [API_REFERENCE.md](./API_REFERENCE.md) | Every tRPC procedure: input, output, error codes |
| [MVC_EXPLANATION.md](./MVC_EXPLANATION.md) | How MVC maps to tRPC + Express in this codebase |

---

## Stack at a Glance

| Layer | Technology | File(s) |
|---|---|---|
| Runtime | Node.js + Express | `src/index.ts` |
| API Protocol | tRPC v11 | `src/trpc.ts`, `src/routers/` |
| Validation | Zod | All `*.router.ts`, `src/config/env.ts` |
| Database | PostgreSQL + Drizzle ORM | `src/db/` |
| Auth | JWT + bcrypt | `src/utils/jwt.ts`, `src/utils/hash.ts` |
| TypeScript | Strict (zero `any`) | `tsconfig.json` |
