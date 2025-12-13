import { Item, ItemDTO, Unit, Location } from "../../models/items.model";

export function mapItemDTOToItem(
    itemDTO: ItemDTO,
    unitMap: Map<number, string>,
    locationMap: Map<number, string>
): Item {
    const unitName = unitMap.get(itemDTO.unitId);
    const locationName = locationMap.get(itemDTO.locationId);

    // Cast string name to Enum. Ideally valid validation should happen here.
    const unit: Unit = unitName ? (unitName as unknown as Unit) : Unit.Piece;
    const location: Location = locationName ? (locationName as unknown as Location) : Location.Pantry;

    return {
        id: itemDTO.id.toString(),
        ingredientId: itemDTO.ingredientId,
        name: itemDTO.label,
        quantity: itemDTO.quantity,
        unit: unit,
        purchaseDate: new Date(itemDTO.purchaseDate),
        openedDate: itemDTO.openedDate ? new Date(itemDTO.openedDate) : undefined,
        bestBeforeDate: new Date(itemDTO.bestBeforeDate),
        location: location,
        notes: itemDTO.notes || '',
    };
}