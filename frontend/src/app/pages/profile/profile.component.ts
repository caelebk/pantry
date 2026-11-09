import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import {
  BadgeComponent,
  CardComponent,
  ConfirmDialogService,
  FormFieldComponent,
  SegmentedControlComponent,
  SegmentedOption,
  SkeletonComponent,
  SpinnerComponent,
} from '@ui';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { KitchenCreateDialogComponent } from '../../components/kitchen-create-dialog/kitchen-create-dialog.component';
import { Kitchen, KitchenMember, UserSession } from '../../core/models/auth.model';
import { AuthService } from '../../core/services/auth.service';
import { KitchenService } from '../../core/services/kitchen.service';
import { ThemeService } from '../../core/services/theme.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'pantry-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    SelectModule,
    BadgeComponent,
    CardComponent,
    FormFieldComponent,
    SegmentedControlComponent,
    SkeletonComponent,
    SpinnerComponent,
    KitchenCreateDialogComponent,
  ],
  template: `
    <div class="page-layout">
      <!-- Page Header -->
      <header class="page-header">
        <div>
          <h1 class="type-page-title text-surface-900 dark:text-white">
            {{ 'profile.title' | transloco }}
          </h1>
        </div>
        <div class="page-header__actions">
          <pantry-badge variant="neutral">
            {{ authService.currentUser()?.globalRole }}
          </pantry-badge>
        </div>
      </header>

      <!-- Main Layout Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Column: Personal Info & Password -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Profile Form Card -->
          <pantry-card padding="lg">
            <h2
              class="type-section-title text-surface-800 dark:text-surface-100 mb-6 flex items-center gap-2">
              <i class="pi pi-user text-surface-500 dark:text-surface-400"></i>
              {{ 'profile.personalInfo' | transloco }}
            </h2>

            <form [formGroup]="profileForm" (ngSubmit)="onSaveProfile()" class="space-y-6">
              <pantry-form-field
                [label]="'auth.fullName' | transloco"
                forId="fullName"
                [required]="true"
                [error]="
                  profileForm.controls.fullName.invalid && profileForm.controls.fullName.touched
                    ? ('profile.errors.fullNameRequired' | transloco)
                    : ''
                ">
                <input
                  pInputText
                  type="text"
                  id="fullName"
                  formControlName="fullName"
                  class="w-full" />
              </pantry-form-field>

              <pantry-form-field
                [label]="'profile.username' | transloco"
                forId="username"
                [error]="
                  profileForm.controls.username.invalid && profileForm.controls.username.touched
                    ? ('profile.errors.usernameInvalid' | transloco)
                    : ''
                ">
                <input
                  pInputText
                  type="text"
                  id="username"
                  formControlName="username"
                  class="w-full" />
              </pantry-form-field>

              <pantry-form-field [label]="'auth.email' | transloco" forId="email">
                <input
                  pInputText
                  type="email"
                  id="email"
                  [value]="authService.currentUser()?.email"
                  disabled
                  class="w-full" />
              </pantry-form-field>

              <pantry-form-field
                [label]="'profile.theme.label' | transloco"
                forId="themePreference"
                [required]="true">
                <pantry-segmented-control
                  id="themePreference"
                  [options]="themeOptions()"
                  [value]="profileForm.controls.themePreference.value"
                  (valueChange)="profileForm.controls.themePreference.setValue($event ?? 'system')"
                  ariaLabelledBy="themePreference-label" />
              </pantry-form-field>

              <div class="flex justify-end">
                <button
                  type="submit"
                  [disabled]="profileForm.invalid || isSavingProfile()"
                  [attr.aria-busy]="isSavingProfile()"
                  class="btn-primary">
                  @if (isSavingProfile()) {
                    <pantry-spinner [announce]="false" size="sm" color="white" />
                  }
                  <span>{{ 'profile.updateProfileBtn' | transloco }}</span>
                </button>
              </div>
            </form>
          </pantry-card>

          <!-- Password Change Form Card -->
          <pantry-card padding="lg">
            <h2
              class="type-section-title text-surface-800 dark:text-surface-100 mb-6 flex items-center gap-2">
              <i class="pi pi-lock text-surface-500 dark:text-surface-400"></i>
              {{ 'profile.changePassword' | transloco }}
            </h2>

            <form [formGroup]="passwordForm" (ngSubmit)="onChangePassword()" class="space-y-6">
              <pantry-form-field
                [label]="'profile.currentPassword' | transloco"
                forId="currentPassword"
                [required]="true"
                [error]="
                  passwordForm.controls.currentPassword.invalid &&
                  passwordForm.controls.currentPassword.touched
                    ? ('profile.errors.currentPasswordRequired' | transloco)
                    : ''
                ">
                <input
                  pInputText
                  type="password"
                  id="currentPassword"
                  formControlName="currentPassword"
                  class="w-full" />
              </pantry-form-field>

              <pantry-form-field
                [label]="'profile.newPassword' | transloco"
                forId="newPassword"
                [required]="true"
                [error]="
                  passwordForm.controls.newPassword.invalid &&
                  passwordForm.controls.newPassword.touched
                    ? ('profile.errors.newPasswordMin' | transloco)
                    : ''
                ">
                <input
                  pInputText
                  type="password"
                  id="newPassword"
                  formControlName="newPassword"
                  class="w-full" />
              </pantry-form-field>

              <div class="flex justify-end">
                <button
                  type="submit"
                  [disabled]="passwordForm.invalid || isChangingPassword()"
                  [attr.aria-busy]="isChangingPassword()"
                  class="btn-secondary">
                  @if (isChangingPassword()) {
                    <pantry-spinner [announce]="false" size="sm" />
                  }
                  <span>{{ 'profile.changePasswordBtn' | transloco }}</span>
                </button>
              </div>
            </form>
          </pantry-card>

          <!-- Active Security Sessions Card -->
          <pantry-card padding="lg">
            <div class="flex items-center justify-between mb-6">
              <h2
                class="type-section-title text-surface-800 dark:text-surface-100 flex items-center gap-2">
                <i class="pi pi-shield text-surface-500 dark:text-surface-400"></i>
                {{ 'profile.activeSessions' | transloco }}
              </h2>
              <button type="button" (click)="onRevokeAllSessions()" class="btn-danger">
                {{ 'profile.revokeAllSessionsBtn' | transloco }}
              </button>
            </div>

            <div class="space-y-3">
              @for (s of sessions(); track s.id) {
                <pantry-card variant="sub" padding="sm" class="block">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div
                        class="w-10 h-10 rounded-xl bg-surface-200 dark:bg-surface-800 flex items-center justify-center text-surface-600 dark:text-surface-300">
                        <i class="pi pi-desktop text-lg"></i>
                      </div>
                      <div>
                        <div
                          class="type-label text-surface-800 dark:text-surface-100 flex items-center gap-2">
                          <span>{{ s.userAgent }}</span>
                          @if (s.isCurrent) {
                            <pantry-badge variant="fresh" size="sm">
                              {{ 'profile.currentDevice' | transloco }}
                            </pantry-badge>
                          }
                        </div>
                        <div class="type-meta text-surface-500 dark:text-surface-400 mt-0.5">
                          {{
                            'profile.sessionMeta'
                              | transloco
                                : { ip: s.ipAddress, date: (s.createdAt | date: 'mediumDate') }
                          }}
                        </div>
                      </div>
                    </div>
                  </div>
                </pantry-card>
              }
            </div>
          </pantry-card>
        </div>

        <!-- Right Column: Kitchen Workspaces -->
        <div class="space-y-6">
          <pantry-card>
            <div class="flex items-center justify-between mb-6">
              <h2
                class="type-section-title text-surface-800 dark:text-surface-100 flex items-center gap-2">
                <i class="pi pi-building text-surface-500 dark:text-surface-400"></i>
                {{ 'kitchens.title' | transloco }}
              </h2>
              <button
                type="button"
                data-create-kitchen
                (click)="showCreateKitchenModal.set(true)"
                [attr.aria-label]="'kitchenCreate.title' | transloco"
                class="btn-icon">
                <i class="pi pi-plus text-sm"></i>
              </button>
            </div>

            <div class="space-y-3">
              @for (k of authService.userKitchens(); track k.id) {
                <div
                  [class.border-primary-500/40]="authService.activeKitchen()?.id === k.id"
                  [class.bg-primary-500/10]="authService.activeKitchen()?.id === k.id"
                  [class.dark:bg-primary-500/20]="authService.activeKitchen()?.id === k.id"
                  [class.border-surface-200]="authService.activeKitchen()?.id !== k.id"
                  [class.dark:border-surface-800]="authService.activeKitchen()?.id !== k.id"
                  class="p-3 rounded-xl border flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    data-select-kitchen
                    (click)="authService.setActiveKitchen(k)"
                    [attr.aria-pressed]="authService.activeKitchen()?.id === k.id"
                    class="flex-1 min-w-0 min-h-[42px] rounded-xl text-left focus-visible:outline-2 focus-visible:outline-primary-500 focus-visible:outline-offset-2">
                    <span
                      class="block type-label text-surface-800 dark:text-surface-100 break-words"
                      >{{ k.name }}</span
                    >
                    <span class="block type-meta text-surface-500 dark:text-surface-400 mt-0.5">
                      {{
                        ((k.memberCount ?? 1) === 1
                          ? 'kitchenCreate.member'
                          : 'kitchenCreate.members'
                        ) | transloco: { count: k.memberCount ?? 1 }
                      }}
                      •
                      {{ 'kitchenCreate.' + k.role | transloco }}
                    </span>
                  </button>
                  @if (authService.activeKitchen()?.id === k.id) {
                    <i
                      class="pi pi-check-circle text-primary-600 dark:text-primary-400 text-lg shrink-0"
                      aria-hidden="true"></i>
                  }
                  @if (k.role === 'owner') {
                    <button
                      type="button"
                      (click)="openManageModal(k)"
                      [attr.aria-label]="'kitchenCreate.manageNamed' | transloco: { name: k.name }"
                      class="btn-ghost shrink-0">
                      {{ 'kitchenCreate.manage' | transloco }}
                    </button>
                  }
                </div>
              }
            </div>
          </pantry-card>
        </div>
      </div>
    </div>

    <pantry-kitchen-create-dialog [(visible)]="showCreateKitchenModal" />
    <!-- Manage Kitchen Modal -->
    <p-dialog
      [header]="'profile.manageMembers' | transloco"
      [(visible)]="showManageKitchenModal"
      [modal]="true"
      appendTo="body"
      [style]="{ width: '90%', 'max-width': '500px' }">
      <div class="space-y-6 pt-2">
        <!-- Invite Form -->
        <pantry-card variant="sub" padding="sm">
          <form [formGroup]="inviteForm" (ngSubmit)="onInviteMember()" class="flex flex-col gap-3">
            <h3 class="type-section-title text-surface-800 dark:text-surface-100">
              {{ 'profile.inviteNewMember' | transloco }}
            </h3>
            <div class="flex gap-2 items-start">
              <div class="flex-1">
                <pantry-form-field
                  forId="inviteEmail"
                  [label]="'profile.userEmail' | transloco"
                  [required]="true"
                  [error]="
                    inviteForm.controls.email.invalid && inviteForm.controls.email.touched
                      ? ('profile.errors.emailInvalid' | transloco)
                      : ''
                  ">
                  <input
                    pInputText
                    type="email"
                    id="inviteEmail"
                    formControlName="email"
                    [placeholder]="'profile.userEmail' | transloco"
                    class="w-full" />
                </pantry-form-field>
              </div>
              <pantry-form-field
                #roleField
                forId="inviteRole"
                [label]="'kitchens.memberRole' | transloco"
                [required]="true">
                <p-select
                  inputId="inviteRole"
                  formControlName="role"
                  [options]="roleOptions()"
                  optionLabel="label"
                  optionValue="value"
                  appendTo="body"
                  [ariaLabelledBy]="roleField.labelId()" />
              </pantry-form-field>
            </div>
            <button
              type="submit"
              [disabled]="inviteForm.invalid || isInviting()"
              [attr.aria-busy]="isInviting()"
              class="btn-secondary w-full">
              @if (isInviting()) {
                <pantry-spinner [announce]="false" size="sm" />
              }
              {{ 'profile.sendInvitation' | transloco }}
            </button>
          </form>
        </pantry-card>

        <!-- Member List -->
        <div class="space-y-3">
          <h3 class="type-section-title text-surface-800 dark:text-surface-100">
            {{ 'profile.currentMembers' | transloco }}
          </h3>
          @if (isLoadingMembers()) {
            <pantry-skeleton variant="row" [count]="2" />
          } @else {
            @for (m of kitchenMembers(); track m.id) {
              <pantry-card variant="sub" padding="sm" class="block">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="type-label text-surface-800 dark:text-surface-100">
                      {{ m.fullName }}
                    </div>
                    <div class="type-meta text-surface-500 dark:text-surface-400">
                      {{ m.email }} • <span class="capitalize">{{ m.role }}</span>
                    </div>
                  </div>
                  @if (m.userId !== authService.currentUser()?.id) {
                    <button
                      type="button"
                      (click)="onRemoveMember(m.userId)"
                      [attr.aria-label]="'profile.removeMember' | transloco"
                      class="btn-icon-sm text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300">
                      <i class="pi pi-trash"></i>
                    </button>
                  }
                </div>
              </pantry-card>
            }
          }
        </div>
      </div>
    </p-dialog>
  `,
})
export class ProfileComponent implements OnInit {
  authService = inject(AuthService);
  private kitchenService = inject(KitchenService);
  private themeService = inject(ThemeService);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);
  private transloco = inject(TranslocoService);

  private readonly activeLang = toSignal(this.transloco.langChanges$);
  readonly themeOptions = computed<SegmentedOption[]>(() => {
    this.activeLang();
    return [
      { value: 'system', label: this.transloco.translate('profile.theme.system') },
      { value: 'light', label: this.transloco.translate('profile.theme.light') },
      { value: 'dark', label: this.transloco.translate('profile.theme.dark') },
    ];
  });
  readonly roleOptions = computed(() => {
    this.activeLang();
    return [
      { value: 'editor', label: this.transloco.translate('kitchens.roleEditor') },
      { value: 'viewer', label: this.transloco.translate('kitchens.roleViewer') },
    ];
  });

  readonly isSavingProfile = signal(false);
  readonly isChangingPassword = signal(false);
  readonly sessions = signal<UserSession[]>([]);
  readonly showCreateKitchenModal = signal(false);

  // Kitchen management signals
  readonly showManageKitchenModal = signal(false);
  readonly manageKitchenId = signal<string | null>(null);
  readonly kitchenMembers = signal<KitchenMember[]>([]);
  readonly isLoadingMembers = signal(false);
  readonly isInviting = signal(false);

  readonly profileForm = this.fb.group({
    fullName: ['', [Validators.required]],
    username: ['', [Validators.pattern(/^[a-zA-Z0-9_]{3,30}$/)]],
    themePreference: ['system', [Validators.required]],
  });

  readonly passwordForm = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  readonly inviteForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    role: ['editor', [Validators.required]],
  });

  ngOnInit() {
    const u = this.authService.currentUser();
    if (u) {
      this.profileForm.patchValue({
        fullName: u.fullName,
        username: u.username || '',
        themePreference: u.themePreference || 'system',
      });
    }
    this.loadSessions();
  }

  loadSessions() {
    this.authService.getActiveSessions().subscribe({
      next: (list) => this.sessions.set(list),
      error: (err) => {
        console.error('Failed to load active sessions:', err);
      },
    });
  }

  onSaveProfile() {
    if (this.profileForm.invalid) return;

    this.isSavingProfile.set(true);
    const { fullName, username, themePreference } = this.profileForm.value;

    this.authService
      .updateProfile({
        fullName: fullName || undefined,
        username: username?.trim() || undefined,
        themePreference: themePreference as 'system' | 'light' | 'dark',
      })
      .subscribe({
        next: () => {
          this.isSavingProfile.set(false);
          this.themeService.setUserPreference(themePreference as string);
          this.toastService.showSuccess(
            this.transloco.translate('profile.toasts.profileSaved'),
            this.transloco.translate('profile.toasts.profileSavedTitle'),
          );
        },
        error: (err) => {
          this.isSavingProfile.set(false);
          this.toastService.showError(
            err.error?.message || this.transloco.translate('profile.toasts.profileFailed'),
            this.transloco.translate('profile.toasts.profileFailedTitle'),
          );
        },
      });
  }

  onChangePassword() {
    if (this.passwordForm.invalid) return;

    this.isChangingPassword.set(true);
    const { currentPassword, newPassword } = this.passwordForm.value;

    this.authService.changePassword(currentPassword!, newPassword!).subscribe({
      next: () => {
        this.isChangingPassword.set(false);
        this.passwordForm.reset();
        this.toastService.showSuccess(
          this.transloco.translate('profile.toasts.passwordChanged'),
          this.transloco.translate('profile.toasts.success'),
        );
      },
      error: (err) => {
        this.isChangingPassword.set(false);
        this.toastService.showError(
          err.error?.message || this.transloco.translate('profile.toasts.passwordFailed'),
          this.transloco.translate('profile.toasts.error'),
        );
      },
    });
  }

  onRevokeAllSessions() {
    void this.confirmDialog
      .confirm({
        title: this.transloco.translate('profile.revokeAllConfirmTitle'),
        message: this.transloco.translate('profile.revokeAllConfirmMessage'),
        acceptLabel: this.transloco.translate('profile.revokeAllSessionsBtn'),
        rejectLabel: this.transloco.translate('profile.revokeAllConfirmCancel'),
        destructive: true,
      })
      .then((accepted) => {
        if (accepted) this.revokeAllSessions();
      });
  }

  private revokeAllSessions() {
    this.authService.revokeAllSessions().subscribe({
      next: () => {
        this.toastService.showSuccess(
          this.transloco.translate('profile.toasts.sessionsRevoked'),
          this.transloco.translate('profile.toasts.sessionsRevokedTitle'),
        );
      },
      error: (err) => {
        this.toastService.showError(
          err.error?.message || this.transloco.translate('profile.toasts.sessionsFailed'),
          this.transloco.translate('profile.toasts.error'),
        );
      },
    });
  }

  openManageModal(kitchen: Kitchen) {
    this.manageKitchenId.set(kitchen.id);
    this.showManageKitchenModal.set(true);
    this.inviteForm.reset({ role: 'editor' });
    this.loadKitchenMembers(kitchen.id);
  }

  loadKitchenMembers(kitchenId: string) {
    this.isLoadingMembers.set(true);
    this.kitchenService.getKitchenMembers(kitchenId).subscribe({
      next: (members) => {
        this.kitchenMembers.set(members);
        this.isLoadingMembers.set(false);
      },
      error: () => {
        this.isLoadingMembers.set(false);
        this.toastService.showError(
          this.transloco.translate('profile.toasts.membersFailed'),
          this.transloco.translate('profile.toasts.error'),
        );
      },
    });
  }

  onInviteMember() {
    if (this.inviteForm.invalid || !this.manageKitchenId()) return;

    this.isInviting.set(true);
    const { email, role } = this.inviteForm.value;

    this.kitchenService
      .inviteMember(this.manageKitchenId()!, email!, role as 'owner' | 'editor' | 'viewer')
      .subscribe({
        next: () => {
          this.isInviting.set(false);
          this.inviteForm.reset({ role: 'editor' });
          this.loadKitchenMembers(this.manageKitchenId()!);
          this.toastService.showSuccess(
            this.transloco.translate('profile.toasts.memberInvited'),
            this.transloco.translate('profile.toasts.success'),
          );
        },
        error: () => {
          this.isInviting.set(false);
          this.toastService.showError(
            this.transloco.translate('profile.toasts.inviteFailed'),
            this.transloco.translate('profile.toasts.error'),
          );
        },
      });
  }

  onRemoveMember(userId: string) {
    if (!this.manageKitchenId()) return;

    this.kitchenService.removeMember(this.manageKitchenId()!, userId).subscribe({
      next: () => {
        this.loadKitchenMembers(this.manageKitchenId()!);
        this.toastService.showSuccess(
          this.transloco.translate('profile.toasts.memberRemoved'),
          this.transloco.translate('profile.toasts.success'),
        );
      },
      error: () => {
        this.toastService.showError(
          this.transloco.translate('profile.toasts.removeFailed'),
          this.transloco.translate('profile.toasts.error'),
        );
      },
    });
  }
}
