# Setup Guide

## Prerequisites

| Tool        | Version  | Notes                          |
|-------------|----------|--------------------------------|
| Node.js     | ≥ 20     | `node --version`               |
| npm         | ≥ 10     | comes with Node                |
| PostgreSQL  | ≥ 15     | running locally or remote      |

---

## 1. Install Dependencies

```bash
cd backend
npm install
```

---

## 2. Configure Environment

```bash
cp .env.example .env
```

Open `.env` and fill in:

```env
# Required
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/q_ai_db
JWT_SECRET=a-random-string-of-at-least-32-characters

# Optional (defaults shown)
PORT=4000
NODE_ENV=development
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

### Create the Postgres database

```sql
CREATE DATABASE q_ai_db;
```

---

## 3. Run Database Migrations

```bash
# Generate SQL from your Drizzle schema (only needed when schema changes)
npm run db:generate

# Apply migrations to the database
npm run db:migrate
```

This creates the `users` and `sessions` tables automatically.

---

## 4. Start Development Server

```bash
npm run dev
```

Expected output:

```
✅  PostgreSQL connected
🚀  Server running on http://localhost:4000
📡  tRPC endpoint: http://localhost:4000/trpc
❤️   Health check: http://localhost:4000/health
```

---

## 5. Verify It Works

```bash
# Health check
curl http://localhost:4000/health

# Register a user
curl -X POST http://localhost:4000/trpc/auth.register \
  -H "Content-Type: application/json" \
  -d '{"json":{"email":"test@example.com","name":"Test User","password":"Password1"}}'

# Login
curl -X POST http://localhost:4000/trpc/auth.login \
  -H "Content-Type: application/json" \
  -d '{"json":{"email":"test@example.com","password":"Password1"}}'
```

---

## 6. Production Build

```bash
npm run build       # compiles TypeScript to dist/
npm run start       # runs the compiled server
```

---

## Visual Database Browser

```bash
npm run db:studio
```

Opens Drizzle Studio at `https://local.drizzle.studio` — a visual interface for your Postgres tables.

---

## Common Issues

| Error | Solution |
|-------|----------|
| `DATABASE_URL is required` | Make sure `.env` exists and is filled |
| `JWT_SECRET must be at least 32 characters` | Use a longer secret |
| `ECONNREFUSED` on DB connect | Is Postgres running? Check host/port |
| `relation "users" does not exist` | Run `npm run db:migrate` |
