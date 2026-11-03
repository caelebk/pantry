import { Unit } from '@models/unit.model';
import {
  buildAvailableBaseMap,
  isIngredientAvailable,
  recipeAvailability,
  recipeShortages,
} from './recipe-stock';

const gram = { id: 1, toBaseFactor: 1 } as Unit;
const kilo = { id: 2, toBaseFactor: 1000 } as Unit;
const unitMap = new Map<number, Unit>([
  [1, gram],
  [2, kilo],
]);
const ingredientMap = new Map([
  ['flour', { name: 'Flour' }],
  ['milk', { name: 'Milk' }],
]);
const past = '2000-01-01T00:00:00Z';
const future = '2999-01-01T00:00:00Z';

describe('recipe-stock', () => {
  it('sums stock per ingredient in base units and skips expired items', () => {
    const map = buildAvailableBaseMap([
      { ingredientId: 'flour', quantity: 1, unit: { toBaseFactor: 1000 } },
      { ingredientId: 'flour', quantity: 200, expirationDate: future },
      { ingredientId: 'flour', quantity: 500, expirationDate: past },
      { ingredientId: null, quantity: 5 },
    ]);
    expect(map.get('flour')).toBe(1200);
    expect(map.size).toBe(1);
  });

  it('compares required quantity with stock using unit factors and tolerance', () => {
    const stock = new Map([['flour', 1000 - 1e-7]]);
    expect(
      isIngredientAvailable({ ingredientId: 'flour', quantity: 1, unitId: 2 }, unitMap, stock),
    ).toBe(true);
    expect(
      isIngredientAvailable({ ingredientId: 'flour', quantity: 2, unitId: 2 }, unitMap, stock),
    ).toBe(false);
    expect(isIngredientAvailable({ ingredientId: 'milk', quantity: 1 }, unitMap, stock)).toBe(
      false,
    );
  });

  it('reports availability counts and treats an empty recipe as makeable', () => {
    const stock = new Map([['flour', 500]]);
    expect(
      recipeAvailability(
        [
          { ingredientId: 'flour', quantity: 500, unitId: 1 },
          { ingredientId: 'milk', quantity: 1 },
        ],
        unitMap,
        stock,
      ),
    ).toEqual({ availableCount: 1, totalCount: 2, percentage: 50, isFullyMakeable: false });
    expect(recipeAvailability([], unitMap, stock)).toEqual({
      availableCount: 0,
      totalCount: 0,
      percentage: 100,
      isFullyMakeable: true,
    });
  });

  it('classifies shortages as absent, insufficient or expired', () => {
    const items = [
      { ingredientId: 'flour', quantity: 100, unit: { toBaseFactor: 1 } },
      { ingredientId: 'milk', quantity: 1, expirationDate: past },
    ];
    const result = recipeShortages(
      [
        { ingredientId: 'flour', quantity: 500, unitId: 1 },
        { ingredientId: 'milk', quantity: 1 },
        { ingredientId: 'egg', quantity: 1 },
      ],
      items,
      unitMap,
      ingredientMap,
    );
    expect(result).toEqual([
      { ingredientId: 'flour', name: 'Flour', reason: 'insufficient' },
      { ingredientId: 'milk', name: 'Milk', reason: 'expired' },
      { ingredientId: 'egg', name: 'egg', reason: 'absent' },
    ]);
  });
});
