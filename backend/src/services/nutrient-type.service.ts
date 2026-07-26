import { nutrientGroupService } from './nutrient-group.service.ts';

export class NutrientTypeService {
  async getAllNutrientTypes() {
    return await nutrientGroupService.getAllNutrientGroups();
  }

  async getNutrientTypeById(id: number) {
    return await nutrientGroupService.getNutrientGroupById(id);
  }
}

export const nutrientTypeService = new NutrientTypeService();
