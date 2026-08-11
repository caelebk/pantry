import { Context } from 'hono';
import { Hono } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { config } from '../config/env.ts';
import { errorResponse, successResponse } from '../utils/response.ts';
import {
  validateChangePasswordRequest,
  validateLoginRequest,
  validateSignupRequest,
  validateUpdateProfileRequest,
} from '../validators/auth.validator.ts';
import {
  changeUserPassword,
  getUserProfile,
  loginUser,
  logoutUserSession,
  refreshUserSession,
  signupUser,
  updateUserProfile,
} from '../services/auth.service.ts';
import { getUserActiveSessions, revokeAllSessionsForUser } from '../services/session.service.ts';
import { AuthContextVars, authMiddleware } from '../middleware/auth.ts';
import { hashToken } from '../utils/crypto.ts';

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

// 1. POST /api/v1/auth/signup
authRoutes.post('/signup', async (c) => {
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
    const msg = error instanceof Error ? error.message : 'Signup failed';
    if (msg === 'EMAIL_ALREADY_EXISTS') {
      return c.json(errorResponse('An account with this email address already exists.'), 409);
    }
    return c.json(errorResponse(msg), 500);
  }
});

// 2. POST /api/v1/auth/login
authRoutes.post('/login', async (c) => {
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
    const msg = error instanceof Error ? error.message : 'Login failed';
    if (msg === 'INVALID_CREDENTIALS') {
      return c.json(errorResponse('Invalid email or password.'), 401);
    }
    return c.json(errorResponse(msg), 500);
  }
});

// 3. POST /api/v1/auth/refresh
authRoutes.post('/refresh', async (c) => {
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
    const msg = error instanceof Error ? error.message : 'Session error';
    if (msg === 'STOLEN_TOKEN_REUSE_DETECTED') {
      return c.json(
        errorResponse(
          'Security Alert: Token reuse detected. All active sessions have been terminated.',
        ),
        401,
      );
    }
    return c.json(errorResponse('Invalid or expired session. Please log in again.'), 401);
  }
});

// 4. POST /api/v1/auth/logout
authRoutes.post('/logout', async (c) => {
  const refreshToken = getCookie(c, COOKIE_NAME);
  if (refreshToken) {
    await logoutUserSession(refreshToken);
  }
  clearRefreshCookie(c);
  return c.json(successResponse({ success: true }, 'Logged out successfully'), 200);
});

// 5. POST /api/v1/auth/sessions/revoke-all
authRoutes.post('/sessions/revoke-all', authMiddleware, (c) => {
  const user = c.get('user');
  revokeAllSessionsForUser(user.userId);
  clearRefreshCookie(c);
  return c.json(
    successResponse({ success: true }, 'All device sessions revoked successfully'),
    200,
  );
});

// 6. GET & PATCH /api/v1/me/profile
authRoutes.get('/me/profile', authMiddleware, (c) => {
  try {
    const user = c.get('user');
    const profileData = getUserProfile(user.userId);
    return c.json(successResponse(profileData, 'Profile retrieved successfully'), 200);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to retrieve profile';
    return c.json(errorResponse(msg), 500);
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
    const msg = error instanceof Error ? error.message : 'Failed to update profile';
    return c.json(errorResponse(msg), 500);
  }
});

// 7. PUT /api/v1/me/password
authRoutes.put('/me/password', authMiddleware, async (c) => {
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
    const msg = error instanceof Error ? error.message : 'Failed to change password';
    if (msg === 'INVALID_CURRENT_PASSWORD') {
      return c.json(errorResponse('Current password specified is incorrect.'), 400);
    }
    return c.json(errorResponse(msg), 500);
  }
});

// 8. GET /api/v1/me/sessions
authRoutes.get('/me/sessions', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const currentToken = getCookie(c, COOKIE_NAME);
    const currentHash = currentToken ? await hashToken(currentToken) : undefined;

    const sessions = getUserActiveSessions(user.userId, currentHash);
    return c.json(successResponse(sessions, 'Active sessions retrieved successfully'), 200);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to retrieve active sessions';
    return c.json(errorResponse(msg), 500);
  }
});
