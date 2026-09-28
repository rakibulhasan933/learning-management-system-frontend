import { app } from "../src/app.js"
import type { NextFunction, Request, Response } from "express"

function handler(request: Request, response: Response, next: NextFunction) {
  if (request.url === "/api") {
    request.url = "/"
  } else if (request.url.startsWith("/api/")) {
    request.url = request.url.slice(4)
  }
  app(request, response, next)
}

export default handler
