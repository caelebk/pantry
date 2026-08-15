# Shopping List UX and Domain Implementation Plan

## Product decision

Shopping-list rows represent purchase intent for an `Ingredient`. A physical
`IngredientItem` is created or updated only during Restock Review. This keeps
meal-plan sync, duplicate prevention, category derivation, and unit derivation
consistent with the domain model.

## Delivery slices

1. **Domain and API foundation**
   - Add `ingredient_id` to shopping-list rows and enforce one active row per
     ingredient and kitchen.
   - Return canonical ingredient name, category/group path, and default unit.
   - Make manual, meal-plan, and low-stock entry points use one duplicate-aware
     creation path.
   - Add kitchen-scoped stores with normalized names and `store_id` references.

2. **Shared add/edit form**
   - Replace free-text name/category/unit controls with a keyboard-searchable
     ingredient selector.
   - Show category and unit as derived, read-only values.
   - Support quick creation of an ingredient (name, group, default unit) and
     return it selected.
   - Add a searchable, creatable store selector and a Manage Stores path.
   - Reuse the form for `/shopping-list/new` and `/shopping-list/:id/edit`.

3. **Shopping-list interactions**
   - Make the row content an accessible edit target.
   - Add inline quantity and estimated-price editing with validation,
     save/error states, and keyboard commit.
   - Separate bulk selection from the Bought status.
   - Add filter-aware tri-state Select All and a floating toolbar for Mark as
     Bought, Restock to Pantry, and Delete.

4. **Restock integration**
   - Pass selected shopping rows into Restock Review.
   - Update an existing matching IngredientItem or create a new one with the
     linked Ingredient identity.
   - Keep expiration optional and remove only successfully restocked rows.

## Additional UX requirements

- Show duplicate resolution actions instead of silently creating another row.
- Distinguish empty-list and empty-filter states.
- Keep delete accessible on touch and keyboard, with confirmation/undo.
- Show bought progress and source provenance.
- Preserve usable touch targets and dark-mode contrast on narrow layouts.
- Treat a missing estimate differently from an intentional zero price.

## Verification gate

Add backend migration/service/route tests, Angular unit tests, and a Playwright
journey covering add, duplicate resolution, edit, inline updates, selection,
buying, and restocking. Run the documented backend tests plus frontend lint,
build, unit tests, focused E2E, and `git diff --check`.
