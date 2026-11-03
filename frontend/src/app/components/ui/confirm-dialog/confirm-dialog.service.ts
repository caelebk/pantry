import { Injectable } from '@angular/core';
import { ConfirmationService } from 'primeng/api';

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
 * Opens the single `pantry-confirm-dialog` mounted on the page.
 * Resolves `true` on accept and `false` on cancel, Escape, or backdrop dismissal.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  /** Private PrimeNG bus shared with `pantry-confirm-dialog`; callers never provide their own. */
  readonly confirmationService = new ConfirmationService();

  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.confirmationService.confirm({
        key: 'pantry-confirm',
        header: options.title,
        message: options.message,
        acceptLabel: options.acceptLabel ?? 'Confirm',
        rejectLabel: options.rejectLabel ?? 'Cancel',
        icon:
          options.icon ??
          (options.destructive ? 'pi pi-exclamation-triangle' : 'pi pi-info-circle'),
        acceptButtonStyleClass: options.destructive ? 'btn-danger' : 'btn-primary',
        accept: () => resolve(true),
        reject: () => resolve(false),
      });
    });
  }
}
