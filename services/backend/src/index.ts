import { createServer } from "node:http"

import { app } from "./app.js"
import { env } from "./config/env.js"

const server = createServer(app)

server.listen(env.PORT, () => {
  console.info(`Backend listening on port ${env.PORT}`)
})

function shutdown(signal: NodeJS.Signals) {
  server.close((error) => {
    if (error) {
      console.error(`${signal}: failed to close backend server`, error)
      process.exitCode = 1
    }
  })
}

process.once("SIGINT", () => shutdown("SIGINT"))
process.once("SIGTERM", () => shutdown("SIGTERM"))
