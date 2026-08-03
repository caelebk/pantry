# Smart Restock Item Detection & Matching Specification

## Overview
When restocking items from the Shopping List page, the system checks whether matching or similar items already exist in the Pantry inventory. Users can merge restocking quantities into existing pantry stock or create distinct inventory entries.

---

## Functional Requirements

### 1. Backend Similarity API
- **Endpoint:** `GET /api/ingredient-items/similarity`
- **Query Parameters:**
  - `name` (string, required): Ingredient name to query.
  - `threshold` or `minScore` (number, optional, default: `0.45`): Minimum similarity score threshold (0.0 to 1.0).
- **Matching Algorithm (`backend/src/utils/similarity.ts`):**
  - Evaluates normalized token Jaccard similarity, character bi-gram Dice coefficient, and substring containment.
  - Returns ONLY candidate items with similarity `score >= threshold`, sorted descending by score.
  - Categorizes candidates by `tier`:
    - `exact` (`score >= 0.99`)
    - `similar` (`score >= 0.45` and `< 0.99`)

### 2. Frontend Restock Workflow (`/shopping-list/restock`)
- **Backend Delegation:** 100% of similarity calculations and candidate filtering are performed by the Backend API (`ItemService.getSimilarIngredientItems(name, 0.45)`).
- **Action Modes:**
  - `Update Existing Stock`: Merges restocking quantity with existing pantry stock (`newQty = existingQty + draftQty`) and updates location/expiration date.
  - `Create New Entry`: Creates a separate `IngredientItem` record.
- **UI Behavior:**
  - `[ 🔄 Update Existing Stock ]` button is enabled when the Backend API returns ≥ 1 candidate matches for the item name.
  - When `Update Existing Stock` is active:
    - Candidate selector dropdown appears if multiple matching items exist.
    - Merged quantity preview pill displays `Current Stock + Restock Quantity = New Total`.
  - `[ ➕ Create New Entry ]` is defaulted when 0 candidates are returned by Backend API, or when selected by the user.
  - Editing the ingredient name input field dynamically re-queries the Backend API.

---

## API Response Schema

```json
{
  "success": true,
  "data": [
    {
      "item": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "label": "Olive Oil (Extra Virgin)",
        "quantity": 2,
        "unitId": 1,
        "locationId": 1,
        "expirationDate": "2026-08-20T00:00:00.000Z",
        "purchaseDate": "2026-08-01T00:00:00.000Z"
      },
      "score": 0.85,
      "tier": "similar"
    }
  ]
}
```
