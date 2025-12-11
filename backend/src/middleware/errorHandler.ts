/**
 * Global error handling middleware
 */

import { Context } from "hono";
import { ContentfulStatusCode } from "hono/utils/http-status";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(err: Error, c: Context) {
  console.error("Error:", err);

  if (err instanceof AppError) {
    return c.json(
      {
        status: "error",
        message: err.message,
      },
      err.statusCode as ContentfulStatusCode
    );
  }

  // Unknown error
  return c.json(
    {
      status: "error",
      message: "Internal server error",
    },
    500
  );
}
