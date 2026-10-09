import { Recipe } from '@models/recipe.model';

/** A total is known only when every contributing value is recorded. Zero is known. */
export function sumKnownMetadata(
  values: readonly (number | null | undefined)[],
): number | undefined {
  if (values.length === 0 || values.some((value) => value == null)) return undefined;
  return values.reduce<number>((sum, value) => sum + value!, 0);
}

export function recipeTotalTime(recipe: Pick<Recipe, 'prepTime' | 'cookTime'>): number | undefined {
  return sumKnownMetadata([recipe.prepTime, recipe.cookTime]);
}
