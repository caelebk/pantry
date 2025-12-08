/**
 * Standardized API response utilities
 */

export interface ApiResponse<T> {
  status: "success" | "error";
  data?: T;
  message?: string;
  errors?: string[];
}

/**
 * Create success response
 */
export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    status: "success",
    data,
    ...(message && { message }),
  };
}

/**
 * Create error response
 */
export function errorResponse(message: string, errors?: string[]): ApiResponse<never> {
  return {
    status: "error",
    message,
    ...(errors && { errors }),
  };
}

/**
 * Create paginated response
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export function paginatedResponse<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number
): PaginatedResponse<T> {
  return {
    status: "success",
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
