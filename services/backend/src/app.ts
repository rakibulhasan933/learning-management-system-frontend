import cors from "cors"
import express from "express"
import type { Express } from "express"
import type { ApiHealthResponse } from "@workspace/types"

import { env } from "./config/env.js"
import { errorHandler, notFoundHandler } from "./http/errors.js"
import { assignmentsRouter } from "./routes/assignments.js"
import { adminRouter } from "./routes/admin.js"
import { authRouter } from "./routes/auth.js"
import { certificatesRouter } from "./routes/certificates.js"
import { communityRouter } from "./routes/community.js"
import { coursesRouter } from "./routes/courses.js"
import { instructorCoursesRouter } from "./routes/instructor-courses.js"
import { instructorDashboardRouter } from "./routes/instructor-dashboard.js"
import { learningRouter } from "./routes/learning.js"
import { lecturesRouter } from "./routes/lectures.js"
import { paymentsRouter } from "./routes/payments.js"
import { progressRouter } from "./routes/progress.js"
import { studentDashboardRouter } from "./routes/student-dashboard.js"
import { quizzesRouter } from "./routes/quizzes.js"
import { uploadsRouter } from "./routes/uploads.js"

export const app: Express = express()

app.disable("x-powered-by")
app.use(
  cors({
    credentials: true,
    origin: env.CORS_ORIGIN,
  })
)
app.use(express.json())

app.get("/health", (_request, response) => {
  const payload: ApiHealthResponse = { status: "ok" }

  response.status(200).json(payload)
})

app.use("/admin", adminRouter)
app.use("/assignments", assignmentsRouter)
app.use("/auth", authRouter)
app.use("/certificates", certificatesRouter)
app.use("/community", communityRouter)
app.use("/courses", coursesRouter)
app.use("/instructor/courses", instructorCoursesRouter)
app.use("/instructor", instructorDashboardRouter)
app.use("/learning", learningRouter)
app.use("/lectures", lecturesRouter)
app.use("/payments", paymentsRouter)
app.use("/progress", progressRouter)
app.use("/student", studentDashboardRouter)
app.use("/quizzes", quizzesRouter)
app.use("/uploads", uploadsRouter)
app.use(notFoundHandler)
app.use(errorHandler)
