import { ingredientItemService } from './ingredient-item.service.ts';
import {
  CreateIngredientItemDTO,
  UpdateIngredientItemDTO,
} from '../models/data-models/ingredient-item.model.ts';

export class ItemService {
  async getAllItems() {
    return await ingredientItemService.getAllIngredientItems();
  }

  async getItemById(id: string) {
    return await ingredientItemService.getIngredientItemById(id);
  }

  async createItem(data: CreateIngredientItemDTO) {
    return await ingredientItemService.createIngredientItem(data);
  }

  async updateItem(id: string, data: UpdateIngredientItemDTO) {
    return await ingredientItemService.updateIngredientItem(id, data);
  }

  async deleteItemById(id: string) {
    return await ingredientItemService.deleteIngredientItemById(id);
  }

  async bulkClearStock(ids: string[]) {
    return await ingredientItemService.bulkClearStock(ids);
  }

  async bulkDeleteItems(ids: string[]) {
    return await ingredientItemService.bulkDeleteIngredientItems(ids);
  }

  async findExpiringSoon(days?: number) {
    return await ingredientItemService.findExpiringSoon(days);
  }

  async findSimilarItems(queryName: string, minScore?: number) {
    return await ingredientItemService.findSimilarItems(queryName, minScore);
  }
}

export const itemService = new ItemService();
