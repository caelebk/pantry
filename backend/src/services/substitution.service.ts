/**
 * Substitution service - Smart ingredient replacement logic
 */

import { getDB } from '../db/client.ts';
import type { IngredientDTO } from '../models/data-models/ingredient.model.ts';

export interface SubstitutionSuggestion {
  ingredient: IngredientDTO;
  availableQuantityBase: number; // total quantity in base units
  matchLevel: 'same_category' | 'same_nutrient_type';
  categoryName: string;
}

export class SubstitutionService {
  /**
   * Gets substitution suggestions for a given ingredient.
   * Ranking:
   *   1. Same Category (highest priority)
   *   2. Same Nutrient Type (broader match)
   * Only returns ingredients that have unexpired items in stock.
   */
  async getSubstitutions(ingredientId: string): Promise<SubstitutionSuggestion[]> {
    const db = getDB();

    // 1. Get the source ingredient's category and nutrient type
    const source = db.prepare(`
      SELECT i.id, i.name, i.category_id, c.nutrient_type_id, c.name as category_name
      FROM ingredients i
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE i.id = ?
    `).get(ingredientId) as {
      id: string;
      name: string;
      category_id: number | null;
      nutrient_type_id: number | null;
      category_name: string | null;
    } | undefined;

    if (!source) return [];

    // 2. Find all OTHER ingredients that have unexpired stock
    //    Join ingredients -> items -> units to compute base quantity
    const candidates = db.prepare(`
      SELECT
        ing.id as ingredient_id,
        ing.name as ingredient_name,
        ing.category_id,
        ing.default_unit_id,
        c.name as category_name,
        c.nutrient_type_id,
        SUM(it.quantity * COALESCE(u.to_base_factor, 1.0)) as available_base_qty
      FROM ingredients ing
      JOIN items it ON it.ingredient_id = ing.id
      JOIN categories c ON ing.category_id = c.id
      LEFT JOIN units u ON it.unit_id = u.id
      WHERE ing.id != ?
        AND (it.expiration_date IS NULL OR datetime(it.expiration_date) >= datetime('now'))
      GROUP BY ing.id
      HAVING available_base_qty > 0
      ORDER BY ing.name
    `).all(ingredientId) as {
      ingredient_id: string;
      ingredient_name: string;
      category_id: number;
      default_unit_id: number | null;
      category_name: string;
      nutrient_type_id: number | null;
      available_base_qty: number;
    }[];

    const suggestions: SubstitutionSuggestion[] = [];

    for (const row of candidates) {
      let matchLevel: 'same_category' | 'same_nutrient_type' | null = null;

      if (source.category_id && row.category_id === source.category_id) {
        matchLevel = 'same_category';
      } else if (source.nutrient_type_id && row.nutrient_type_id === source.nutrient_type_id) {
        matchLevel = 'same_nutrient_type';
      }

      if (matchLevel) {
        suggestions.push({
          ingredient: {
            id: row.ingredient_id,
            name: row.ingredient_name,
            categoryId: row.category_id,
            defaultUnitId: row.default_unit_id ?? undefined,
          },
          availableQuantityBase: row.available_base_qty,
          matchLevel,
          categoryName: row.category_name,
        });
      }
    }

    // Sort: same_category first, then same_nutrient_type, then alphabetically
    suggestions.sort((a, b) => {
      if (a.matchLevel !== b.matchLevel) {
        return a.matchLevel === 'same_category' ? -1 : 1;
      }
      return a.ingredient.name.localeCompare(b.ingredient.name);
    });

    return suggestions;
  }
}

export const substitutionService = new SubstitutionService();
