import { ingredientGroupService } from './ingredient-group.service.ts';

export class CategoryService {
  async getAllCategories() {
    return await ingredientGroupService.getAllIngredientGroups();
  }

  async getCategoryById(id: number) {
    return await ingredientGroupService.getIngredientGroupById(id);
  }
}

export const categoryService = new CategoryService();
