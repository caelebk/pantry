import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { AddItemFormComponent } from './inventory-components/add-item-form/add-item-form.component';
import { ItemCardComponent } from './inventory-components/item-card/item-card.component';
import { StatCardComponent } from '../../components/stat-card/stat-card.component';
import { Item } from '../../models/items.model';
import { InventoryService } from '../../services/inventory/inventory.service';
import { isExpired, sortItemsByBestBeforeDate } from '../../utility/itemUtility';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { Button } from "primeng/button";
import { FormsModule } from '@angular/forms';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Category } from '../../models/items.model';
import { CategoryOption } from '../../models/inventory.model';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, TranslocoModule, AddItemFormComponent, ItemCardComponent, StatCardComponent, ConfirmDialogModule, ToastModule, Button, FormsModule, IconField, InputIcon, InputText, Select],
  providers: [ConfirmationService, MessageService],
  templateUrl: './inventory.component.html',
})
export class InventoryComponent {
  private readonly removeConfirmationServiceIcon = 'pi pi-exclamation-triangle';
  private readonly successNotificationClass = 'success';
  private readonly errorNotificationClass = 'error';
  public readonly dismissableMask = true;
  public readonly outlinedCancelButton = true;

  public totalItemsCount: number = 0;
  public expiringSoonItemsCount: number = 0;
  public expiredItemsCount: number = 0;
  public items: Item[] = [];
  
  public searchQuery: string = '';
  public selectedCategory: Category | null = null;
  public categoryOptions: CategoryOption[] = [];

  private confirmationService: ConfirmationService = inject(ConfirmationService);
  private messageService: MessageService = inject(MessageService); 
  private inventoryService: InventoryService = inject(InventoryService);
  private translocoService: TranslocoService = inject(TranslocoService);

  public get filteredItems(): Item[] {
    return this.items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesCategory = this.selectedCategory ? item.category === this.selectedCategory : true;
      return matchesSearch && matchesCategory;
    });
  }

  ngOnInit(): void {
    this.initParameters();
    this.categoryOptions = Object.values(Category).map((c: Category) => ({ label: c, value: c }));
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
