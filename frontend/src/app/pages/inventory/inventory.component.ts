import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, style, animate, transition } from '@angular/animations';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { AddItemFormComponent } from './inventory-components/add-item-form/add-item-form.component';
import { ItemCardComponent } from './inventory-components/item-card/item-card.component';
import { StatCardComponent } from '../../components/stat-card/stat-card.component';
import { Item } from '../../models/items.model';
import { ItemService } from '../../services/inventory/item.service';
import { isExpired, sortItemsByBestBeforeDate } from '../../utility/itemUtility';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { Button } from "primeng/button";
import { FormsModule } from '@angular/forms';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';

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
  
  public showScrollTopButton: boolean = false;
  public searchQuery: string = '';
  
  private confirmationService: ConfirmationService = inject(ConfirmationService);
  private messageService: MessageService = inject(MessageService); 
  private inventoryService: ItemService = inject(ItemService);
  private translocoService: TranslocoService = inject(TranslocoService);

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

  ngOnInit(): void {
    this.initParameters();
  }

  private initParameters(): void {
    this.items = sortItemsByBestBeforeDate(this.inventoryService.getItems());
    this.totalItemsCount = this.items.length;
    this.expiringSoonItemsCount = 0;
    this.expiredItemsCount = this.items.filter((item: Item) => isExpired(item)).length;
  }

  public onAddItem(item: Item): void {
    this.inventoryService.addItem(item);
    this.initParameters();
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

  public onUpdateItem(originalItem: Item, updatedItem: Item): void {
    this.inventoryService.updateItem(originalItem, updatedItem);
    this.initParameters();
    this.messageService.add({
      severity: this.successNotificationClass,
      summary: this.translocoService.translate('inventory.notificationService.itemUpdatedHeader') + updatedItem.name, 
      detail: this.translocoService.translate('inventory.notificationService.itemUpdatedDescription')
    });
  }
}
