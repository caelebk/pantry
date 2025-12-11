import { Context, Hono } from 'hono';
import { UnitMessages } from '../messages/unit.messages.ts';
import { unitService } from '../services/units.service.ts';
import { errorResponse, HttpStatusCode, successResponse } from '../utils/response.ts';
import { isPositiveNumber } from '../utils/validators.ts';

const units = new Hono();

/**
 * GET /api/units
 * @summary Get all units
 */
units.get('/', async (c: Context) => {
  try {
    const units = await unitService.getAllUnits();
    return c.json(successResponse(units), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(
      errorResponse(UnitMessages.DB_RETRIEVE_UNITS_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

/**
 * GET /api/units/convert
 * @summary Convert quantity from one unit to another
 * @param {string} quantity.query.required - Quantity to convert
 * @param {string} from.query.required - Source unit ID
 * @param {string} to.query.required - Target unit ID
 */
units.get('/convert', async (c: Context) => {
  const quantity = Number(c.req.query('quantity'));
  const fromId = Number(c.req.query('from'));
  const toId = Number(c.req.query('to'));

  if (!isPositiveNumber(quantity) || !isPositiveNumber(fromId) || !isPositiveNumber(toId)) {
    return c.json(errorResponse(UnitMessages.INVALID_BODY), HttpStatusCode.BAD_REQUEST);
  }

  try {
    const result = await unitService.convert(quantity, fromId, toId);
    return c.json(successResponse({ quantity: result }), HttpStatusCode.OK);
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      (error.message === UnitMessages.NOT_FOUND ||
        error.message === UnitMessages.INVALID_CONVERSION_TYPE)
    ) {
      return c.json(errorResponse(error.message), HttpStatusCode.BAD_REQUEST);
    }
    return c.json(errorResponse('Conversion Failed'), HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
});

/**
 * GET /api/units/:id
 * @summary Get unit by ID
 */
units.get('/:id', async (c: Context) => {
  try {
    const id = Number(c.req.param('id'));
    if (!isPositiveNumber(id)) {
      return c.json(errorResponse(UnitMessages.INVALID_ID), HttpStatusCode.BAD_REQUEST);
    }

    const unit = await unitService.getUnitById(id);
    if (!unit) {
      return c.json(errorResponse(UnitMessages.NOT_FOUND), HttpStatusCode.NOT_FOUND);
    }

    return c.json(successResponse(unit), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(
      errorResponse(UnitMessages.DB_RETRIEVE_UNIT_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

export default units;
