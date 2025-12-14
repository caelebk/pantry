import { Item, ItemDTO, UpdateItemDTO } from "@models/items.model";
import { Location } from "@models/location.model";
import { Unit } from "@models/unit.model";
import _ from "lodash";

export function mapItemDTOToItem(
    itemDTO: ItemDTO,
    unitMap: Map<number, Unit>,
    locationMap: Map<number, Location>,
): Item {
    const unit = unitMap.get(itemDTO.unitId);
    const location = locationMap.get(itemDTO.locationId);

    if (!unit) {
        throw new Error(
            `Unit with ID ${itemDTO.unitId} not found for item ${itemDTO.id}`,
        );
    }
    if (!location) {
        throw new Error(
            `Location with ID ${itemDTO.locationId} not found for item ${itemDTO.id}`,
        );
    }

    return {
        id: itemDTO.id.toString(),
        ingredientId: itemDTO.ingredientId,
        name: itemDTO.label,
        quantity: itemDTO.quantity,
        unit: unit,
        purchaseDate: new Date(itemDTO.purchaseDate),
        openedDate: itemDTO.openedDate
            ? new Date(itemDTO.openedDate)
            : undefined,
        expirationDate: new Date(itemDTO.expirationDate),
        location: location,
        notes: itemDTO.notes || "",
    };
}

export function mapItemToItemDTO(item: Item): ItemDTO {
    return {
        id: item.id,
        ingredientId: item.ingredientId,
        label: item.name,
        quantity: item.quantity,
        unitId: item.unit.id,
        locationId: item.location.id,
        purchaseDate: item.purchaseDate.toISOString(),
        openedDate: item.openedDate?.toISOString(),
        expirationDate: item.expirationDate.toISOString(),
        notes: item.notes,
    };
}

export function mapItemToUpdateItemDTO(item: Item): UpdateItemDTO {
    return {
        label: item.name,
        ingredientId: _.isEmpty(item.ingredientId) ? undefined : item.ingredientId,
        quantity: Number(item.quantity),
        unitId: item.unit.id,
        purchaseDate: item.purchaseDate.toISOString(),
        openedDate: item.openedDate?.toISOString(),
        expirationDate: item.expirationDate.toISOString(),
        locationId: item.location.id,
        notes: _.isEmpty(item.notes) ? undefined : item.notes,
    };
}
