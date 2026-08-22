import { Context } from 'hono';
import { Hono } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { config } from '../config/env.ts';
import { errorResponse, successResponse } from '../utils/response.ts';
import {
  changeUserPassword,
  getUserProfile,
  loginUser,
  logoutUserSession,
  refreshUserSession,
  resendEmailVerification,
  signupUser,
  updateUserProfile,
  verifyUserEmail,
} from '../services/auth.service.ts';
import { getUserActiveSessions, revokeAllSessionsForUser } from '../services/session.service.ts';
import { AuthContextVars, authMiddleware } from '../middleware/auth.ts';
import { AppError } from '../middleware/errorHandler.ts';
import { rateLimitMiddleware } from '../middleware/rate-limit.ts';
import { hashToken } from '../utils/crypto.ts';
import {
  validateChangePasswordRequest,
  validateLoginRequest,
  validateResendVerificationRequest,
  validateSignupRequest,
  validateUpdateProfileRequest,
  validateVerifyEmailRequest,
} from '../validators/auth.validator.ts';

export const authRoutes = new Hono<{ Variables: AuthContextVars }>();

const isProduction = config.env === 'production';
const COOKIE_NAME = isProduction ? '__Host-pantry_refresh' : 'pantry_refresh';

// Helper to set RFC 6265bis compliant HTTP-only refresh cookie
function setRefreshCookie(c: Context, refreshToken: string) {
  setCookie(c, COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'Lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

function clearRefreshCookie(c: Context) {
  deleteCookie(c, COOKIE_NAME, { path: '/', secure: isProduction });
  deleteCookie(c, 'pantry_refresh', { path: '/' });
  deleteCookie(c, '__Host-pantry_refresh', { path: '/', secure: true });
}

/**
 * Translates service errors into HTTP responses. Typed `AppError`s carry their
 * own status + client-safe message; anything else is an unexpected failure and
 * never leaks internals to the client.
 */
function toErrorResponse(
  c: Context,
  error: unknown,
  fallbackMessage: string,
): Response {
  if (error instanceof AppError) {
    return c.json(errorResponse(error.message), error.statusCode as 400 | 401 | 404 | 409 | 500);
  }
  console.error('Unexpected error in auth route:', error);
  return c.json(errorResponse(fallbackMessage), 500);
}

// 1. POST /api/v1/auth/signup
authRoutes.post('/signup', rateLimitMiddleware(10, 15), async (c) => {
  try {
    const body = await c.req.json();
    const validation = validateSignupRequest(body);
    if (!validation.isValid) {
      return c.json(errorResponse('Validation failed', validation.errors), 400);
    }

    const userAgent = c.req.header('User-Agent');
    const ipAddress = c.req.header('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

    const { authResponse, refreshToken } = await signupUser(body, userAgent, ipAddress);
    setRefreshCookie(c, refreshToken);

    return c.json(successResponse(authResponse, 'Account created successfully'), 201);
  } catch (error: unknown) {
    return toErrorResponse(c, error, 'Signup failed. Please try again.');
  }
});

// 2. POST /api/v1/auth/login
authRoutes.post('/login', rateLimitMiddleware(5, 15), async (c) => {
  try {
    const body = await c.req.json();
    const validation = validateLoginRequest(body);
    if (!validation.isValid) {
      return c.json(errorResponse('Validation failed', validation.errors), 400);
    }

    const userAgent = c.req.header('User-Agent');
    const ipAddress = c.req.header('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

    const { authResponse, refreshToken } = await loginUser(body, userAgent, ipAddress);
    setRefreshCookie(c, refreshToken);

    return c.json(successResponse(authResponse, 'Login successful'), 200);
  } catch (error: unknown) {
    return toErrorResponse(c, error, 'Login failed. Please try again.');
  }
});

// 3. POST /api/v1/auth/verify-email
authRoutes.post('/verify-email', rateLimitMiddleware(10, 15), async (c) => {
  try {
    const body = await c.req.json();
    const validation = validateVerifyEmailRequest(body);
    if (!validation.isValid) {
      return c.json(errorResponse('Validation failed', validation.errors), 400);
    }

    const result = await verifyUserEmail(body.token);
    return c.json(successResponse(result, result.message), 200);
  } catch (error: unknown) {
    return toErrorResponse(c, error, 'Email verification failed.');
  }
});

// 4. POST /api/v1/auth/resend-verification
authRoutes.post('/resend-verification', rateLimitMiddleware(5, 15), async (c) => {
  try {
    const body = await c.req.json();
    const validation = validateResendVerificationRequest(body);
    if (!validation.isValid) {
      return c.json(errorResponse('Validation failed', validation.errors), 400);
    }

    const result = await resendEmailVerification(body.email);
    return c.json(successResponse(result, result.message), 200);
  } catch (error: unknown) {
    return toErrorResponse(c, error, 'Failed to resend verification email.');
  }
});

// 5. POST /api/v1/auth/refresh
authRoutes.post('/refresh', rateLimitMiddleware(20, 15), async (c) => {
  const refreshToken = getCookie(c, COOKIE_NAME) || getCookie(c, 'pantry_refresh') ||
    getCookie(c, '__Host-pantry_refresh');
  if (!refreshToken) {
    return c.json(errorResponse('Refresh token cookie required.'), 401);
  }

  try {
    const userAgent = c.req.header('User-Agent');
    const ipAddress = c.req.header('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

    const result = await refreshUserSession(refreshToken, userAgent, ipAddress);
    setRefreshCookie(c, result.newRefreshToken);

    return c.json(
      successResponse(
        { accessToken: result.accessToken, expiresIn: result.expiresIn },
        'Token refreshed successfully',
      ),
      200,
    );
  } catch (error: unknown) {
    clearRefreshCookie(c);
    return toErrorResponse(c, error, 'Invalid or expired session. Please log in again.');
  }
});

// 6. POST /api/v1/auth/logout
authRoutes.post('/logout', async (c) => {
  const refreshToken = getCookie(c, COOKIE_NAME);
  if (refreshToken) {
    await logoutUserSession(refreshToken);
  }
  clearRefreshCookie(c);
  return c.json(successResponse({ success: true }, 'Logged out successfully'), 200);
});

// 7. POST /api/v1/auth/sessions/revoke-all
authRoutes.post('/sessions/revoke-all', authMiddleware, (c) => {
  const user = c.get('user');
  revokeAllSessionsForUser(user.userId);
  clearRefreshCookie(c);
  return c.json(
    successResponse({ success: true }, 'All device sessions revoked successfully'),
    200,
  );
});

// 8. GET & PATCH /api/v1/me/profile
authRoutes.get('/me/profile', authMiddleware, (c) => {
  try {
    const user = c.get('user');
    const profileData = getUserProfile(user.userId);
    return c.json(successResponse(profileData, 'Profile retrieved successfully'), 200);
  } catch (error: unknown) {
    return toErrorResponse(c, error, 'Failed to retrieve profile.');
  }
});

authRoutes.patch('/me/profile', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const validation = validateUpdateProfileRequest(body);
    if (!validation.isValid) {
      return c.json(errorResponse('Validation failed', validation.errors), 400);
    }

    const updatedUser = updateUserProfile(user.userId, body);
    return c.json(successResponse({ user: updatedUser }, 'Profile updated successfully'), 200);
  } catch (error: unknown) {
    return toErrorResponse(c, error, 'Failed to update profile.');
  }
});

// 9. PUT /api/v1/me/password
authRoutes.put('/me/password', authMiddleware, rateLimitMiddleware(5, 15), async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const validation = validateChangePasswordRequest(body);
    if (!validation.isValid) {
      return c.json(errorResponse('Validation failed', validation.errors), 400);
    }

    await changeUserPassword(user.userId, body);
    clearRefreshCookie(c);

    return c.json(
      successResponse(
        { success: true },
        'Password changed successfully. Other sessions have been revoked. Please log in again.',
      ),
      200,
    );
  } catch (error: unknown) {
    return toErrorResponse(c, error, 'Failed to change password.');
  }
});

// 10. GET /api/v1/me/sessions
authRoutes.get('/me/sessions', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const currentToken = getCookie(c, COOKIE_NAME);
    const currentHash = currentToken ? await hashToken(currentToken) : undefined;

    const sessions = getUserActiveSessions(user.userId, currentHash);
    return c.json(successResponse(sessions, 'Active sessions retrieved successfully'), 200);
  } catch (error: unknown) {
    return toErrorResponse(c, error, 'Failed to retrieve active sessions.');
  }
});
