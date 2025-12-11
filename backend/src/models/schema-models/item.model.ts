/**
 * Item Database Schema
 */
export interface ItemRow {
  id: string; // UUID
  ingredient_id: string | null;
  label: string;
  quantity: number;
  unit_id: number;
  location_id: number;
  expiration_date: Date;
  opened_date: Date | null;
  purchase_date: Date;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}
