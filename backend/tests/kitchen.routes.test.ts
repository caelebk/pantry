import { assertEquals } from '@std/assert';
import app from '../src/app.ts';
import { closeDB, initDB } from '../src/db/client.ts';

Deno.test('Kitchen Routes Integration - Shared Kitchen Workspaces & RBAC', async () => {
  const db = initDB();
  db.exec('DELETE FROM auth_rate_limits;');
  try {
    const ownerEmail = `owner_${Date.now()}@pantry.app`;
    const memberEmail = `member_${Date.now()}@pantry.app`;

    // 1. Register Owner User
    const signupRes = await app.request('/api/v1/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ownerEmail, password: 'Password123!', fullName: 'Owner Chef' }),
    });
    const signupData = await signupRes.json();
    const ownerToken = signupData.data.accessToken;

    // Register Second User to invite later
    await app.request('/api/v1/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: memberEmail, password: 'Password123!', fullName: 'Sous Chef' }),
    });

    // 2. GET /api/v1/kitchens (Default personal kitchen should exist)
    const listRes = await app.request('/api/v1/kitchens', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${ownerToken}` },
    });
    assertEquals(listRes.status, 200);
    const listBody = await listRes.json();
    assertEquals(listBody.status, 'success');
    assertEquals(listBody.data.length, 1);

    // 3. POST /api/v1/kitchens (Create Custom Shared Kitchen)
    const createRes = await app.request('/api/v1/kitchens', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ownerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Bistro 88 Shared Kitchen',
        description: 'Commercial kitchen for dinner service',
      }),
    });

    assertEquals(createRes.status, 201);
    const createBody = await createRes.json();
    assertEquals(createBody.status, 'success');
    const kitchenId = createBody.data.id;
    assertEquals(createBody.data.name, 'Bistro 88 Shared Kitchen');

    // 4. POST /api/v1/kitchens/:kitchenId/members (Invite member)
    const inviteRes = await app.request(`/api/v1/kitchens/${kitchenId}/members`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ownerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: memberEmail,
        role: 'editor',
      }),
    });

    assertEquals(inviteRes.status, 201);
    const inviteBody = await inviteRes.json();
    assertEquals(inviteBody.status, 'success');
    assertEquals(inviteBody.data.email, memberEmail);

    // 5. GET /api/v1/kitchens/:kitchenId (Retrieve members)
    const getRes = await app.request(`/api/v1/kitchens/${kitchenId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${ownerToken}` },
    });

    assertEquals(getRes.status, 200);
    const getBody = await getRes.json();
    assertEquals(getBody.data.members.length, 2);
  } finally {
    closeDB();
  }
});
