/**
 * RBAC integration tests — inventory-domain mutation guards.
 *
 * Verifies that kitchen members with the `viewer` role can read domain data
 * but are denied write (POST/PUT/DELETE) access, while `editor` members can
 * write. Read access itself is enforced by authMiddleware (membership check).
 */
import { assertEquals } from '@std/assert';
import app from '../src/app.ts';
import { closeDB } from '../src/db/client.ts';
import { initMigratedDB } from './helpers/test-db-path.ts';

Deno.test('RBAC - viewer can read but not write in a shared kitchen', async () => {
  const db = initMigratedDB();
  db.exec('DELETE FROM auth_rate_limits;');
  try {
    const suffix = Date.now();
    const ownerEmail = `rbac_owner_${suffix}@pantry.app`;
    const viewerEmail = `rbac_viewer_${suffix}@pantry.app`;
    const password = 'Password123!';

    // Owner signs up and creates a shared kitchen
    const ownerSignup = await app.request('/api/v1/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ownerEmail, password, fullName: 'RBAC Owner' }),
    });
    const ownerData = await ownerSignup.json();
    const ownerToken = ownerData.data.accessToken;

    const createKitchen = await app.request('/api/v1/kitchens', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${ownerToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'RBAC Test Kitchen' }),
    });
    assertEquals(createKitchen.status, 201);
    const kitchenId = (await createKitchen.json()).data.id;

    // Viewer signs up and is invited as `viewer`
    await app.request('/api/v1/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: viewerEmail, password, fullName: 'RBAC Viewer' }),
    });
    const viewerLogin = await app.request('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: viewerEmail, password }),
    });
    const viewerData = await viewerLogin.json();
    const viewerToken = viewerData.data.accessToken;

    const invite = await app.request(`/api/v1/kitchens/${kitchenId}/members`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${ownerToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: viewerEmail, role: 'viewer' }),
    });
    assertEquals(invite.status, 201);

    const viewerHeaders = {
      'Authorization': `Bearer ${viewerToken}`,
      'X-Kitchen-Id': kitchenId,
      'Content-Type': 'application/json',
    };

    // 1. Viewer CAN read
    const listRecipes = await app.request('/api/v1/recipes', {
      method: 'GET',
      headers: viewerHeaders,
    });
    assertEquals(listRecipes.status, 200);

    // 2. Viewer CANNOT create a recipe
    const postRecipe = await app.request('/api/v1/recipes', {
      method: 'POST',
      headers: viewerHeaders,
      body: JSON.stringify({ name: 'Forbidden Recipe' }),
    });
    assertEquals(postRecipe.status, 403);

    // 3. Viewer CANNOT delete a recipe (nonexistent id is fine — RBAC fires first)
    const deleteRecipe = await app.request('/api/v1/recipes/some-id', {
      method: 'DELETE',
      headers: viewerHeaders,
    });
    assertEquals(deleteRecipe.status, 403);

    // 4. Editor CAN write (invite a second member as editor)
    const editorEmail = `rbac_editor_${suffix}@pantry.app`;
    await app.request('/api/v1/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: editorEmail, password, fullName: 'RBAC Editor' }),
    });
    const editorLogin = await app.request('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: editorEmail, password }),
    });
    const editorToken = (await editorLogin.json()).data.accessToken;

    const inviteEditor = await app.request(`/api/v1/kitchens/${kitchenId}/members`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${ownerToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: editorEmail, role: 'editor' }),
    });
    assertEquals(inviteEditor.status, 201);

    const postAsEditor = await app.request('/api/v1/recipes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${editorToken}`,
        'X-Kitchen-Id': kitchenId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Editor Stew',
        description: 'Created by an editor',
        servings: 2,
      }),
    });
    assertEquals(postAsEditor.status, 201);
  } finally {
    closeDB();
  }
});
