import { Item } from '@models/items.model';

export type ExpiryBucket = 'expired' | 'expiring' | 'fresh' | 'undated' | 'empty';

/** Classify recorded positive stock against a single evaluation instant. */
export function expiryBucket(
  item: Pick<Item, 'quantity' | 'expirationDate'>,
  now = Date.now(),
): ExpiryBucket {
  if (!(item.quantity > 0)) return 'empty';
  if (!item.expirationDate) return 'undated';
  const expiry = new Date(item.expirationDate).getTime();
  if (!Number.isFinite(expiry)) return 'undated';
  if (expiry <= now) return 'expired';
  // Match the existing Ingredient Items page's calendar-day window.
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() + 14);
  if (expiry <= cutoff.getTime()) return 'expiring';
  return 'fresh';
}
