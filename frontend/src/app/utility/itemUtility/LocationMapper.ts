import { Location, LocationDTO } from '@models/location.model';

export function mapLocationDTOToLocation(dto: LocationDTO): Location {
  return {
    id: dto.id,
    name: dto.name,
  };
}
