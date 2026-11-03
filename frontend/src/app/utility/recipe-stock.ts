import { Ingredient } from '@models/ingredient.model';
import { RecipeIngredientDTO } from '@models/recipe.model';
import { Unit } from '@models/unit.model';

const TOLERANCE = 1e-6;

export interface StockItem {
  ingredientId?: string | null;
  quantity: number;
  expirationDate?: Date | string | null;
  unit?: { toBaseFactor?: number | null } | null;
}

export type ShortageReason = 'absent' | 'insufficient' | 'expired';

export interface RecipeShortage {
  ingredientId: string;
  name: string;
  reason: ShortageReason;
}

export interface RecipeAvailability {
  availableCount: number;
  totalCount: number;
  percentage: number;
  isFullyMakeable: boolean;
}

/** Sums non-expired stock per ingredient, in base units. */
export function buildAvailableBaseMap(
  items: readonly StockItem[],
  now: Date = new Date(),
): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of items) {
    if (!item.ingredientId) continue;
    if (item.expirationDate && new Date(item.expirationDate) < now) continue;
    const factor = item.unit?.toBaseFactor || 1;
    map.set(item.ingredientId, (map.get(item.ingredientId) || 0) + item.quantity * factor);
  }
  return map;
}

/** Whether the stock covers the quantity a recipe ingredient needs. */
export function isIngredientAvailable(
  ing: Pick<RecipeIngredientDTO, 'ingredientId' | 'quantity' | 'unitId'>,
  unitMap: ReadonlyMap<number, Unit>,
  availableBaseMap: ReadonlyMap<string, number>,
): boolean {
  const unit = ing.unitId ? unitMap.get(ing.unitId) : null;
  const requiredBase = ing.quantity * (unit?.toBaseFactor || 1);
  return (availableBaseMap.get(ing.ingredientId) || 0) >= requiredBase - TOLERANCE;
}

/** Counts how many of the recipe's ingredients are in stock. A recipe without ingredients is makeable. */
export function recipeAvailability(
  ingredients: readonly Pick<RecipeIngredientDTO, 'ingredientId' | 'quantity' | 'unitId'>[],
  unitMap: ReadonlyMap<number, Unit>,
  availableBaseMap: ReadonlyMap<string, number>,
): RecipeAvailability {
  const totalCount = ingredients.length;
  const availableCount = ingredients.filter((ing) =>
    isIngredientAvailable(ing, unitMap, availableBaseMap),
  ).length;
  return {
    availableCount,
    totalCount,
    percentage: totalCount ? Math.round((availableCount / totalCount) * 100) : 100,
    isFullyMakeable: availableCount === totalCount,
  };
}

/** Recipe ingredients the stock does not cover, with the reason for each. */
export function recipeShortages(
  ingredients: readonly Pick<RecipeIngredientDTO, 'ingredientId' | 'quantity' | 'unitId'>[],
  items: readonly StockItem[],
  unitMap: ReadonlyMap<number, Unit>,
  ingredientMap: ReadonlyMap<string, Pick<Ingredient, 'name'>>,
  availableBaseMap: ReadonlyMap<string, number> = buildAvailableBaseMap(items),
): RecipeShortage[] {
  const now = Date.now();
  return ingredients
    .filter((ing) => !isIngredientAvailable(ing, unitMap, availableBaseMap))
    .map((ing) => {
      const available = availableBaseMap.get(ing.ingredientId) || 0;
      const expiredStock = items.some(
        (item) =>
          item.ingredientId === ing.ingredientId &&
          item.quantity > 0 &&
          item.expirationDate &&
          new Date(item.expirationDate).getTime() < now,
      );
      const reason: ShortageReason =
        available > 0 ? 'insufficient' : expiredStock ? 'expired' : 'absent';
      return {
        ingredientId: ing.ingredientId,
        name: ingredientMap.get(ing.ingredientId)?.name || ing.ingredientId,
        reason,
      };
    });
}
