import cors from "cors"
import express from "express"
import type { Express } from "express"
import type { ApiHealthResponse } from "@workspace/types"

import { env } from "./config/env.js"
import { errorHandler, notFoundHandler } from "./http/errors.js"
import { authRouter } from "./routes/auth.js"
import { certificatesRouter } from "./routes/certificates.js"
import { coursesRouter } from "./routes/courses.js"
import { instructorCoursesRouter } from "./routes/instructor-courses.js"
import { learningRouter } from "./routes/learning.js"
import { lecturesRouter } from "./routes/lectures.js"
import { paymentsRouter } from "./routes/payments.js"
import { quizzesRouter } from "./routes/quizzes.js"

export const app: Express = express()

app.disable("x-powered-by")
app.use(
  cors({
    credentials: true,
    origin: env.CORS_ORIGIN,
  }),
)
app.use(express.json())

app.get("/health", (_request, response) => {
  const payload: ApiHealthResponse = { status: "ok" }

  response.status(200).json(payload)
})

app.use("/auth", authRouter)
app.use("/certificates", certificatesRouter)
app.use("/courses", coursesRouter)
app.use("/instructor/courses", instructorCoursesRouter)
app.use("/learning", learningRouter)
app.use("/lectures", lecturesRouter)
app.use("/payments", paymentsRouter)
app.use("/quizzes", quizzesRouter)
app.use(notFoundHandler)
app.use(errorHandler)
