import { expect, test } from '@playwright/test';

test.describe('Recipe Ingredients & Steps Re-ordering E2E', () => {
  test('should allow dragging to reorder steps and ingredients and preserve order & payload on submit', async ({
    page,
  }) => {
    // Mock Units API
    await page.route('**/api/units', async (route) => {
      await route.fulfill({
        json: {
          status: 'success',
          data: [
            { id: 1, name: 'grams', shortName: 'g', type: 'Weight', toBaseFactor: 1 },
            { id: 2, name: 'pieces', shortName: 'pcs', type: 'Count', toBaseFactor: 1 },
          ],
        },
      });
    });

    // Mock Ingredient Categories & Groups API
    await page.route('**/api/ingredient-categories', async (route) => {
      await route.fulfill({ json: { status: 'success', data: [] } });
    });

    await page.route('**/api/ingredient-groups', async (route) => {
      await route.fulfill({ json: { status: 'success', data: [] } });
    });

    // Mock Ingredients API
    await page.route('**/api/ingredients', async (route) => {
      await route.fulfill({
        json: {
          status: 'success',
          data: [
            { id: 'ing-1', name: 'Flour', defaultUnitId: 1 },
            { id: 'ing-2', name: 'Sugar', defaultUnitId: 1 },
          ],
        },
      });
    });

    let submittedPayload: {
      name: string;
      ingredients: { ingredientId: string; ingredientOrder: number }[];
      steps: { stepNumber: number; instructionText: string }[];
    } | null = null;

    // Mock Create Recipe POST API
    await page.route('**/api/recipes', async (route) => {
      if (route.request().method() === 'POST') {
        submittedPayload = route.request().postDataJSON();
        await route.fulfill({
          json: {
            status: 'success',
            data: {
              id: 'recipe-123',
              name: submittedPayload?.name,
              ingredients: submittedPayload?.ingredients,
              steps: submittedPayload?.steps,
            },
          },
        });
      } else {
        await route.fulfill({ json: { status: 'success', data: [] } });
      }
    });

    // Navigate to Add Recipe page
    await page.goto('/recipes/new');

    // Fill Recipe Name
    await page.fill('#recipe-name', 'E2E Layered Cake');

    // Select first ingredient (Flour)
    const ingInput1 = page.locator('input[placeholder="Search ingredient..."]').nth(0);
    await ingInput1.focus();
    await ingInput1.fill('Flour');
    await page.getByText('Flour').first().click();

    // Click "+ Add Ingredient"
    await page.getByText('+ Add Ingredient').click();

    // Select second ingredient (Sugar)
    const ingInput2 = page.locator('input[placeholder="Search ingredient..."]').nth(1);
    await ingInput2.focus();
    await ingInput2.fill('Sugar');
    await page.getByText('Sugar').first().click();

    // Fill Step 1 text
    const stepTextArea1 = page.locator('textarea[placeholder="Describe this step..."]').nth(0);
    await stepTextArea1.fill('First step: Mix flour with water.');

    // Click "+ Add Step"
    await page.getByText('+ Add Step').click();

    // Fill Step 2 text
    const stepTextArea2 = page.locator('textarea[placeholder="Describe this step..."]').nth(1);
    await stepTextArea2.fill('Second step: Fold in sugar gently.');

    // Drag step 0 row over step 1 row
    const stepRow0 = page.locator('.step-row-card').nth(0);
    const stepRow1 = page.locator('.step-row-card').nth(1);

    await stepRow0.dragTo(stepRow1);

    // Verify step order swapped in DOM inputs
    const stepVal0 = await page
      .locator('textarea[placeholder="Describe this step..."]')
      .nth(0)
      .inputValue();
    const stepVal1 = await page
      .locator('textarea[placeholder="Describe this step..."]')
      .nth(1)
      .inputValue();

    expect(stepVal0).toContain('Second step: Fold in sugar gently.');
    expect(stepVal1).toContain('First step: Mix flour with water.');

    // Submit Recipe
    await page.getByRole('button', { name: 'Save Recipe' }).click();

    // Verify submitted payload preserves re-ordered step indices
    expect(submittedPayload).not.toBeNull();
    expect(submittedPayload!.steps[0].instructionText).toBe('Second step: Fold in sugar gently.');
    expect(submittedPayload!.steps[1].instructionText).toBe('First step: Mix flour with water.');
  });
});
