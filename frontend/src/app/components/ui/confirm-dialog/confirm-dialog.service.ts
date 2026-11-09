import { inject, Injectable } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { ConfirmationService } from 'primeng/api';
import { filter } from 'rxjs';

export interface ConfirmOptions {
  title: string;
  message: string;
  acceptLabel?: string;
  rejectLabel?: string;
  /** Rose accept button and warning icon; Cancel receives focus first. */
  destructive?: boolean;
  /** Overrides the default icon (`pi pi-exclamation-triangle` when destructive). */
  icon?: string;
}

/**
 * Opens the single `pantry-confirm-dialog` mounted once in the app shell (app.component.html).
 * Resolves `true` on accept and `false` on cancel, Escape, or backdrop dismissal.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  /** Private PrimeNG bus shared with `pantry-confirm-dialog`; callers never provide their own. */
  readonly confirmationService = new ConfirmationService();

  /** Resolver of the open confirmation, cleared once it settles so a promise never resolves twice. */
  private pendingResolve: ((value: boolean) => void) | null = null;

  private readonly transloco = inject(TranslocoService);
  // Optional so specs that do not provide the router still work.
  private readonly router = inject(Router, { optional: true });
  private watchingNavigation = false;

  /** Subscribed lazily on first use; tolerates a missing or partial Router (specs). */
  private watchNavigation(): void {
    if (this.watchingNavigation) return;
    this.watchingNavigation = true;
    this.router?.events?.pipe(filter((e) => e instanceof NavigationStart)).subscribe(() => {
      // The dialog lives in the app shell, so an open confirmation outlives a route change.
      // Cancel it so the caller never continues on a destroyed component.
      if (this.pendingResolve) {
        this.confirmationService.close();
        this.settle(false);
      }
    });
  }

  private settle(value: boolean): void {
    const resolve = this.pendingResolve;
    this.pendingResolve = null;
    resolve?.(value);
  }

  confirm(options: ConfirmOptions): Promise<boolean> {
    this.watchNavigation();
    // A new request supersedes any still-pending one.
    this.settle(false);
    return new Promise<boolean>((resolve) => {
      this.pendingResolve = resolve;
      this.confirmationService.confirm({
        key: 'pantry-confirm',
        header: options.title,
        message: options.message,
        acceptLabel: options.acceptLabel ?? this.transloco.translate('common.confirm'),
        rejectLabel: options.rejectLabel ?? this.transloco.translate('common.cancel'),
        icon:
          options.icon ??
          (options.destructive ? 'pi pi-exclamation-triangle' : 'pi pi-info-circle'),
        acceptButtonStyleClass: options.destructive ? 'btn-danger' : 'btn-primary',
        accept: () => this.settle(true),
        reject: () => this.settle(false),
      });
    });
  }
}
