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

    let fromDate: Date;
    let toDate: Date;
    let suffix: string;

    if (d1.getTime() <= d2.getTime()) {
        fromDate = d1;
        toDate = d2;
        suffix = "left";
    } else {
        fromDate = d2;
        toDate = d1;
        suffix = "overdue";
    }

    let years = 0;
    let months = 0;
    let days = 0;

    // Calculate years
    while (fromDate.getFullYear() < toDate.getFullYear() ||
           (fromDate.getFullYear() === toDate.getFullYear() && fromDate.getMonth() < toDate.getMonth()) ||
           (fromDate.getFullYear() === toDate.getFullYear() && fromDate.getMonth() === toDate.getMonth() && fromDate.getDate() < toDate.getDate())) {
        
        const nextYearDate = new Date(fromDate.getFullYear() + 1, fromDate.getMonth(), fromDate.getDate());
        // Handle leap years and month-end dates (e.g., Jan 31 + 1 year should be Jan 31 of next year, not Feb 28)
        if (nextYearDate.getMonth() !== fromDate.getMonth()) { // If month rolled over (e.g., Feb 29 to Mar 1)
            nextYearDate.setDate(0); // Go to last day of Feb
        }

        if (nextYearDate.getTime() <= toDate.getTime()) {
            years++;
            fromDate = nextYearDate;
        } else {
            break;
        }
    }

    // Calculate months
    while (fromDate.getFullYear() < toDate.getFullYear() ||
           (fromDate.getFullYear() === toDate.getFullYear() && fromDate.getMonth() < toDate.getMonth()) ||
           (fromDate.getFullYear() === toDate.getFullYear() && fromDate.getMonth() === toDate.getMonth() && fromDate.getDate() < toDate.getDate())) {
        
        const nextMonthDate = new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, fromDate.getDate());
        // Handle month-end dates (e.g., Jan 31 + 1 month should be Feb 28/29, not Mar 2/3)
        if (nextMonthDate.getDate() !== fromDate.getDate()) {
            nextMonthDate.setDate(0); // Go to last day of previous month for current month
        }

        if (nextMonthDate.getTime() <= toDate.getTime()) {
            months++;
            fromDate = nextMonthDate;
        } else {
            break;
        }
    }

    // Calculate days
    days = Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));

    const parts: string[] = [];
    if (years > 0) {
        parts.push(`${years} year${years > 1 ? 's' : ''}`);
    }
    if (months > 0) {
        parts.push(`${months} month${months > 1 ? 's' : ''}`);
    }
    if (days > 0) {
        parts.push(`${days} day${days > 1 ? 's' : ''}`);
    }

    if (parts.length === 0) {
        return `0 days ${suffix}`;
    }

    return `${parts.join(' ')} ${suffix}`;
}
