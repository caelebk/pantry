import { Item, ItemTimeStatus } from '@models/items.model';

export function isExpired(item: Item): boolean {
  return item.expirationDate <= new Date();
}

export function isExpiringSoon(item: Item, days = 14): boolean {
  const currentDate = new Date();
  const thresholdDate = new Date();
  thresholdDate.setDate(currentDate.getDate() + days);

  const expirationDate = new Date(item.expirationDate);
  return expirationDate > currentDate && expirationDate <= thresholdDate;
}

export function itemProgress(item: Item): number {
  const startDate = new Date(item.purchaseDate);
  const currentDate = new Date();
  const endDate = new Date(item.expirationDate);
  const progressPercentage =
    ((currentDate.getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime())) *
    100;
  return progressPercentage;
}

export function sortItemsByExpirationDate(items: Item[]): Item[] {
  return items.sort(
    (a: Item, b: Item) => a.expirationDate?.getTime() - b.expirationDate?.getTime(),
  );
}

export function getTimeDifferenceString(date1: Date, date2: Date): string {
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());

  const diffMs = d2.getTime() - d1.getTime();
  const absDiffDays = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
  const isExpired = diffMs < 0;
  const daysInAYear = 365;
  const daysInAMonth = 30;

  if (absDiffDays === 0) {
    return isExpired ? 'Expired today' : 'Today';
  }

  let result: string;
  if (absDiffDays >= daysInAYear) {
    const years = Math.floor(absDiffDays / daysInAYear);
    result = `${years} year${years > 1 ? 's' : ''}`;
  } else if (absDiffDays >= daysInAMonth) {
    const months = Math.floor(absDiffDays / daysInAMonth);
    result = `${months} month${months > 1 ? 's' : ''}`;
  } else {
    result = `${absDiffDays} day${absDiffDays !== 1 ? 's' : ''}`;
  }

  return isExpired ? `${result} expired` : `${result} left`;
}

export function getItemTimeStatus(item: Item): ItemTimeStatus {
  const now = new Date();
  const expirationDate = new Date(item.expirationDate);
  const diffMs = expirationDate.getTime() - now.getTime();

  const label = getTimeDifferenceString(now, expirationDate);
  const isExpired = diffMs < 0;
  // Assuming "close" is within 14 days (matching isExpiringSoon utility default)
  const isClose = !isExpired && diffMs <= 1209600000;

  return { label, isExpired, isClose };
}
