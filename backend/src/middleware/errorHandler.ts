/**
 * Global error handling middleware
 */

import { Context } from "hono";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export async function errorHandler(err: Error, c: Context) {
  console.error("Error:", err);

  if (err instanceof AppError) {
    return c.json(
      {
        status: "error",
        message: err.message,
      },
      err.statusCode
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
