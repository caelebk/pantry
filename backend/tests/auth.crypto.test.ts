import { assertEquals, assertMatch, assertNotEquals, assertRejects } from '@std/assert';
import {
  constantTimeCompare,
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
  hashToken,
  verifyAccessToken,
  verifyPassword,
} from '../src/utils/crypto.ts';

Deno.test('Cryptographic Suite - Password Hashing with Argon2id', async () => {
  const password = 'PantryMasterSecure2026!';
  const hash1 = await hashPassword(password);
  const hash2 = await hashPassword(password);

  // Argon2id header format verification
  assertMatch(hash1, /^\$argon2id\$/);

  // Random salt uniqueness verification
  assertNotEquals(hash1, hash2);

  // Password verification checks
  const isValid = await verifyPassword(hash1, password);
  assertEquals(isValid, true);

  const isInvalid = await verifyPassword(hash1, 'WrongPassword123!');
  assertEquals(isInvalid, false);
});

Deno.test('Cryptographic Suite - Timing-Safe String Comparison', () => {
  const tokenA = 'a6f8b2c4e9d1f3a5b7c9e2d4f6a8b0c2e4f6a8b0c2e4f6a8b0c2e4f6a8b0c2e4';
  const tokenB = 'a6f8b2c4e9d1f3a5b7c9e2d4f6a8b0c2e4f6a8b0c2e4f6a8b0c2e4f6a8b0c2e4';
  const tokenC = 'a6f8b2c4e9d1f3a5b7c9e2d4f6a8b0c2e4f6a8b0c2e4f6a8b0c2e4f6a8b0DIFF';
  const tokenD = 'short';

  assertEquals(constantTimeCompare(tokenA, tokenB), true);
  assertEquals(constantTimeCompare(tokenA, tokenC), false);
  assertEquals(constantTimeCompare(tokenA, tokenD), false);
});

Deno.test('Cryptographic Suite - Refresh Token Generation & Hashing', async () => {
  const token1 = generateRefreshToken();
  const token2 = generateRefreshToken();

  // 32-byte hex string format (64 characters)
  assertEquals(token1.length, 64);
  assertEquals(token2.length, 64);
  assertNotEquals(token1, token2);

  // SHA-256 hash formatting (64 hex characters)
  const hash1 = await hashToken(token1);
  const hash2 = await hashToken(token1);
  const hashOther = await hashToken(token2);

  assertEquals(hash1.length, 64);
  assertEquals(hash1, hash2);
  assertNotEquals(hash1, hashOther);
});

Deno.test('Cryptographic Suite - JWT Access Token Lifecycle', async () => {
  const payload = {
    userId: 'usr_12345678-1234-4234-8234-123456789abc',
    email: 'chef@pantry.app',
    globalRole: 'user',
    primaryKitchenId: 'ktc_11223344-5566-7788-9900-aabbccddeeff',
  };

  const secret = 'test_jwt_secret_key_32_bytes_long!!';
  const accessToken = await generateAccessToken(payload, secret, 900); // 15m

  assertNotEquals(accessToken, '');

  const verified = await verifyAccessToken(accessToken, secret);
  assertEquals(verified.userId, payload.userId);
  assertEquals(verified.email, payload.email);
  assertEquals(verified.globalRole, payload.globalRole);
  assertEquals(verified.primaryKitchenId, payload.primaryKitchenId);

  // Invalid secret rejection check
  await assertRejects(async () => {
    await verifyAccessToken(accessToken, 'invalid_secret_key_for_testing_12');
  });
});
