import { Item } from "../../models/items.model";

export function isExpired(item: Item): boolean {
    return new Date() > new Date(item.expirationDate);
}

export function isExpiringSoon(item: Item): boolean {
    return false;
}

export function itemProgress(item: Item): number {
    const startDate = new Date(item.purchaseDate);
    const currentDate = new Date();
    const endDate = new Date(item.expirationDate);
    const progressPercentage = (currentDate.getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime()) * 100;
    return progressPercentage;
}

export function sortItemsByBestBeforeDate(items: Item[]): Item[] {
    return items.sort((a: Item, b: Item) => a.expirationDate?.getTime() - b.expirationDate?.getTime());
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
        return "today";
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

    return isExpired ? `${result} expired` : result;
}
