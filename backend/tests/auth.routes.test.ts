import { assertEquals, assertExists, assertStringIncludes } from '@std/assert';
import app from '../src/app.ts';
import { closeDB, initDB } from '../src/db/client.ts';

Deno.test('Auth Routes Integration - Full Authentication & Session Lifecycle', async () => {
  const db = initDB();
  db.exec('DELETE FROM auth_rate_limits;');
  try {
    const testEmail = `chef_${Date.now()}@pantry.app`;
    const testUsername = `chef_${Date.now()}`;
    const testPassword = 'SecurePassword123!';
    const testFullName = 'Chef Gordon Ramsey';

    // 1. POST /api/v1/auth/signup with username
    const signupRes = await app.request('/api/v1/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        username: testUsername,
        password: testPassword,
        fullName: testFullName,
      }),
    });

    assertEquals(signupRes.status, 201);
    const signupBody = await signupRes.json();
    assertEquals(signupBody.status, 'success');
    assertExists(signupBody.data.user.id);
    assertEquals(signupBody.data.user.email, testEmail);
    assertEquals(signupBody.data.user.username, testUsername);
    assertEquals(signupBody.data.user.fullName, testFullName);
    assertExists(signupBody.data.user.primaryKitchenId);
    assertExists(signupBody.data.accessToken);

    const cookieHeader = signupRes.headers.get('Set-Cookie') ?? '';
    assertStringIncludes(cookieHeader, 'pantry_refresh=');

    // Duplicate email signup conflict (409)
    const dupSignupRes = await app.request('/api/v1/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        fullName: testFullName,
      }),
    });
    assertEquals(dupSignupRes.status, 409);

    // Duplicate username signup conflict (409)
    const dupUserSignupRes = await app.request('/api/v1/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `other_${Date.now()}@pantry.app`,
        username: testUsername,
        password: testPassword,
        fullName: 'Another Chef',
      }),
    });
    assertEquals(dupUserSignupRes.status, 409);

    // 2. POST /api/v1/auth/login via USERNAME
    const loginViaUserRes = await app.request('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testUsername,
        password: testPassword,
      }),
    });
    assertEquals(loginViaUserRes.status, 200);
    const loginViaUserBody = await loginViaUserRes.json();
    assertEquals(loginViaUserBody.status, 'success');
    assertEquals(loginViaUserBody.data.user.username, testUsername);

    // 2b. POST /api/v1/auth/login via EMAIL
    const loginRes = await app.request('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    assertEquals(loginRes.status, 200);
    const loginBody = await loginRes.json();
    assertEquals(loginBody.status, 'success');
    assertExists(loginBody.data.accessToken);
    const accessToken = loginBody.data.accessToken;
    const loginCookie = loginRes.headers.get('Set-Cookie') ?? '';

    // Invalid login credentials check (401)
    const invalidLoginRes = await app.request('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword123!',
      }),
    });
    assertEquals(invalidLoginRes.status, 401);
    const invalidBody = await invalidLoginRes.json();
    assertEquals(invalidBody.status, 'error');

    // 3. GET /api/v1/me/profile (Protected endpoint)
    const profileRes = await app.request('/api/v1/me/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    assertEquals(profileRes.status, 200);
    const profileBody = await profileRes.json();
    assertEquals(profileBody.status, 'success');
    assertEquals(profileBody.data.user.email, testEmail);
    assertExists(profileBody.data.memberships);

    // Unauthenticated request check (401)
    const unauthRes = await app.request('/api/v1/me/profile', {
      method: 'GET',
    });
    assertEquals(unauthRes.status, 401);

    // 4. POST /api/v1/auth/refresh (Silent Token Rotation)
    const refreshRes = await app.request('/api/v1/auth/refresh', {
      method: 'POST',
      headers: {
        'Cookie': loginCookie,
      },
    });

    assertEquals(refreshRes.status, 200);
    const refreshBody = await refreshRes.json();
    assertEquals(refreshBody.status, 'success');
    assertExists(refreshBody.data.accessToken);

    // 5. POST /api/v1/auth/logout
    const logoutRes = await app.request('/api/v1/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Cookie': loginCookie,
      },
    });

    assertEquals(logoutRes.status, 200);
  } finally {
    closeDB();
  }
});
