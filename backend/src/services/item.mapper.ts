import { ItemRow } from '../models/schema-models/inventory-schema.model.ts';
import { ItemDTO } from '../models/data-models/item.model.ts';

export function mapItemRowToItem(row: ItemRow): ItemDTO {
  return {
    id: row.id,
    ingredientId: row.ingredient_id ? row.ingredient_id : undefined,
    label: row.label,
    quantity: row.quantity,
    unitId: row.unit_id,
    locationId: row.location_id,
    expirationDate: row.expiration_date,
    openedDate: row.opened_date ? row.opened_date : undefined,
    purchaseDate: row.purchase_date,
    notes: row.notes ? row.notes : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
