# Default Measurement Unit & Stock Reconciliation Specification

## Overview
Measurement units are consolidated at the **Ingredient** (Tier 3) level. Each catalog `Ingredient` defines a canonical `defaultUnit`. Physical stock `Ingredient Items` (Tier 4) automatically inherit and lock to their parent `Ingredient`'s default unit to ensure inventory consistency across recipes, stock tracking, and shopping restocks.

---

## Functional Requirements

### 1. Mandatory Ingredient Default Unit
- **Creation Requirement**: Creating an `Ingredient` (Tier 3) requires a valid `defaultUnit`.
- **Master Reference**: The default unit serves as the canonical measurement unit for all physical stock instances linked to that ingredient.

### 2. Automatic Unit Inheritance & Locking
- **Form Auto-Population**: Selecting an `Ingredient` on the `Ingredient Item` form automatically populates the `unit` field with the ingredient's `defaultUnit`.
- **Read-Only Lock**: The `unit` field is disabled and locked to prevent manual unit divergence.
- **Backend Resolution**: `IngredientItemService.createIngredientItem` automatically derives `unit_id` from `ingredients.default_unit_id` when `ingredientId` is provided.

### 3. Unit Modification & Stock Reconciliation Workflow
Modifying an existing `Ingredient`'s default unit handles linked physical stock through an automated reconciliation flow:

- **No Linked Stock**: If 0 physical `Ingredient Items` are tied to the ingredient, the default unit updates immediately.
- **Linked Stock Exists**: If tied physical stock items exist, updating the default unit navigates the user to the **Unit Reconciliation Page** (`/inventory/ingredients/:id/unit-reconciliation?targetUnitId=<newUnitId>`).
- **Reconciliation Interface**:
  - Displays all physical stock items linked to the ingredient.
  - Automatically calculates smart quantity suggestions for compatible unit types (e.g. converting `2 kg` to `grams` suggests `2000 g`).
  - Supports manual quantity adjustments prior to submission.
  - Atomically updates `ingredients.default_unit_id` and all associated `ingredient_items` unit IDs & quantities within a single SQLite database transaction.

---

## API Specs

### `GET /api/ingredients/:id/items`
- **Description**: Returns all physical `Ingredient Items` linked to the specified ingredient ID.
- **Response**: Array of `IngredientItemDTO` objects.

### `POST /api/ingredients/:id/reconcile-units`
- **Description**: Atomically updates the ingredient's default unit and all tied physical item stock quantities.
- **Request Body**:
  ```json
  {
    "newDefaultUnitId": 2,
    "items": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "quantity": 2000
      }
    ]
  }
  ```
- **Response**: Updated `IngredientDTO`.
