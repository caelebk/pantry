import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { TranslocoModule } from "@jsverse/transloco";

export type InventoryTab = "items" | "groups";

@Component({
    selector: "pantry-tab-navigation",
    standalone: true,
    imports: [CommonModule, TranslocoModule],
    templateUrl: "./tab-navigation.component.html",
    styleUrl: "./tab-navigation.component.css",
})
export class TabNavigationComponent {
    @Input()
    activeTab: InventoryTab = "items";
    @Output()
    tabChange = new EventEmitter<InventoryTab>();

    onTabClick(tab: InventoryTab): void {
        this.tabChange.emit(tab);
    }
}
