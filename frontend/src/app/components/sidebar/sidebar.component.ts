import { CommonModule } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  Injector,
  input,
  OnDestroy,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { filter, map } from 'rxjs/operators';
import { Tab } from '../../core/models/tab.model';

import { AuthService } from '../../core/services/auth.service';
import { KitchenCreateDialogComponent } from '../kitchen-create-dialog/kitchen-create-dialog.component';
import { SkilletIconComponent } from '../skillet-icon/skillet-icon.component';

@Component({
  selector: 'pantry-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    KitchenCreateDialogComponent,
    RouterLink,
    SkilletIconComponent,
  ],
  styleUrl: './sidebar.component.scss',
  templateUrl: './sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent implements OnDestroy {
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);
  private readonly injector = inject(Injector);
  private readonly drawer = viewChild<ElementRef<HTMLElement>>('drawer');
  private readonly mobileTrigger = viewChild<ElementRef<HTMLButtonElement>>('mobileTrigger');
  private readonly kitchenTrigger = viewChild<ElementRef<HTMLButtonElement>>('kitchenSwitcher');
  private readonly kitchenPanel = viewChild<ElementRef<HTMLElement>>('kitchenPanel');

  darkMode = input(true);
  activeTab = input<Tab>(Tab.Home);
  themeToggled = output<void>();
  mobileMenuChanged = output<boolean>();
  logoutClicked = output<void>();
  tabSelected = output<Tab>();

  tabs = Tab;
  mobileMenuOpen = signal(false);
  // Tablet widths (md to lg) start with the narrow rail so content keeps its room.
  isCollapsed = signal(SidebarComponent.isTabletWidth(window.innerWidth));
  isMobile = signal(window.innerWidth < 768);
  readonly desktopCollapsed = computed(() => !this.isMobile() && this.isCollapsed());
  inventoryExpanded = signal(true);
  kitchenMenuOpen = signal(false);
  showAddKitchenDialog = signal(false);
  private wasTablet = SidebarComponent.isTabletWidth(window.innerWidth);
  private static isTabletWidth(width: number): boolean {
    return width >= 768 && width < 1024;
  }

  ngOnDestroy(): void {
    this.mobileMenuChanged.emit(false);
  }

  @HostListener('window:resize')
  onResize(): void {
    const tablet = SidebarComponent.isTabletWidth(window.innerWidth);
    if (tablet !== this.wasTablet) {
      this.wasTablet = tablet;
      this.isCollapsed.set(tablet);
    }
    const mobile = window.innerWidth < 768;
    if (mobile === this.isMobile()) return;
    const focusWasInDrawer = this.drawer()?.nativeElement.contains(document.activeElement);
    this.isMobile.set(mobile);
    this.closeMobileMenu(false);
    this.kitchenMenuOpen.set(false);
    if (focusWasInDrawer) {
      afterNextRender(
        () => {
          (mobile ? this.mobileTrigger() : this.kitchenTrigger())?.nativeElement.focus();
        },
        { injector: this.injector },
      );
    }
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.kitchenMenuOpen.set(false);
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    // Body-mounted creation dialogs own their keyboard and focus lifecycle.
    if (this.showAddKitchenDialog()) return;
    if (event.key === 'Escape') {
      if (this.kitchenMenuOpen()) {
        event.preventDefault();
        event.stopPropagation();
        this.closeKitchenMenu();
      } else if (this.isMobile() && this.mobileMenuOpen()) {
        event.preventDefault();
        this.closeMobileMenu();
      }
      return;
    }
    if (event.key !== 'Tab' || !this.isMobile() || !this.mobileMenuOpen()) return;
    const controls = this.focusableControls(this.drawer()?.nativeElement);
    const first = controls[0];
    const last = controls.at(-1);
    if (!first || !last) return;
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !this.drawer()?.nativeElement.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (
      !event.shiftKey &&
      (active === last || !this.drawer()?.nativeElement.contains(active))
    ) {
      event.preventDefault();
      first.focus();
    }
  }

  private focusableControls(container?: HTMLElement): HTMLElement[] {
    return Array.from(
      container?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), [tabindex="0"]',
      ) || [],
    ).filter(
      (control) =>
        !control.closest('[inert]') &&
        window.getComputedStyle(control).display !== 'none' &&
        window.getComputedStyle(control).visibility !== 'hidden',
    );
  }

  toggleKitchenMenu(event?: Event): void {
    event?.stopPropagation();
    this.kitchenMenuOpen.update((v) => !v);
  }

  onKitchenTriggerKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    this.kitchenMenuOpen.set(true);
    afterNextRender(
      () => {
        const controls = this.focusableControls(this.kitchenPanel()?.nativeElement);
        (event.key === 'ArrowUp' ? controls.at(-1) : controls[0])?.focus();
      },
      { injector: this.injector },
    );
  }

  onKitchenPanelKeydown(event: KeyboardEvent): void {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const controls = this.focusableControls(this.kitchenPanel()?.nativeElement);
    const current = controls.indexOf(document.activeElement as HTMLElement);
    const index =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? controls.length - 1
          : (current + (event.key === 'ArrowDown' ? 1 : -1) + controls.length) % controls.length;
    controls[index]?.focus();
  }

  onKitchenPanelFocusout(event: FocusEvent): void {
    const target = event.relatedTarget as Node | null;
    if (
      target &&
      !this.kitchenPanel()?.nativeElement.contains(target) &&
      target !== this.kitchenTrigger()?.nativeElement
    ) {
      this.kitchenMenuOpen.set(false);
    }
  }

  private closeKitchenMenu(): void {
    this.kitchenMenuOpen.set(false);
    this.kitchenTrigger()?.nativeElement.focus();
  }

  selectKitchen(kitchen: import('../../core/models/auth.model').Kitchen): void {
    this.authService.setActiveKitchen(kitchen);
    this.closeKitchenMenu();
  }

  openAddKitchenDialog(event?: Event): void {
    event?.stopPropagation();
    this.kitchenMenuOpen.set(false);
    this.showAddKitchenDialog.set(true);
  }

  // Reactive URL signal driven by Router events for OnPush change detection
  readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects || e.url),
    ),
    { initialValue: this.router.url },
  );

  private readonly activeUrl = computed(() => {
    const path = (this.currentUrl() || this.router.url || '').split(/[?#]/, 1)[0];
    return path.replace(/\/+$/, '') || '/';
  });

  isCurrentPage(path: string): boolean {
    return this.activeUrl() === path;
  }

  onNavigationClick(event: MouseEvent): void {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      event.stopPropagation();
      return;
    }
    this.closeMobileMenu();
    this.kitchenMenuOpen.set(false);
  }

  readonly isHomeActive = computed(() => {
    const url = this.activeUrl();
    return url === '/' || url.startsWith('/home') || url.startsWith('/dashboard');
  });

  readonly isInventoryActive = computed(() => this.activeUrl().startsWith('/inventory'));

  readonly isIngredientsActive = computed(() => {
    const url = this.activeUrl();
    return url === '/inventory/ingredients' || url.startsWith('/inventory/ingredients/');
  });

  readonly isInventoryItemsActive = computed(() => {
    const url = this.activeUrl();
    return url === '/inventory/items' || url.startsWith('/inventory/items/');
  });

  readonly isIngredientGroupsActive = computed(() => {
    const url = this.activeUrl();
    return (
      url === '/inventory/groups' ||
      url.startsWith('/inventory/groups/') ||
      url.startsWith('/inventory/categories') ||
      url.startsWith('/inventory/nutrients')
    );
  });

  readonly isRecipesActive = computed(() => this.activeUrl().startsWith('/recipes'));
  readonly isShoppingListActive = computed(() => this.activeUrl().startsWith('/shopping-list'));
  readonly isMealPlannerActive = computed(() => this.activeUrl().startsWith('/meal-planner'));
  readonly isProfileActive = computed(() => this.activeUrl().startsWith('/profile'));

  toggleCollapse(): void {
    this.isCollapsed.update((v) => !v);
  }

  toggleMobileMenu(): void {
    if (this.mobileMenuOpen()) {
      this.closeMobileMenu();
      return;
    }
    this.mobileMenuOpen.set(true);
    this.mobileMenuChanged.emit(true);
    afterNextRender(
      () => {
        if (this.mobileMenuOpen()) {
          const drawer = this.drawer()?.nativeElement;
          const close = drawer?.querySelector<HTMLElement>('.mobile-drawer-close');
          (close ?? this.focusableControls(drawer)[0])?.focus();
        }
      },
      { injector: this.injector },
    );
  }

  closeMobileMenu(returnFocus = true): void {
    const wasOpen = this.mobileMenuOpen();
    this.mobileMenuOpen.set(false);
    this.kitchenMenuOpen.set(false);
    this.mobileMenuChanged.emit(false);
    if (wasOpen && returnFocus && this.isMobile()) this.mobileTrigger()?.nativeElement.focus();
  }

  toggleInventoryExpanded(event?: Event): void {
    if (event) event.stopPropagation();
    this.inventoryExpanded.update((v) => !v);
  }

  onToggleTheme(): void {
    this.themeToggled.emit();
  }

  onLogout(): void {
    this.logoutClicked.emit();
  }

  navigateTo(path: string): void {
    this.closeMobileMenu();
    this.kitchenMenuOpen.set(false);
    this.router.navigate([path]);
  }
}
