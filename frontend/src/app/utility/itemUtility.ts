import { Item } from "../models/items.model";

export function isExpired(item: Item): boolean {
    return new Date() > new Date(item.bestBefore);
}

export function isExpiringSoon(item: Item): boolean {
    return false;
}