import { assertEquals } from '@std/assert';
import {
  isValidCreateIngredientDTO,
  isValidReconcileUnitsDTO,
  isValidUpdateIngredientDTO,
} from '../src/validators/ingredient.validator.ts';
import {
  isValidBulkIdsDTO,
  isValidCreateItemDTO,
  isValidUpdateItemDTO,
} from '../src/validators/item.validator.ts';

Deno.test('Ingredient Validator - isValidCreateIngredientDTO', () => {
  assertEquals(isValidCreateIngredientDTO({ name: 'Salt', defaultUnitId: 1 }), true);
  assertEquals(isValidCreateIngredientDTO({ name: '', defaultUnitId: 1 }), false);
  assertEquals(isValidCreateIngredientDTO({ name: 'Salt', defaultUnitId: 0 }), false);
  assertEquals(
    isValidCreateIngredientDTO({ name: 'Salt', defaultUnitId: 1, categoryId: -5 }),
    false,
  );
});

Deno.test('Ingredient Validator - isValidUpdateIngredientDTO', () => {
  assertEquals(isValidUpdateIngredientDTO({ name: 'Pepper' }), true);
  assertEquals(isValidUpdateIngredientDTO({ name: '' }), false);
  assertEquals(isValidUpdateIngredientDTO({ defaultUnitId: -1 }), false);
});

Deno.test('Ingredient Validator - isValidReconcileUnitsDTO', () => {
  const valid = {
    newDefaultUnitId: 2,
    items: [
      { id: '123e4567-e89b-12d3-a456-426614174000', quantity: 5 },
    ],
  };
  assertEquals(isValidReconcileUnitsDTO(valid), true);
  assertEquals(isValidReconcileUnitsDTO({ newDefaultUnitId: 0, items: [] }), false);
  assertEquals(isValidReconcileUnitsDTO({ newDefaultUnitId: 2, items: 'invalid' }), false);
});

Deno.test('Item Validator - isValidCreateItemDTO', () => {
  const validItem = {
    label: 'Chicken Breast',
    quantity: 500,
    purchaseDate: '2026-08-01',
    expirationDate: '2026-08-10',
    ingredientId: '123e4567-e89b-12d3-a456-426614174000',
  };
  assertEquals(isValidCreateItemDTO(validItem), true);
  assertEquals(isValidCreateItemDTO({ ...validItem, label: '' }), false);
  assertEquals(isValidCreateItemDTO({ ...validItem, quantity: -10 }), false);
  assertEquals(isValidCreateItemDTO({ ...validItem, purchaseDate: 'invalid-date' }), false);
});

Deno.test('Item Validator - isValidUpdateItemDTO', () => {
  assertEquals(isValidUpdateItemDTO({ label: 'Updated Label' }), true);
  assertEquals(isValidUpdateItemDTO({ label: '' }), false);
  assertEquals(isValidUpdateItemDTO({ quantity: -5 }), false);
  assertEquals(isValidUpdateItemDTO({ ingredientId: 'invalid-uuid' }), false);
});

Deno.test('Item Validator - isValidBulkIdsDTO', () => {
  assertEquals(
    isValidBulkIdsDTO({ ids: ['123e4567-e89b-12d3-a456-426614174000'] }),
    true,
  );
  assertEquals(isValidBulkIdsDTO({ ids: [] }), false);
  assertEquals(isValidBulkIdsDTO({ ids: ['invalid-uuid'] }), false);
  assertEquals(isValidBulkIdsDTO(null), false);
});

import {
  isValidCreateRecipeDTO,
  isValidUpdateRecipeDTO,
} from '../src/validators/recipe.validator.ts';

Deno.test('Recipe Validator - isValidCreateRecipeDTO', () => {
  const validRecipe = {
    name: 'Spaghetti Bolognese',
    servings: 4,
    prepTime: 15,
    cookTime: 30,
    ingredients: [
      { ingredientId: '123e4567-e89b-12d3-a456-426614174000', quantity: 200, unitId: 1 },
    ],
    steps: [
      { stepNumber: 1, instructionText: 'Boil water and cook pasta.' },
    ],
  };
  assertEquals(isValidCreateRecipeDTO(validRecipe), true);
  assertEquals(isValidCreateRecipeDTO({ ...validRecipe, name: '' }), false);
  assertEquals(isValidCreateRecipeDTO({ ...validRecipe, servings: -1 }), false);
});

Deno.test('Recipe Validator - isValidUpdateRecipeDTO', () => {
  assertEquals(isValidUpdateRecipeDTO({ name: 'Updated Recipe Name' }), true);
  assertEquals(isValidUpdateRecipeDTO({ name: '' }), false);
  assertEquals(isValidUpdateRecipeDTO({ cookTime: -10 }), false);
});

import {
  validateChangePasswordRequest,
  validatePasswordStrength,
  validateSignupRequest,
  validateVerifyEmailRequest,
} from '../src/validators/auth.validator.ts';

Deno.test('Auth Validator - validatePasswordStrength', () => {
  // Valid strong passwords
  assertEquals(validatePasswordStrength('P@ssword123!').isValid, true);
  assertEquals(validatePasswordStrength('SuperSecure#99').isValid, true);

  // Too short (< 8 chars)
  assertEquals(validatePasswordStrength('Sh0rt!').isValid, false);

  // Missing uppercase
  assertEquals(validatePasswordStrength('lowercase123!').isValid, false);

  // Missing lowercase
  assertEquals(validatePasswordStrength('UPPERCASE123!').isValid, false);

  // Missing number
  assertEquals(validatePasswordStrength('NoNumbersHere!').isValid, false);

  // Missing special symbol
  assertEquals(validatePasswordStrength('NoSpecialChars123').isValid, false);

  // Common weak password rejection
  assertEquals(validatePasswordStrength('password123').isValid, false);
  assertEquals(validatePasswordStrength('12345678').isValid, false);

  // Contains username or email prefix
  assertEquals(validatePasswordStrength('ChefGordon123!', 'chefgordon').isValid, false);
  assertEquals(validatePasswordStrength('ChefGordon123!', 'chefgordon@pantry.app').isValid, false);
});

Deno.test('Auth Validator - validateSignupRequest & validateVerifyEmailRequest', () => {
  const validSignup = {
    email: 'chef@pantry.app',
    username: 'masterchef',
    password: 'StrongPassword123!',
    fullName: 'Master Chef',
  };
  assertEquals(validateSignupRequest(validSignup).isValid, true);

  // Weak password in signup rejected
  assertEquals(
    validateSignupRequest({ ...validSignup, password: 'weak' }).isValid,
    false,
  );

  // Email verification request
  assertEquals(validateVerifyEmailRequest({ token: 'abcdef123456' }).isValid, true);
  assertEquals(validateVerifyEmailRequest({ token: '' }).isValid, false);
  assertEquals(validateVerifyEmailRequest({}).isValid, false);

  // Change password request
  assertEquals(
    validateChangePasswordRequest({
      currentPassword: 'OldPassword123!',
      newPassword: 'NewStrongPassword456!',
    }).isValid,
    true,
  );
  // Same current and new password rejected
  assertEquals(
    validateChangePasswordRequest({
      currentPassword: 'SamePassword123!',
      newPassword: 'SamePassword123!',
    }).isValid,
    false,
  );
  // Weak new password rejected
  assertEquals(
    validateChangePasswordRequest({
      currentPassword: 'OldPassword123!',
      newPassword: 'weak',
    }).isValid,
    false,
  );
});
