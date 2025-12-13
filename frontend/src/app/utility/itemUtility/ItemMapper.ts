import { Item, ItemDTO } from "@models/items.model";
import { Unit } from "@models/unit.model";
import { Location } from "@models/location.model";

export function mapItemDTOToItem(
    itemDTO: ItemDTO,
    unitMap: Map<number, Unit>,
    locationMap: Map<number, Location>
): Item {
    const unit = unitMap.get(itemDTO.unitId);
    const location = locationMap.get(itemDTO.locationId);

    if (!unit) {
        throw new Error(`Unit with ID ${itemDTO.unitId} not found for item ${itemDTO.id}`);
    }
    if (!location) {
        throw new Error(`Location with ID ${itemDTO.locationId} not found for item ${itemDTO.id}`);
    }

    return {
        id: itemDTO.id.toString(),
        ingredientId: itemDTO.ingredientId,
        name: itemDTO.label,
        quantity: itemDTO.quantity,
        unit: unit,
        purchaseDate: new Date(itemDTO.purchaseDate),
        openedDate: itemDTO.openedDate ? new Date(itemDTO.openedDate) : undefined,
        expirationDate: new Date(itemDTO.expirationDate),
        location: location,
        notes: itemDTO.notes || '',
    };
}