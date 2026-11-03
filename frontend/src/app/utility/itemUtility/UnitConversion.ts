import { Unit, UnitType } from '@models/unit.model';

/**
 * Converts a quantity between two units of the same measurable type.
 * Returns null when the units cannot be converted (missing unit, different types, Count units).
 */
export function convertQuantity(
  quantity: number,
  from?: Unit | null,
  to?: Unit | null,
): number | null {
  if (!from || !to) return null;
  if (from.id === to.id) return quantity;
  if (from.type !== to.type || from.type === UnitType.Count) return null;
  if (!from.toBaseFactor || !to.toBaseFactor) return null;
  return (quantity * from.toBaseFactor) / to.toBaseFactor;
}
