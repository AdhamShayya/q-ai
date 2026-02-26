import "dotenv/config"
import { type } from "arktype"

const envSchema = type({
  DATABASE_URL: "string",
  "CORS_ORIGIN?": "string",
  JWT_SECRET: "string >= 32",
  "JWT_EXPIRES_IN?": "string",
  "PORT?": "string.numeric.parse",
  "NODE_ENV?": "'development' | 'test' | 'production'",
})

const _parsed = envSchema(process.env)

if (_parsed instanceof type.errors) {
  console.error("Invalid environment variables:\n")
  console.error(_parsed.summary)
  process.exit(1)
}

export const env = {
  PORT: _parsed.PORT ?? 4000,
  JWT_SECRET: _parsed.JWT_SECRET,
  DATABASE_URL: _parsed.DATABASE_URL,
  JWT_EXPIRES_IN: _parsed.JWT_EXPIRES_IN ?? "7d",
  NODE_ENV: _parsed.NODE_ENV ?? ("development" as const),
  CORS_ORIGIN: _parsed.CORS_ORIGIN ?? "http://localhost:3000",
}

export type Env = typeof env
