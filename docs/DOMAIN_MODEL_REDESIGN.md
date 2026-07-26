# Domain Model Redesign Specification

## Overview & Domain Hierarchy

This document specifies the core domain model architecture for the Pantry application. The model is structured into a 4-tier hierarchy that decouples abstract recipe ingredients from physical pantry stock while keeping taxonomy groupings clear and intuitive.

```
[ Nutrient Group ]      (High-level nutritional classification: e.g. Protein, Fiber & Produce, Carbs)
       │
       ▼
[ Ingredient Group ]    (Category grouping ingredients: e.g. Bakery, Grains, Pasta, Dairy)
       │
       ▼
[ Ingredient ]          (Abstract ingredient definition: e.g. Spaghetti, Linguine, Gala Apple)
       │
       ├── Referenced by [ Recipe ] & [ Recipe Ingredient ]
       │
       ▼
[ Ingredient Item ]     (Physical stock instance in fridge/pantry with qty, exp date, location)
```

---

## Entity Definitions & Relationships

### 1. Nutrient Group (`NutrientGroup` / `nutrient_groups`)
- **Role**: Top-level macro/micro nutritional classification.
- **Examples**: Protein, Fiber & Produce, Carbohydrates, Healthy Fats, Quick Foods.
- **Fields**: `id`, `name`, `icon`, `color`, `description`.
- **Relationships**: Has many `IngredientGroup`s.

### 2. Ingredient Group (`IngredientGroup` / `ingredient_groups`)
- **Role**: Food category grouping ingredients.
- **Examples**: Bakery, Grains, Pasta, Fresh Produce, Dairy, Spices.
- **Fields**: `id`, `name`, `nutrient_group_id`.
- **Relationships**: Belongs to `NutrientGroup`; Has many `Ingredient`s.

### 3. Ingredient (`Ingredient` / `ingredients`)
- **Role**: The abstract culinary component/catalog item.
- **Examples**: Spaghetti, Linguine, Gala Apple, Whole Milk, Extra Virgin Olive Oil.
- **Fields**: `id`, `name`, `ingredient_group_id`, `default_unit_id`, `created_at`, `updated_at`.
- **Relationships**: Belongs to `IngredientGroup`; Referenced by `RecipeIngredient`s; Groups physical `IngredientItem`s.

### 4. Ingredient Item (`IngredientItem` / `ingredient_items`)
- **Role**: Concrete physical stock instances in fridge, pantry, or freezer.
- **Examples**: "500g Barilla Spaghetti" purchased 2026-07-01, expiring 2026-10-12 in Pantry Shelf B.
- **Fields**: `id`, `ingredient_id`, `label`, `quantity`, `unit_id`, `expiration_date`, `opened_date`, `purchase_date`, `location_id`, `notes`, `created_at`, `updated_at`.
- **Relationships**: Belongs to `Ingredient`.

---

## Recipe Stock & Availability Engine

Recipes reference abstract `Ingredient`s (with required quantities and units). They do NOT reference individual physical items directly.

To determine if a recipe can be prepared:
1. Query active `IngredientItem` records matching each required `Ingredient`.
2. Filter out expired items (`expiration_date < NOW()`).
3. Convert item quantities to base units (via `Unit.to_base_factor`).
4. Sum total available base quantity per `Ingredient`.
5. Compare total available quantity against recipe required base quantity.

---

## REST API Endpoint Mapping

| Domain Entity | Primary Endpoint | Legacy Endpoint Alias |
|---|---|---|
| Nutrient Group | `GET/POST/PUT/DELETE /api/nutrient-groups` | `/api/nutrient-types` |
| Ingredient Group | `GET/POST/PUT/DELETE /api/ingredient-groups` | `/api/categories` |
| Ingredient | `GET/POST/PUT/DELETE /api/ingredients` | `/api/ingredients` |
| Ingredient Item | `GET/POST/PUT/DELETE /api/ingredient-items` | `/api/items` |

---

## Database Migration Strategy (SQLite)

Migration script: `0004_redesign_ingredient_hierarchy.sql`

1. Rename `nutrient_types` → `nutrient_groups`
2. Rename `categories` → `ingredient_groups`
3. Rename column `categories.nutrient_type_id` → `ingredient_groups.nutrient_group_id`
4. Rename column `ingredients.category_id` → `ingredients.ingredient_group_id`
5. Rename `items` → `ingredient_items`
6. Re-create indexes and trigger hooks on updated tables.
