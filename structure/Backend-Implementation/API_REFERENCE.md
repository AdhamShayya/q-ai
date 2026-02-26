# API Reference

All procedures are accessed via `POST /trpc/<procedure>` (mutations) or  
`GET /trpc/<procedure>?input=<json>` (queries).

The `input` is always wrapped in `{ "json": { ...yourData } }` when calling via HTTP.  
When using the tRPC client from the frontend, this wrapping is automatic.

---

## Auth Procedures

### `auth.register` — Mutation · Public

Creates a new user account.

**Input:**

```ts
{
  email: string; // valid email
  name: string; // 2–100 characters
  password: string; // min 8 chars, 1 uppercase, 1 number
}
```

**Output:**

```ts
{
  user: {
    id: string;
    email: string;
    name: string;
    role: "user" | "admin";
    createdAt: Date;
    updatedAt: Date;
  }
  token: string; // JWT — store this for authenticated requests
}
```

**Errors:**

- `CONFLICT` — email already registered
- `BAD_REQUEST` — Zod validation failed (returns `zodError` detail)

---

### `auth.login` — Mutation · Public

Verifies credentials, returns user + JWT.

**Input:**

```ts
{
  email: string;
  password: string;
}
```

**Output:** Same shape as `auth.register`

**Errors:**

- `UNAUTHORIZED` — invalid email or password

---

## User Procedures

> All user procedures require `Authorization: Bearer <token>` header.

---

### `user.me` — Query · Protected

Returns the authenticated user's own profile.

**Input:** none

**Output:**

```ts
{
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
}
```

**Errors:**

- `UNAUTHORIZED` — no or invalid token
- `NOT_FOUND` — user deleted after token issued

---

### `user.getById` — Query · Admin Only

Fetch any user by UUID.

**Input:**

```ts
{
  id: string;
} // valid UUID
```

**Output:** Same as `user.me`

**Errors:**

- `UNAUTHORIZED` / `FORBIDDEN`
- `NOT_FOUND`

---

### `user.list` — Query · Admin Only

Returns all users ordered by creation date.

**Input:** none

**Output:** `UserPublic[]`

---

### `user.updateProfile` — Mutation · Protected

Update the authenticated user's own name or email.

**Input:**

```ts
{
  name?: string    // 2–100 chars
  email?: string   // valid email
}
// At least one field required
```

**Output:** Updated `UserPublic`

**Errors:**

- `BAD_REQUEST` — nothing to update
- `CONFLICT` — email taken by another user

---

### `user.delete` — Mutation · Admin Only

Permanently deletes a user by ID.

**Input:**

```ts
{
  id: string;
}
```

**Output:**

```ts
{
  id: string;
}
```

---

## Error Codes

tRPC maps errors to both a code and an HTTP status:

| tRPC Code               | HTTP Status | When                                    |
| ----------------------- | ----------- | --------------------------------------- |
| `BAD_REQUEST`           | 400         | Zod validation failed                   |
| `UNAUTHORIZED`          | 401         | No token or invalid credentials         |
| `FORBIDDEN`             | 403         | Authenticated but not enough permission |
| `NOT_FOUND`             | 404         | Resource does not exist                 |
| `CONFLICT`              | 409         | Duplicate resource (e.g. email)         |
| `INTERNAL_SERVER_ERROR` | 500         | Unexpected server error                 |

All error responses include `data.zodError` (if applicable) with field-level messages.

---

## Using with the tRPC Client (Frontend)

```ts
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../../src/routers";

const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "http://localhost:4000/trpc",
      headers() {
        const token = localStorage.getItem("token");
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});

// Fully typed — autocomplete works end-to-end
const result = await trpc.auth.login.mutate({
  email: "test@example.com",
  password: "Password1",
});
```
