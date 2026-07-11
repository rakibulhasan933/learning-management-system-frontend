import { config } from "dotenv"
import { defineConfig } from "drizzle-kit"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const packageDirectory = dirname(fileURLToPath(import.meta.url))

config({ path: resolve(packageDirectory, "../../.env") })

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set before running Drizzle commands.")
}

export default defineConfig({
  dialect: "postgresql",
  schema: resolve(packageDirectory, "src/schema.ts"),
  out: resolve(packageDirectory, "drizzle"),
  dbCredentials: {
    url: databaseUrl,
  },
})
