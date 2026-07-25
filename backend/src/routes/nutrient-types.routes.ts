import { Context, Hono } from 'hono';
import { NutrientTypeMessages } from '../messages/nutrient-type.messages.ts';
import { nutrientTypeService } from '../services/nutrient-type.service.ts';
import { errorResponse, HttpStatusCode, successResponse } from '../utils/response.ts';
import { isPositiveNumber } from '../utils/validators.ts';

const nutrientTypes = new Hono();

/**
 * GET /api/nutrient-types
 * @summary Get all nutrient types
 */
nutrientTypes.get('/', async (c: Context) => {
  try {
    const types = await nutrientTypeService.getAllNutrientTypes();
    return c.json(successResponse(types), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(
      errorResponse(NutrientTypeMessages.DB_RETRIEVE_NUTRIENT_TYPES_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

/**
 * GET /api/nutrient-types/:id
 * @summary Get a nutrient type by ID
 */
nutrientTypes.get('/:id', async (c: Context) => {
  try {
    const id = c.req.param('id');
    const numericId = Number(id);
    if (!isPositiveNumber(numericId)) {
      return c.json(errorResponse(NutrientTypeMessages.INVALID_ID), HttpStatusCode.BAD_REQUEST);
    }
    const type = await nutrientTypeService.getNutrientTypeById(numericId);
    if (!type) {
      return c.json(errorResponse(NutrientTypeMessages.NOT_FOUND), HttpStatusCode.NOT_FOUND);
    }
    return c.json(successResponse(type), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(
      errorResponse(NutrientTypeMessages.DB_RETRIEVE_NUTRIENT_TYPE_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

export default nutrientTypes;
