import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { Kitchen, KitchenMember, UserSession } from '../../core/models/auth.model';
import { AuthService } from '../../core/services/auth.service';
import { KitchenService } from '../../core/services/kitchen.service';

@Component({
  selector: 'pantry-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    DialogModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <div class="space-y-8 max-w-6xl mx-auto">
      <!-- Page Header -->
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-200 dark:border-surface-800 pb-6">
        <div>
          <h1
            class="text-3xl font-bold tracking-tight bg-gradient-to-r from-surface-900 to-surface-600 dark:from-surface-50 dark:to-surface-300 bg-clip-text text-transparent">
            {{ 'profile.title' | transloco }}
          </h1>
          <p class="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {{ 'profile.subtitle' | transloco }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <span
            class="px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-semibold uppercase tracking-wider">
            {{ authService.currentUser()?.globalRole }}
          </span>
        </div>
      </div>

      <!-- Main Layout Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Column: Personal Info & Password -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Profile Form Card -->
          <div
            class="glass-card p-6 sm:p-8 rounded-2xl bg-white/60 dark:bg-surface-900/60 border border-surface-200/80 dark:border-surface-800/80 backdrop-blur-xl">
            <h2
              class="text-lg font-semibold text-surface-800 dark:text-surface-100 mb-6 flex items-center gap-2">
              <i class="pi pi-user text-orange-400"></i>
              {{ 'profile.personalInfo' | transloco }}
            </h2>

            <form [formGroup]="profileForm" (ngSubmit)="onSaveProfile()" class="space-y-6">
              <div>
                <label
                  class="block text-xs font-semibold uppercase text-surface-600 dark:text-surface-300 mb-2"
                  >{{ 'auth.fullName' | transloco }}</label
                >
                <input
                  type="text"
                  formControlName="fullName"
                  class="w-full h-[42px] px-4 rounded-xl bg-surface-100/80 dark:bg-surface-800/80 border border-surface-300/80 dark:border-surface-700/80 text-surface-900 dark:text-surface-50 text-sm focus:ring-2 focus:ring-orange-500/50 outline-none" />
              </div>

              <div>
                <label
                  class="block text-xs font-semibold uppercase text-surface-600 dark:text-surface-300 mb-2"
                  >{{ 'auth.email' | transloco }}</label
                >
                <input
                  type="email"
                  [value]="authService.currentUser()?.email"
                  disabled
                  class="w-full h-[42px] px-4 rounded-xl bg-surface-100/80 dark:bg-surface-900/80 border border-surface-300 dark:border-surface-800 text-surface-500 dark:text-surface-400 text-sm cursor-not-allowed outline-none" />
              </div>

              <div>
                <label
                  class="block text-xs font-semibold uppercase text-surface-600 dark:text-surface-300 mb-2"
                  >Theme Preference</label
                >
                <select
                  formControlName="themePreference"
                  class="w-full h-[42px] px-4 rounded-xl bg-surface-100/80 dark:bg-surface-800/80 border border-surface-300/80 dark:border-surface-700/80 text-surface-900 dark:text-surface-50 text-sm focus:ring-2 focus:ring-orange-500/50 outline-none">
                  <option value="system">System (Match OS)</option>
                  <option value="light">Light Mode</option>
                  <option value="dark">Dark Mode</option>
                </select>
              </div>

              <div class="flex justify-end">
                <button
                  type="submit"
                  [disabled]="profileForm.invalid || isSavingProfile()"
                  class="h-[42px] px-6 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-sm shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 disabled:opacity-50">
                  @if (isSavingProfile()) {
                    <i class="pi pi-spin pi-spinner"></i>
                  }
                  <span>{{ 'profile.updateProfileBtn' | transloco }}</span>
                </button>
              </div>
            </form>
          </div>

          <!-- Password Change Form Card -->
          <div
            class="glass-card p-6 sm:p-8 rounded-2xl bg-white/60 dark:bg-surface-900/60 border border-surface-200/80 dark:border-surface-800/80 backdrop-blur-xl">
            <h2
              class="text-lg font-semibold text-surface-800 dark:text-surface-100 mb-6 flex items-center gap-2">
              <i class="pi pi-lock text-orange-400"></i>
              {{ 'profile.changePassword' | transloco }}
            </h2>

            <form [formGroup]="passwordForm" (ngSubmit)="onChangePassword()" class="space-y-6">
              <div>
                <label
                  class="block text-xs font-semibold uppercase text-surface-600 dark:text-surface-300 mb-2"
                  >Current Password</label
                >
                <input
                  type="password"
                  formControlName="currentPassword"
                  class="w-full h-[42px] px-4 rounded-xl bg-surface-100/80 dark:bg-surface-800/80 border border-surface-300/80 dark:border-surface-700/80 text-surface-900 dark:text-surface-50 text-sm focus:ring-2 focus:ring-orange-500/50 outline-none" />
              </div>

              <div>
                <label
                  class="block text-xs font-semibold uppercase text-surface-600 dark:text-surface-300 mb-2"
                  >New Password</label
                >
                <input
                  type="password"
                  formControlName="newPassword"
                  class="w-full h-[42px] px-4 rounded-xl bg-surface-100/80 dark:bg-surface-800/80 border border-surface-300/80 dark:border-surface-700/80 text-surface-900 dark:text-surface-50 text-sm focus:ring-2 focus:ring-orange-500/50 outline-none" />
              </div>

              <div class="flex justify-end">
                <button
                  type="submit"
                  [disabled]="passwordForm.invalid || isChangingPassword()"
                  class="h-[42px] px-6 rounded-xl bg-surface-800 dark:bg-surface-100 hover:bg-surface-700 dark:hover:bg-surface-200 text-white dark:text-surface-900 font-semibold text-sm transition-all flex items-center gap-2 disabled:opacity-50">
                  @if (isChangingPassword()) {
                    <i class="pi pi-spin pi-spinner"></i>
                  }
                  <span>Change Password</span>
                </button>
              </div>
            </form>
          </div>

          <!-- Active Security Sessions Card -->
          <div
            class="glass-card p-6 sm:p-8 rounded-2xl bg-white/60 dark:bg-surface-900/60 border border-surface-200/80 dark:border-surface-800/80 backdrop-blur-xl">
            <div class="flex items-center justify-between mb-6">
              <h2
                class="text-lg font-semibold text-surface-800 dark:text-surface-100 flex items-center gap-2">
                <i class="pi pi-shield text-orange-400"></i>
                {{ 'profile.activeSessions' | transloco }}
              </h2>
              <button
                (click)="onRevokeAllSessions()"
                class="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium transition-colors">
                {{ 'profile.revokeAllSessionsBtn' | transloco }}
              </button>
            </div>

            <div class="space-y-3">
              @for (s of sessions(); track s.id) {
                <div
                  class="flex items-center justify-between p-4 rounded-xl bg-surface-100/40 dark:bg-surface-800/40 border border-surface-200/50 dark:border-surface-700/50">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-10 h-10 rounded-xl bg-surface-200 dark:bg-surface-800 flex items-center justify-center text-surface-600 dark:text-surface-300">
                      <i class="pi pi-desktop text-lg"></i>
                    </div>
                    <div>
                      <div
                        class="text-sm font-medium text-surface-800 dark:text-surface-100 flex items-center gap-2">
                        <span>{{ s.userAgent }}</span>
                        @if (s.isCurrent) {
                          <span
                            class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold uppercase">
                            {{ 'profile.currentDevice' | transloco }}
                          </span>
                        }
                      </div>
                      <div class="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                        IP: {{ s.ipAddress }} • Connected {{ s.createdAt | date: 'mediumDate' }}
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Right Column: Kitchen Workspaces -->
        <div class="space-y-8">
          <div
            class="glass-card p-6 rounded-2xl bg-white/60 dark:bg-surface-900/60 border border-surface-200/80 dark:border-surface-800/80 backdrop-blur-xl">
            <div class="flex items-center justify-between mb-6">
              <h2
                class="text-lg font-semibold text-surface-800 dark:text-surface-100 flex items-center gap-2">
                <i class="pi pi-building text-orange-400"></i>
                {{ 'kitchens.title' | transloco }}
              </h2>
              <button
                (click)="showCreateKitchenModal.set(true)"
                class="w-8 h-8 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 flex items-center justify-center transition-colors">
                <i class="pi pi-plus text-sm"></i>
              </button>
            </div>

            <div class="space-y-3">
              @for (k of authService.userKitchens(); track k.id) {
                <div
                  (click)="authService.setActiveKitchen(k)"
                  [class.border-orange-500/50]="authService.activeKitchen()?.id === k.id"
                  [class.bg-orange-500/5]="authService.activeKitchen()?.id === k.id"
                  class="p-4 rounded-xl border border-surface-200 dark:border-surface-800 hover:border-surface-300 dark:hover:border-surface-700 cursor-pointer transition-all flex items-center justify-between">
                  <div>
                    <div
                      class="text-sm font-semibold text-surface-800 dark:text-surface-100 flex items-center gap-2">
                      {{ k.name }}
                      @if (k.role === 'owner') {
                        <button
                          (click)="$event.stopPropagation(); openManageModal(k)"
                          class="text-xs text-orange-400 hover:text-orange-500 underline ml-2">
                          Manage
                        </button>
                      }
                    </div>
                    <div class="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                      {{ k.memberCount || 1 }} member(s) • {{ k.role }}
                    </div>
                  </div>
                  @if (authService.activeKitchen()?.id === k.id) {
                    <i class="pi pi-check-circle text-orange-400 text-lg"></i>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Kitchen Modal -->
    <p-dialog
      header="Create Shared Kitchen"
      [(visible)]="showCreateKitchenModal"
      [modal]="true"
      [style]="{ width: '90%', 'max-width': '450px' }">
      <form
        [formGroup]="kitchenForm"
        (ngSubmit)="onConfirmKitchenCreation()"
        class="space-y-4 pt-2">
        <div>
          <label
            class="block text-xs font-semibold uppercase text-surface-600 dark:text-surface-300 mb-2"
            >Kitchen Name</label
          >
          <input
            type="text"
            formControlName="name"
            class="w-full h-[42px] px-4 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-50 text-sm outline-none"
            placeholder="Bistro 88 Main Kitchen" />
        </div>
        <div>
          <label
            class="block text-xs font-semibold uppercase text-surface-600 dark:text-surface-300 mb-2"
            >Description</label
          >
          <input
            type="text"
            formControlName="description"
            class="w-full h-[42px] px-4 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-50 text-sm outline-none"
            placeholder="Shared workspace for team dinner prep" />
        </div>
        <div class="flex justify-end gap-3 pt-4">
          <button
            type="button"
            (click)="showCreateKitchenModal.set(false)"
            class="h-[42px] px-4 rounded-xl bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 text-sm font-medium">
            Cancel
          </button>
          <button
            type="submit"
            [disabled]="kitchenForm.invalid"
            class="h-[42px] px-5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold shadow-lg shadow-orange-500/20">
            Create Workspace
          </button>
        </div>
      </form>
    </p-dialog>
    <!-- Manage Kitchen Modal -->
    <p-dialog
      header="Manage Kitchen Members"
      [(visible)]="showManageKitchenModal"
      [modal]="true"
      [style]="{ width: '90%', 'max-width': '500px' }">
      <div class="space-y-6 pt-2">
        <!-- Invite Form -->
        <form
          [formGroup]="inviteForm"
          (ngSubmit)="onInviteMember()"
          class="flex flex-col gap-3 p-4 rounded-xl bg-surface-100 dark:bg-surface-800">
          <h3 class="text-sm font-semibold text-surface-800 dark:text-surface-100">
            Invite New Member
          </h3>
          <div class="flex gap-2 items-start">
            <div class="flex-1">
              <input
                type="email"
                formControlName="email"
                placeholder="User Email"
                class="w-full h-[42px] px-4 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-50 text-sm outline-none" />
            </div>
            <select
              formControlName="role"
              class="h-[42px] px-3 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-50 text-sm outline-none">
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <button
            type="submit"
            [disabled]="inviteForm.invalid || isInviting()"
            class="h-[42px] w-full rounded-xl bg-surface-200 dark:bg-surface-700 hover:bg-surface-300 dark:hover:bg-surface-600 text-surface-800 dark:text-surface-100 text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            @if (isInviting()) {
              <i class="pi pi-spin pi-spinner"></i>
            }
            Send Invitation
          </button>
        </form>

        <!-- Member List -->
        <div class="space-y-3">
          <h3 class="text-sm font-semibold text-surface-800 dark:text-surface-100">
            Current Members
          </h3>
          @if (isLoadingMembers()) {
            <div class="text-center p-4 text-surface-500">
              <i class="pi pi-spin pi-spinner text-xl"></i>
            </div>
          } @else {
            @for (m of kitchenMembers(); track m.id) {
              <div
                class="flex items-center justify-between p-3 rounded-lg border border-surface-200 dark:border-surface-700">
                <div>
                  <div class="text-sm font-medium text-surface-800 dark:text-surface-100">
                    {{ m.fullName }}
                  </div>
                  <div class="text-xs text-surface-500">
                    {{ m.email }} • <span class="capitalize">{{ m.role }}</span>
                  </div>
                </div>
                @if (m.userId !== authService.currentUser()?.id) {
                  <button
                    (click)="onRemoveMember(m.userId)"
                    class="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                    <i class="pi pi-trash"></i>
                  </button>
                }
              </div>
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
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);

  readonly isSavingProfile = signal(false);
  readonly isChangingPassword = signal(false);
  readonly sessions = signal<UserSession[]>([]);
  readonly showCreateKitchenModal = signal(false);
  readonly isCreatingKitchen = signal(false);

  // Kitchen management signals
  readonly showManageKitchenModal = signal(false);
  readonly manageKitchenId = signal<string | null>(null);
  readonly kitchenMembers = signal<KitchenMember[]>([]);
  readonly isLoadingMembers = signal(false);
  readonly isInviting = signal(false);

  readonly profileForm = this.fb.group({
    fullName: ['', [Validators.required]],
    themePreference: ['system', [Validators.required]],
  });

  readonly passwordForm = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  readonly kitchenForm = this.fb.group({
    name: ['', [Validators.required]],
    description: [''],
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
    const { fullName, themePreference } = this.profileForm.value;

    this.authService
      .updateProfile({
        fullName: fullName!,
        themePreference: themePreference as 'system' | 'light' | 'dark',
      })
      .subscribe({
        next: () => {
          this.isSavingProfile.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Profile updated',
          });
        },
        error: () => {
          this.isSavingProfile.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update profile',
          });
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
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Password changed successfully',
        });
      },
      error: (err) => {
        this.isChangingPassword.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Failed to change password',
        });
      },
    });
  }

  onRevokeAllSessions() {
    this.authService.revokeAllSessions().subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sessions Revoked',
          detail: 'Logged out from all devices',
        });
      },
    });
  }

  onConfirmKitchenCreation() {
    if (this.kitchenForm.invalid) return;
    this.isCreatingKitchen.set(true);
    const { name, description } = this.kitchenForm.value;

    this.kitchenService.createKitchen(name!, description || '').subscribe({
      next: () => {
        this.isCreatingKitchen.set(false);
        this.showCreateKitchenModal.set(false);
        this.kitchenForm.reset();
        this.messageService.add({
          severity: 'success',
          summary: 'Kitchen Created',
          detail: 'Shared workspace added',
        });
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
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load members',
        });
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
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Member invited',
          });
        },
        error: () => {
          this.isInviting.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to invite member',
          });
        },
      });
  }

  onRemoveMember(userId: string) {
    if (!this.manageKitchenId()) return;

    this.kitchenService.removeMember(this.manageKitchenId()!, userId).subscribe({
      next: () => {
        this.loadKitchenMembers(this.manageKitchenId()!);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Member removed',
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to remove member',
        });
      },
    });
  }
}
