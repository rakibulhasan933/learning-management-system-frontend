import { config } from "dotenv"
import { defineConfig } from "drizzle-kit"
config({ path: "../../.env" })

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set before running Drizzle commands.")
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: databaseUrl,
  },
})
