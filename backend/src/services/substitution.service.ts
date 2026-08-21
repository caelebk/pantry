/**
 * Substitution service - Smart ingredient replacement logic
 */

import { getDB } from '../db/client.ts';
import type { IngredientDTO } from '../models/data-models/ingredient.model.ts';

export interface SubstitutionSuggestion {
  ingredient: IngredientDTO;
  availableQuantityBase: number; // total quantity in base units
  matchLevel: 'same_group' | 'same_ingredient_category';
  groupName: string;
}

export class SubstitutionService {
  /**
   * Gets substitution suggestions for a given ingredient.
   * Ranking:
   *   1. Same Ingredient Group (highest priority)
   *   2. Same Ingredient Category (broader match)
   * Only returns ingredients that have unexpired ingredient items in stock.
   */
  getSubstitutions(ingredientId: string, kitchenId?: string): Promise<SubstitutionSuggestion[]> {
    const db = getDB();

    // 1. Get the source ingredient's group and ingredient category
    const source = db.prepare(`
      SELECT i.id, i.name, i.ingredient_group_id, ig.ingredient_category_id, ig.name as group_name
      FROM ingredients i
      LEFT JOIN ingredient_groups ig ON i.ingredient_group_id = ig.id
      WHERE i.id = ?
    `).get(ingredientId) as {
      id: string;
      name: string;
      ingredient_group_id: number | null;
      ingredient_category_id: number | null;
      group_name: string | null;
    } | undefined;

    if (!source) return Promise.resolve([]);

    // 2. Find all OTHER ingredients that have unexpired stock in ingredient_items within active kitchen
    //    Join ingredients -> ingredient_items -> units to compute base quantity
    const whereKitchen = kitchenId ? 'AND it.kitchen_id = ?' : '';
    const sql = `
      SELECT
        ing.id as ingredient_id,
        ing.name as ingredient_name,
        ing.ingredient_group_id,
        ing.default_unit_id,
        ig.name as group_name,
        ig.ingredient_category_id,
        SUM(it.quantity * COALESCE(u.to_base_factor, 1.0)) as available_base_qty
      FROM ingredients ing
      JOIN ingredient_items it ON it.ingredient_id = ing.id
      JOIN ingredient_groups ig ON ing.ingredient_group_id = ig.id
      LEFT JOIN units u ON it.unit_id = u.id
      WHERE ing.id != ?
        ${whereKitchen}
        AND (it.expiration_date IS NULL OR datetime(it.expiration_date) >= datetime('now'))
      GROUP BY ing.id
      HAVING available_base_qty > 0
      ORDER BY ing.name
    `;

    const stmt = db.prepare(sql);
    const candidates = (kitchenId ? stmt.all(ingredientId, kitchenId) : stmt.all(ingredientId)) as {
      ingredient_id: string;
      ingredient_name: string;
      ingredient_group_id: number;
      default_unit_id: number | null;
      group_name: string;
      ingredient_category_id: number | null;
      available_base_qty: number;
    }[];

    const suggestions: SubstitutionSuggestion[] = [];

    for (const row of candidates) {
      let matchLevel: 'same_group' | 'same_ingredient_category' | null = null;

      if (source.ingredient_group_id && row.ingredient_group_id === source.ingredient_group_id) {
        matchLevel = 'same_group';
      } else if (
        source.ingredient_category_id &&
        row.ingredient_category_id === source.ingredient_category_id
      ) {
        matchLevel = 'same_ingredient_category';
      }

      if (matchLevel) {
        suggestions.push({
          ingredient: {
            id: row.ingredient_id,
            name: row.ingredient_name,
            ingredientGroupId: row.ingredient_group_id,
            defaultUnitId: row.default_unit_id ?? undefined,
          },
          availableQuantityBase: row.available_base_qty,
          matchLevel,
          groupName: row.group_name,
        });
      }
    }

    // Sort: same_group first, then same_ingredient_category, then alphabetically
    suggestions.sort((a, b) => {
      if (a.matchLevel !== b.matchLevel) {
        return a.matchLevel === 'same_group' ? -1 : 1;
      }
      return a.ingredient.name.localeCompare(b.ingredient.name);
    });

    return Promise.resolve(suggestions);
  }
}

export const substitutionService = new SubstitutionService();
