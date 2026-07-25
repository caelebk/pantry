import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { Item } from '@models/items.model';
import { Location } from '@models/location.model';

export interface LocationStat {
  location: Location;
  count: number;
  percentage: number;
  icon: string;
  colorClass: string;
}

@Component({
  selector: 'pantry-location-overview-container',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './location-overview-container.component.html',
  host: { class: 'block' },
})
export class LocationOverviewContainerComponent {
  items = input.required<Item[]>();
  locations = input<Location[]>([]);

  locationStats = computed<LocationStat[]>(() => {
    const allItems = this.items();
    const totalCount = allItems.length || 1;
    const locMap = new Map<number, { location: Location; count: number }>();

    for (const item of allItems) {
      if (item.location) {
        const existing = locMap.get(item.location.id);
        if (existing) {
          existing.count++;
        } else {
          locMap.set(item.location.id, { location: item.location, count: 1 });
        }
      }
    }

    const stats: LocationStat[] = [];
    locMap.forEach((val) => {
      const percentage = Math.round((val.count / totalCount) * 100);
      const icon = this.getLocationIcon(val.location.name);
      const colorClass = this.getLocationColor(val.location.name);
      stats.push({
        location: val.location,
        count: val.count,
        percentage,
        icon,
        colorClass,
      });
    });

    return stats.sort((a, b) => b.count - a.count);
  });

  private getLocationIcon(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('fridge') || lower.includes('refrigerator')) return 'pi pi-compass';
    if (lower.includes('freezer')) return 'pi pi-cloud';
    if (lower.includes('pantry') || lower.includes('cabinet')) return 'pi pi-box';
    if (lower.includes('spice') || lower.includes('rack')) return 'pi pi-tags';
    return 'pi pi-building';
  }

  private getLocationColor(name: string): string {
    return 'bg-primary-500';
  }
}
