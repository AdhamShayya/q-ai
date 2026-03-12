import * as path from "path"
import * as dotenv from "dotenv"
import { defineConfig } from "drizzle-kit"

// Load .env from the same directory as this config file, regardless of cwd
dotenv.config({ path: path.join(__dirname, ".env") })

const databaseUrl = process.env["DATABASE_URL"]
if (databaseUrl == null) {
  throw new Error("DATABASE_URL environment variable is required")
}

export default defineConfig({
  schema: "./db/schemas/*.schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
  verbose: true,
  strict: true,
})
