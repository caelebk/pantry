import { ingredientItemService } from './ingredient-item.service.ts';
import {
  CreateIngredientItemDTO,
  UpdateIngredientItemDTO,
} from '../models/data-models/ingredient-item.model.ts';

export class ItemService {
  async getAllItems(kitchenId: string) {
    return await ingredientItemService.getAllIngredientItems(kitchenId);
  }

  async getItemById(id: string, kitchenId: string) {
    return await ingredientItemService.getIngredientItemById(id, kitchenId);
  }

  async createItem(data: CreateIngredientItemDTO, kitchenId: string, userId: string) {
    return await ingredientItemService.createIngredientItem(data, kitchenId, userId);
  }

  async updateItem(id: string, kitchenId: string, data: UpdateIngredientItemDTO, userId: string) {
    return await ingredientItemService.updateIngredientItem(id, kitchenId, data, userId);
  }

  async deleteItemById(id: string, kitchenId: string) {
    return await ingredientItemService.deleteIngredientItemById(id, kitchenId);
  }

  async bulkClearStock(ids: string[], kitchenId: string) {
    return await ingredientItemService.bulkClearStock(ids, kitchenId);
  }

  async bulkDeleteItems(ids: string[], kitchenId: string) {
    return await ingredientItemService.bulkDeleteIngredientItems(ids, kitchenId);
  }

  async findExpiringSoon(kitchenId: string, days?: number) {
    return await ingredientItemService.findExpiringSoon(kitchenId, days);
  }

  async findSimilarItems(queryName: string, kitchenId: string, minScore?: number) {
    return await ingredientItemService.findSimilarItems(kitchenId, queryName, minScore);
  }
}

export const itemService = new ItemService();
