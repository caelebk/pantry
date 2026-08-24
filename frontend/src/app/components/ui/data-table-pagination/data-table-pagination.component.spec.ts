import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { DataTablePaginationComponent } from './data-table-pagination.component';

describe('DataTablePaginationComponent', () => {
  let component: DataTablePaginationComponent;
  let fixture: ComponentFixture<DataTablePaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DataTablePaginationComponent,
        TranslocoTestingModule.forRoot({
          langs: {
            en: {
              pagination: {
                perPageLabel: 'Per page:',
                perPageAria: '{{label}} per page',
                showingSummary: 'Showing {{from}} to {{to}} of {{total}} {{label}}',
                firstPage: 'First Page',
                previousPage: 'Previous Page',
                nextPage: 'Next Page',
                lastPage: 'Last Page',
              },
            },
          },
          translocoConfig: { defaultLang: 'en', availableLangs: ['en'] },
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DataTablePaginationComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('totalItems', 47);
    fixture.detectChanges();
  });

  function pageButtons(): HTMLButtonElement[] {
    return fixture.debugElement
      .queryAll(By.css('button'))
      .map((de) => de.nativeElement as HTMLButtonElement)
      .filter((btn) => /^\d+$/.test(btn.textContent?.trim() ?? '') && !btn.disabled);
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute total pages, start index, and end index', () => {
    expect(component.totalPages()).toBe(4);
    expect(component.startIndex()).toBe(0);
    expect(component.endIndex()).toBe(15);

    fixture.componentRef.setInput('currentPage', 4);
    fixture.detectChanges();
    expect(component.endIndex()).toBe(47);
  });

  it('should render the showing summary for the current range', () => {
    const summary = fixture.debugElement.query(By.css('[data-testid="pagination-summary"]'))
      .nativeElement as HTMLElement;
    expect(summary.textContent).toContain('Showing 1 to 15 of 47 items');
  });

  it('should show a zero range when there are no items', () => {
    fixture.componentRef.setInput('totalItems', 0);
    fixture.detectChanges();
    const summary = fixture.debugElement.query(By.css('[data-testid="pagination-summary"]'))
      .nativeElement as HTMLElement;
    expect(summary.textContent).toContain('Showing 0 to 0 of 0 items');
    expect(component.totalPages()).toBe(1);
  });

  it('should emit pageChange when navigating with next/prev/first/last buttons', () => {
    const emitted: number[] = [];
    component.pageChange.subscribe((page) => emitted.push(page));

    fixture.componentRef.setInput('currentPage', 2);
    fixture.detectChanges();

    component.goToPage(3);
    component.goToPage(1);
    component.goToPage(4);
    expect(emitted).toEqual([3, 1, 4]);
    expect(component.currentPage()).toBe(4);
  });

  it('should ignore out-of-range or redundant page navigation', () => {
    const emitted: number[] = [];
    component.pageChange.subscribe((page) => emitted.push(page));

    component.goToPage(0);
    component.goToPage(5);
    component.goToPage(1);

    expect(emitted).toEqual([]);
    expect(component.currentPage()).toBe(1);
  });

  it('should reset to page 1 and emit pageSizeChange when the page size changes', () => {
    fixture.componentRef.setInput('currentPage', 3);
    fixture.detectChanges();

    const emittedSizes: number[] = [];
    component.pageSizeChange.subscribe((size) => emittedSizes.push(size));

    component.onPageSizeChange(25);

    expect(emittedSizes).toEqual([25]);
    expect(component.pageSize()).toBe(25);
    expect(component.currentPage()).toBe(1);
  });

  it('should render up to five page number buttons and mark the current one', () => {
    fixture.componentRef.setInput('currentPage', 3);
    fixture.detectChanges();

    const buttons = pageButtons();
    expect(buttons.length).toBe(4);
    const active = fixture.debugElement
      .queryAll(By.css('[data-testid="page-number"]'))
      .find((de) => de.classes['bg-primary-600']);
    expect(active?.nativeElement.textContent?.trim()).toBe('3');
  });

  it('should clamp visible pages to the available range at the end', () => {
    fixture.componentRef.setInput('currentPage', 4);
    fixture.detectChanges();
    expect(component.visiblePages().join(',')).toBe('1,2,3,4');
  });

  it('should disable prev controls on the first page and next controls on the last page', () => {
    const getByAriaLabel = (label: string) =>
      (fixture.debugElement
        .queryAll(By.css('button'))
        .find((de) => de.attributes['aria-label'] === label)?.nativeElement as
        | HTMLButtonElement
        | undefined) ?? null;

    expect(getByAriaLabel('First Page')!.disabled).toBeTrue();
    expect(getByAriaLabel('Previous Page')!.disabled).toBeTrue();
    expect(getByAriaLabel('Next Page')!.disabled).toBeFalse();
    expect(getByAriaLabel('Last Page')!.disabled).toBeFalse();

    fixture.componentRef.setInput('currentPage', 4);
    fixture.detectChanges();

    expect(getByAriaLabel('First Page')!.disabled).toBeFalse();
    expect(getByAriaLabel('Next Page')!.disabled).toBeTrue();
    expect(getByAriaLabel('Last Page')!.disabled).toBeTrue();
  });
});
