import { Injectable } from '@angular/core';
import { IngredientGroup } from '@models/ingredient-group.model';

interface CatalogView {
  search: string;
  fromGroups?: boolean;
  queryKey?: string;
  group: IngredientGroup | null;
  status: 'all' | 'in-stock' | 'out-of-stock';
  sort: 'name' | 'group' | 'unit' | 'status';
  direction: 'asc' | 'desc';
  page: number;
  pageSize: number;
  scrollTop: number;
}

/** Retains navigation context per kitchen for the lifetime of the app session. */
@Injectable({ providedIn: 'root' })
export class IngredientCatalogStateService {
  readonly views = new Map<string, CatalogView>();
}
