import { Context, Hono } from 'hono';
import { NutrientTypeMessages } from '../messages/nutrient-type.messages.ts';
import { nutrientGroupService } from '../services/nutrient-group.service.ts';
import { errorResponse, HttpStatusCode, successResponse } from '../utils/response.ts';
import { isPositiveNumber } from '../utils/validators.ts';

const nutrientGroups = new Hono();

/**
 * GET /api/nutrient-groups
 */
nutrientGroups.get('/', async (c: Context) => {
  try {
    const groups = await nutrientGroupService.getAllNutrientGroups();
    return c.json(successResponse(groups), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(
      errorResponse(NutrientTypeMessages.DB_RETRIEVE_NUTRIENT_TYPES_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

/**
 * GET /api/nutrient-groups/:id
 */
nutrientGroups.get('/:id', async (c: Context) => {
  try {
    const id = c.req.param('id');
    const numericId = Number(id);
    if (!isPositiveNumber(numericId)) {
      return c.json(errorResponse(NutrientTypeMessages.INVALID_ID), HttpStatusCode.BAD_REQUEST);
    }
    const group = await nutrientGroupService.getNutrientGroupById(numericId);
    if (!group) {
      return c.json(errorResponse(NutrientTypeMessages.NOT_FOUND), HttpStatusCode.NOT_FOUND);
    }
    return c.json(successResponse(group), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(
      errorResponse(NutrientTypeMessages.DB_RETRIEVE_NUTRIENT_TYPE_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

export default nutrientGroups;
