import { Context, Hono } from 'hono';
import { CreateStoreDTO, UpdateStoreDTO } from '../models/data-models/store.model.ts';
import { storeService } from '../services/store.service.ts';
import { authMiddleware } from '../middleware/auth.ts';
import { requireEditorForMutations } from '../middleware/rbac.ts';
import { errorResponse, HttpStatusCode, successResponse } from '../utils/response.ts';

const stores = new Hono();
stores.use('*', authMiddleware);
stores.use('*', requireEditorForMutations);

stores.get('/', async (c: Context) => {
  const kitchenId = c.get('activeKitchenId') || '';
  return c.json(successResponse(await storeService.list(kitchenId)), HttpStatusCode.OK);
});

stores.post('/', async (c: Context) => {
  try {
    const body = await c.req.json<CreateStoreDTO>();
    if (!body?.name?.trim()) {
      return c.json(errorResponse('Store name is required'), HttpStatusCode.BAD_REQUEST);
    }
    return c.json(
      successResponse(await storeService.create(body, c.get('activeKitchenId') || '')),
      HttpStatusCode.CREATED,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create store';
    return c.json(
      errorResponse(message),
      message.includes('UNIQUE') ? HttpStatusCode.CONFLICT : HttpStatusCode.BAD_REQUEST,
    );
  }
});

stores.put('/:id', async (c: Context) => {
  try {
    const updated = await storeService.update(
      c.req.param('id')!,
      await c.req.json<UpdateStoreDTO>(),
      c.get('activeKitchenId') || '',
    );
    return updated
      ? c.json(successResponse(updated), HttpStatusCode.OK)
      : c.json(errorResponse('Store not found'), HttpStatusCode.NOT_FOUND);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update store';
    return c.json(
      errorResponse(message),
      message.includes('UNIQUE') ? HttpStatusCode.CONFLICT : HttpStatusCode.BAD_REQUEST,
    );
  }
});

export default stores;
