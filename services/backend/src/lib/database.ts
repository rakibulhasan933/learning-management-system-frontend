import { createDatabase } from "@workspace/db"

import { env } from "../config/env.js"

export const { client: databaseClient, db } = createDatabase(env.DATABASE_URL)
