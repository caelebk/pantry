import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, style, animate, transition } from '@angular/animations';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { AddItemFormComponent } from './inventory-components/add-item-form/add-item-form.component';
import { ItemCardComponent } from './inventory-components/item-card/item-card.component';
import { StatCardComponent } from '@components/stat-card/stat-card.component';
import { Item } from '@models/items.model';
import { Unit } from '@models/unit.model';
import { Location } from '@models/location.model';
import { ItemService } from '@services/inventory/item.service';
import { isExpired, sortItemsByBestBeforeDate } from '@utility/itemUtility/ItemUtility';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { Button } from "primeng/button";
import { FormsModule } from '@angular/forms';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { UnitService } from '@services/inventory/unit.service';
import { LocationService } from '@services/inventory/location.service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, TranslocoModule, AddItemFormComponent, ItemCardComponent, StatCardComponent, ConfirmDialogModule, ToastModule, Button, FormsModule, IconField, InputIcon, InputText],
  providers: [ConfirmationService, MessageService],
  templateUrl: './inventory.component.html',
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(20px)' })),
      ]),
    ]),
  ],
})
export class InventoryComponent {
  private readonly removeConfirmationServiceIcon = 'pi pi-exclamation-triangle';
  private readonly successNotificationClass = 'success';
  private readonly errorNotificationClass = 'error';
  private readonly scrollThreshold = 300;
  private readonly scrollLocation = 0;

  public readonly dismissableMask = true;
  public readonly outlinedCancelButton = true;

  public totalItemsCount: number = 0;
  public expiringSoonItemsCount: number = 0;
  public expiredItemsCount: number = 0;
  public items: Item[] = [];
  public units: Unit[] = [];
  public locations: Location[] = [];
  
  public showScrollTopButton: boolean = false;
  public searchQuery: string = '';

  public get filteredItems(): Item[] {
    return this.items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchesSearch;
    });
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.showScrollTopButton = window.scrollY > this.scrollThreshold;
  }

  public scrollToTop(): void {
    window.scrollTo({ top: this.scrollLocation, behavior: 'smooth' });
  }

  constructor(
    private inventoryService: ItemService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private translocoService: TranslocoService,
    private unitService: UnitService,
    private locationService: LocationService,
  ) { }

  ngOnInit(): void {
    this.initParameters();
  }

  private initParameters(): void {
    this.inventoryService.getItems().subscribe((items) => {
      this.items = sortItemsByBestBeforeDate(items);
      this.totalItemsCount = this.items.length;
      this.expiringSoonItemsCount = 0;
      this.expiredItemsCount = this.items.filter((item: Item) => isExpired(item)).length;
    });
    this.unitService.getUnits().subscribe((units) => {
      this.units = units;
    });
    this.locationService.getLocations().subscribe((locations) => {
      this.locations = locations;
    });
  }

  public onAddItem(item: Item): void {
    this.inventoryService.addItem(item).subscribe(() => {
      this.initParameters();
    });
    this.messageService.add({
      severity: this.successNotificationClass,
      summary: this.translocoService.translate('inventory.notificationService.itemAddedHeader') + item.name,
      detail: this.translocoService.translate('inventory.notificationService.itemAddedDescription'),
    });
  }

  public onDeleteItem(item: Item): void {
    this.confirmationService.confirm({
      header: this.translocoService.translate('inventory.removeConfirmationService.header'),
      message: this.translocoService.translate('inventory.removeConfirmationService.message'),
      icon: this.removeConfirmationServiceIcon,
      accept: () => {
        this.inventoryService.removeItem(item);
        this.initParameters();
        this.messageService.add({ 
          severity: this.successNotificationClass,
          summary: this.translocoService.translate('inventory.notificationService.itemRemovalHeader') + item.name,
          detail: this.translocoService.translate('inventory.notificationService.itemRemovalDescription'),
        });
      },
      reject: () => {
        this.messageService.add({ 
          severity: this.errorNotificationClass,
          summary: this.translocoService.translate('inventory.notificationService.itemRemovalFailedHeader') + item.name,
          detail: this.translocoService.translate('inventory.notificationService.itemRemovalFailedCancelledDescription'),
        });
      }
    });
  }

  public onUpdateItem(updatedItem: Item): void {
    this.inventoryService.updateItem(updatedItem).subscribe(() => {
      this.initParameters();
      this.messageService.add({
        severity: this.successNotificationClass,
        summary: this.translocoService.translate('inventory.notificationService.itemUpdatedHeader') + updatedItem.name, 
        detail: this.translocoService.translate('inventory.notificationService.itemUpdatedDescription')
      });
    });
  }
}
