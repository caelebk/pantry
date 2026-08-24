import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { SelectModule } from 'primeng/select';

let nextPaginationId = 0;

@Component({
  selector: 'pantry-data-table-pagination',
  standalone: true,
  imports: [FormsModule, SelectModule, TranslocoModule],
  template: `
    <div
      class="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-surface-50 dark:bg-surface-800/40 rounded-2xl border border-surface-200/80 dark:border-surface-700/60 text-xs font-semibold text-surface-600 dark:text-surface-300 select-none">
      <!-- Showing Count Summary -->
      <div class="flex items-center gap-2" data-testid="pagination-summary">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>
          {{
            'pagination.showingSummary'
              | transloco
                : {
                    from: totalItems() === 0 ? 0 : startIndex() + 1,
                    to: endIndex(),
                    total: totalItems(),
                    label: itemLabel(),
                  }
          }}
        </span>
      </div>

      <!-- Page Navigation Controls -->
      <div class="flex flex-wrap items-center gap-3">
        <!-- Rows Per Page Selector -->
        <div class="flex items-center gap-1.5 text-xs">
          <label [for]="inputId" class="text-surface-500 font-medium hidden md:inline">
            {{ 'pagination.perPageLabel' | transloco }}
          </label>
          <p-select
            [inputId]="inputId"
            [ngModel]="pageSize()"
            (ngModelChange)="onPageSizeChange($event)"
            [options]="pageSizeOptions()"
            appendTo="body"
            [ariaLabel]="'pagination.perPageAria' | transloco: { label: itemLabel() }"
            styleClass="text-xs font-bold">
          </p-select>
        </div>

        <!-- Page Number Navigation Buttons -->
        <div class="flex items-center gap-1">
          <!-- First Page -->
          <button
            type="button"
            (click)="goToPage(1)"
            [disabled]="currentPage() === 1"
            class="btn-icon-sm"
            aria-label="First Page"
            title="First Page">
            <i class="pi pi-angle-double-left text-xs"></i>
          </button>

          <!-- Prev Page -->
          <button
            type="button"
            (click)="goToPage(currentPage() - 1)"
            [disabled]="currentPage() === 1"
            class="btn-icon-sm"
            aria-label="Previous Page"
            title="Previous Page">
            <i class="pi pi-angle-left text-xs"></i>
          </button>

          <!-- Page Numbers -->
          @for (page of visiblePages(); track page) {
            <button
              type="button"
              data-testid="page-number"
              (click)="goToPage(page)"
              [class.bg-primary-600]="currentPage() === page"
              [class.text-white]="currentPage() === page"
              [class.font-bold]="currentPage() === page"
              [class.shadow-xs]="currentPage() === page"
              [class.bg-surface-100]="currentPage() !== page"
              [class.dark:bg-surface-800]="currentPage() !== page"
              [class.text-surface-700]="currentPage() !== page"
              [class.dark:text-surface-300]="currentPage() !== page"
              class="w-8 h-8 rounded-lg flex items-center justify-center text-xs border border-surface-200/60 dark:border-surface-700/60 hover:border-primary-500/50 transition-all cursor-pointer">
              {{ page }}
            </button>
          }

          <!-- Next Page -->
          <button
            type="button"
            (click)="goToPage(currentPage() + 1)"
            [disabled]="currentPage() >= totalPages()"
            class="btn-icon-sm"
            aria-label="Next Page"
            title="Next Page">
            <i class="pi pi-angle-right text-xs"></i>
          </button>

          <!-- Last Page -->
          <button
            type="button"
            (click)="goToPage(totalPages())"
            [disabled]="currentPage() >= totalPages()"
            class="btn-icon-sm"
            aria-label="Last Page"
            title="Last Page">
            <i class="pi pi-angle-double-right text-xs"></i>
          </button>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTablePaginationComponent {
  public readonly inputId = `pagination-page-size-${++nextPaginationId}`;

  public totalItems = input.required<number>();
  public currentPage = model<number>(1);
  public pageSize = model<number>(15);
  public pageSizeOptions = input<number[]>([10, 15, 25, 50]);
  public itemLabel = input<string>('items');

  public pageChange = output<number>();
  public pageSizeChange = output<number>();

  public totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()) || 1);

  public startIndex = computed(() => (this.currentPage() - 1) * this.pageSize());

  public endIndex = computed(() =>
    Math.min(this.startIndex() + this.pageSize(), this.totalItems()),
  );

  public visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    let start = Math.max(1, current - 2);
    const end = Math.min(total, start + 4);
    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  });

  public goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.currentPage()) {
      this.currentPage.set(page);
      this.pageChange.emit(page);
    }
  }

  public onPageSizeChange(size: number | string): void {
    const newSize = Number(size);
    if (newSize === this.pageSize()) {
      return;
    }
    this.pageSize.set(newSize);
    this.currentPage.set(1);
    this.pageSizeChange.emit(newSize);
  }
}
