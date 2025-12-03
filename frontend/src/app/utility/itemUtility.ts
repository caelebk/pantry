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