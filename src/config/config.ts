import "dotenv/config"
import { type } from "arktype"

const envSchema = type({
  DATABASE_URL: "string",
  // For Supabase: set this to the direct connection (port 5432).
  // Graphile-worker uses advisory locks which don't work through PgBouncer.
  // Falls back to DATABASE_URL if not set.
  "GRAPHILE_DB_URL?": "string",
  // Optional — if not set we derive it from DATABASE_URL (Supabase hosting only).
  // Must be the project REST URL: https://<project-id>.supabase.co
  "SUPABASE_URL?": "string",
  "SUPABASE_SERVICE_KEY?": "string",
  "CORS_ORIGIN?": "string",
  COOKIE_SECRET: "string >= 32",
  "PORT?": "string.numeric.parse",
  "NODE_ENV?": "'development' | 'test' | 'production'",
  "MATENSA_KEY?": "string",
  "MATENSA_SECRET?": "string",
  "MATENSA_API_URL?": "string",
  "BACKEND_PUBLIC_URL?": "string",
})

const _parsed = envSchema(process.env)

if (_parsed instanceof type.errors) {
  console.error("Invalid environment variables:\n")
  console.error(_parsed.summary)
  process.exit(1)
}

/**
 * Derives the Supabase project REST URL from a Supabase DATABASE_URL.
 * e.g. "postgresql://...@db.abc123.supabase.co:5432/postgres"
 *      → "https://abc123.supabase.co"
 */
function deriveSupabaseUrl(databaseUrl: string): string {
  try {
    const { hostname } = new URL(databaseUrl)
    // Supabase DB hosts follow: db.<project-id>.supabase.co
    if (hostname.startsWith("db.") && hostname.endsWith(".supabase.co")) {
      return `https://${hostname.slice(3)}`
    }
  } catch {
    // not a valid URL — ignore
  }
  return ""
}

const rawSupabaseUrl = _parsed.SUPABASE_URL ?? ""
const supabaseUrl = rawSupabaseUrl.startsWith("https://")
  ? rawSupabaseUrl
  : // Try deriving from the SUPABASE_URL postgres host first (db.<project>.supabase.co),
    // then fall back to DATABASE_URL (works when DATABASE_URL uses the direct connection,
    // not the pooler which has a different hostname).
    deriveSupabaseUrl(rawSupabaseUrl) || deriveSupabaseUrl(_parsed.DATABASE_URL)

/**
 * Converts a Supabase PgBouncer transaction-mode URL (port 6543) to
 * session-mode (port 5432). Session mode supports advisory locks, which
 * graphile-worker requires. Transaction mode (port 6543) does not.
 */
function toSessionModeUrl(url: string): string {
  return url.replace(/:6543\//, ":5432/")
}

export const env = {
  PORT: _parsed.PORT ?? 4000,
  COOKIE_SECRET: _parsed.COOKIE_SECRET,
  DATABASE_URL: _parsed.DATABASE_URL,
  // Graphile-worker needs session-mode Postgres (advisory locks).
  // If GRAPHILE_DB_URL isn't explicitly set, rewrite DATABASE_URL from
  // transaction-mode (port 6543) to session-mode (port 5432) on the same
  // pooler host — session mode keeps connections alive and supports advisory locks.
  GRAPHILE_DB_URL: _parsed.GRAPHILE_DB_URL ?? toSessionModeUrl(_parsed.DATABASE_URL),
  SUPABASE_URL: supabaseUrl,
  SUPABASE_SERVICE_KEY: _parsed.SUPABASE_SERVICE_KEY ?? "",
  NODE_ENV: _parsed.NODE_ENV ?? ("development" as const),
  CORS_ORIGIN: _parsed.CORS_ORIGIN ?? "http://localhost:3000",
  MATENSA_KEY: _parsed.MATENSA_KEY ?? "",
  MATENSA_SECRET: _parsed.MATENSA_SECRET ?? "",
  MATENSA_API_URL: _parsed.MATENSA_API_URL ?? "https://api-staging.matensa.com",
  BACKEND_PUBLIC_URL: _parsed.BACKEND_PUBLIC_URL ?? "http://localhost:4000",
}

export type Env = typeof env
