import type { NextFunction, Request, Response } from "express"
import { ZodError } from "zod"

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message)
  }
}

export function asyncHandler(
  handler: (request: Request, response: Response) => Promise<void>,
) {
  return (request: Request, response: Response, next: NextFunction) => {
    handler(request, response).catch(next)
  }
}

export function notFoundHandler(_request: Request, response: Response) {
  response.status(404).json({ message: "Route not found." })
}

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  void next

  if (error instanceof ZodError) {
    return response.status(400).json({
      message: "Invalid request payload.",
      issues: error.issues,
    })
  }

  if (error instanceof HttpError) {
    return response.status(error.statusCode).json({ message: error.message })
  }

  console.error(error)

  return response.status(500).json({ message: "Internal server error." })
}
