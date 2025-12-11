import { Context, Hono } from 'hono';
import { LocationMessages } from '../messages/location.messages.ts';
import { locationService } from '../services/location.service.ts';
import { errorResponse, HttpStatusCode, successResponse } from '../utils/response.ts';
import { isPositiveNumber } from '../utils/validators.ts';

const locations = new Hono();

/**
 * GET /api/locations
 * @summary Get all locations
 */
locations.get('/', async (c: Context) => {
  try {
    const locations = await locationService.getAllLocations();
    return c.json(successResponse(locations), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(
      errorResponse(LocationMessages.DB_RETRIEVE_LOCATIONS_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

/**
 * GET /api/locations/:id
 * @summary Get location by ID
 */
locations.get('/:id', async (c: Context) => {
  try {
    const id = Number(c.req.param('id'));
    if (!isPositiveNumber(id)) {
      return c.json(errorResponse(LocationMessages.INVALID_ID), HttpStatusCode.BAD_REQUEST);
    }

    const location = await locationService.getLocationById(id);
    if (!location) {
      return c.json(errorResponse(LocationMessages.NOT_FOUND), HttpStatusCode.NOT_FOUND);
    }

    return c.json(successResponse(location), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(
      errorResponse(LocationMessages.DB_RETRIEVE_LOCATION_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

export default locations;
