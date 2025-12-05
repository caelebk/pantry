import { Item } from "../models/items.model";

export function isExpired(item: Item): boolean {
    return new Date() > new Date(item.bestBeforeDate);
}

export function isExpiringSoon(item: Item): boolean {
    return false;
}

export function itemProgress(item: Item): number {
    const startDate = new Date(item.purchaseDate);
    const currentDate = new Date();
    const endDate = new Date(item.bestBeforeDate);
    const progressPercentage = (currentDate.getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime()) * 100;
    return progressPercentage;
}

export function sortItemsByBestBeforeDate(items: Item[]): Item[] {
    return items.sort((a: Item, b: Item) => a.bestBeforeDate?.getTime() - b.bestBeforeDate?.getTime());
}

export function getTimeDifferenceString(date1: Date, date2: Date): string {
    const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());

    const diffMs = d2.getTime() - d1.getTime();
    const absDiffDays = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
    const isExpired = diffMs < 0;

    if (absDiffDays === 0) {
        return "today";
    }

    let result: string;
    if (absDiffDays >= 365) {
        const years = Math.floor(absDiffDays / 365);
        result = `${years} year${years > 1 ? 's' : ''}`;
    } else if (absDiffDays >= 30) {
        const months = Math.floor(absDiffDays / 30);
        result = `${months} month${months > 1 ? 's' : ''}`;
    } else {
        result = `${absDiffDays} day${absDiffDays !== 1 ? 's' : ''}`;
    }

    return isExpired ? `${result} expired` : result;
}
